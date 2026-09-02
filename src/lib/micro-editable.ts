import { getMicroClient } from "@/lib/micro";

export type EditableObjectType = "identity" | "organization";
export type EditablePropertyType =
  | "str"
  | "text"
  | "num"
  | "bool"
  | "date"
  | "select_str"
  | "multi_str"
  | "multiselect_str"
  | "jsonb";

export type EditablePropertyOption = {
  slug: string;
  value: string;
};

export type EditableProperty = {
  slug: string;
  name: string;
  group: string;
  type: EditablePropertyType;
  required: boolean;
  value: unknown;
};

type PropertyDefinition = {
  slug: string;
  name?: string | null;
  type: string;
  locked?: boolean;
  required?: boolean;
  options?: Array<{ slug?: string; value?: string | null }>;
};

const SUPPORTED_TYPES = new Set<EditablePropertyType>([
  "str",
  "text",
  "num",
  "bool",
  "date",
  "select_str",
  "multi_str",
  "multiselect_str",
  "jsonb",
]);

const AUDIT_FIELDS = new Set([
  "created_at",
  "created_by",
  "updated_at",
  "updated_by",
  "last_updated_at",
  "source_created_at",
]);

const PERSON_GROUPS = [
  ["Basics", ["full_name", "title", "tagline", "photo_url", "banner_image"]],
  ["Relationship", ["summary", "about", "relationship_strength", "labels"]],
  ["Work", ["department", "roles", "seniority", "years_of_experience", "skills_and_interests"]],
  ["Contact & location", ["phone", "birthday", "city", "state", "country", "address_1", "address_2", "zip_code"]],
  ["Social", ["linkedin", "twitter", "github", "crunchbase"]],
] as const;

const COMPANY_GROUPS = [
  ["Basics", ["name", "tagline", "primary_domain", "domains", "type", "operating_status", "categories", "banner_url"]],
  ["Relationship", ["summary", "about", "relationship_strength", "health", "priority", "stage", "labels", "source", "next_steps", "notes"]],
  ["Company details", ["employee_count", "employee_range", "founded_year", "estimated_annual_revenue", "estimated_annual_revenue_range"]],
  ["Financials", ["arr", "valuation", "market_cap"]],
  ["Funding", ["funding_raised", "last_funding_round", "last_funding_amount", "last_funding_round_date"]],
  ["Sales", ["deal_value", "likelihood_to_close", "start_date", "close_date", "team", "lost_reason", "dropped_out_reason", "rejected_reason", "pass_reason"]],
  ["Investing", ["aum", "fund_size", "investor_type", "check_size", "rounds_led", "rounds_participated", "sectors_invested"]],
  ["Location", ["city", "state", "country", "address_1", "address_2", "zip_code"]],
  ["Social", ["linkedin", "twitter", "crunchbase", "facebook"]],
] as const;

const HIDDEN_FIELDS: Record<EditableObjectType, Set<string>> = {
  identity: new Set([
    "first_name",
    "middle_name",
    "last_name",
    "facebook_likes",
    "linkedin_followers",
    "twitter_followers",
    "org_chart",
    "source_record_id",
    "source_system",
    "status",
    "tags",
  ]),
  organization: new Set([
    "applying_to",
    "facebook_likes",
    "investment_amount",
    "linkedin_followers",
    "twitter_followers",
    "org_chart",
    "role_seniority",
    "source_created_at",
    "source_record_id",
    "source_system",
    "status",
  ]),
};

function fieldLayout(type: EditableObjectType) {
  const groups = type === "identity" ? PERSON_GROUPS : COMPANY_GROUPS;
  const layout = new Map<string, { group: string; order: number }>();
  let order = 0;
  for (const [group, slugs] of groups) {
    for (const slug of slugs) {
      layout.set(slug, { group, order });
      order += 1;
    }
  }
  return layout;
}

const definitionCache = new Map<
  string,
  { expiresAt: number; promise: Promise<PropertyDefinition[]> }
>();

function objectResource(type: EditableObjectType) {
  const micro = getMicroClient();
  return type === "identity"
    ? micro.prism.objects.identities
    : micro.prism.objects.organizations;
}

async function definitions(type: EditableObjectType, includeOptions: boolean) {
  const key = `${type}:${includeOptions ? "options" : "fields"}`;
  const cached = definitionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = (async () => {
    const micro = getMicroClient();
    const response = await micro.prism.properties.list(type, {
      include_options: includeOptions,
    });
    const definitionsById = response[type];
    if (!definitionsById || typeof definitionsById !== "object" || Array.isArray(definitionsById)) {
      return [] as PropertyDefinition[];
    }
    const bySlug = new Map<string, PropertyDefinition>();
    for (const value of Object.values(definitionsById)) {
      if (!value || typeof value !== "object") continue;
      const definition = value as PropertyDefinition;
      if (
        !definition.slug ||
        definition.locked ||
        AUDIT_FIELDS.has(definition.slug) ||
        !SUPPORTED_TYPES.has(definition.type as EditablePropertyType) ||
        bySlug.has(definition.slug)
      ) {
        continue;
      }
      bySlug.set(definition.slug, definition);
    }
    return [...bySlug.values()];
  })();
  definitionCache.set(key, { expiresAt: Date.now() + 10 * 60_000, promise });
  void promise.catch(() => {
    if (definitionCache.get(key)?.promise === promise) definitionCache.delete(key);
  });
  return promise;
}

function hasValue(value: unknown) {
  if (value == null || value === "") return false;
  return !Array.isArray(value) || value.length > 0;
}

export async function getEditableRecord(type: EditableObjectType, id: string) {
  const [record, propertyDefinitions] = await Promise.all([
    objectResource(type).get(id),
    definitions(type, false),
  ]);
  const raw = record as unknown as {
    properties?: Record<string, unknown>;
    default?: Record<string, unknown>;
  };
  const properties = raw.properties ?? raw.default ?? {};
  const layout = fieldLayout(type);
  const fields: EditableProperty[] = propertyDefinitions
    .filter((definition) => !HIDDEN_FIELDS[type].has(definition.slug))
    .map((definition) => ({
      slug: definition.slug,
      name:
        definition.name?.trim() ||
        definition.slug.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
      group: layout.get(definition.slug)?.group || "Other",
      type: definition.type as EditablePropertyType,
      required: Boolean(definition.required),
      value: properties[definition.slug] ?? null,
    }))
    .sort((left, right) => {
      const leftLayout = layout.get(left.slug);
      const rightLayout = layout.get(right.slug);
      if (leftLayout || rightLayout) {
        return (leftLayout?.order ?? Number.MAX_SAFE_INTEGER) - (rightLayout?.order ?? Number.MAX_SAFE_INTEGER);
      }
      const populated = Number(hasValue(right.value)) - Number(hasValue(left.value));
      return populated || left.name.localeCompare(right.name);
    });
  return { fields };
}

export async function getEditablePropertyOptions(
  type: EditableObjectType,
  slug: string,
): Promise<EditablePropertyOption[]> {
  const propertyDefinitions = await definitions(type, true);
  const definition = propertyDefinitions.find((item) => item.slug === slug);
  return (definition?.options ?? [])
    .map((option) => ({
      slug: option.slug?.trim() || "",
      value: option.value?.trim() || option.slug?.trim() || "",
    }))
    .filter((option) => option.slug && option.value);
}

function stringList(value: unknown) {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Expected a list of text values.");
  }
  return [...new Set(value.map((item) => item.trim()).filter(Boolean))].slice(0, 100);
}

export async function updateEditableRecord(
  type: EditableObjectType,
  id: string,
  submitted: unknown,
) {
  if (!submitted || typeof submitted !== "object" || Array.isArray(submitted)) {
    throw new Error("Changed properties are required.");
  }
  const propertyDefinitions = await definitions(type, false);
  const bySlug = new Map(
    propertyDefinitions
      .filter((definition) => !HIDDEN_FIELDS[type].has(definition.slug))
      .map((definition) => [definition.slug, definition]),
  );
  const properties: Record<string, unknown> = {};

  for (const [slug, value] of Object.entries(submitted)) {
    const definition = bySlug.get(slug);
    if (!definition) continue;
    if ((value == null || value === "" || (Array.isArray(value) && value.length === 0)) && definition.required) {
      throw new Error(`${definition.name || slug} is required.`);
    }
    switch (definition.type as EditablePropertyType) {
      case "num":
        if (value !== null && typeof value !== "number") throw new Error(`${definition.name || slug} must be a number.`);
        properties[slug] = value;
        break;
      case "bool":
        if (value !== null && typeof value !== "boolean") {
          throw new Error(`${definition.name || slug} must be true or false.`);
        }
        properties[slug] = value;
        break;
      case "multi_str":
      case "multiselect_str":
        properties[slug] = stringList(value);
        break;
      case "jsonb":
        properties[slug] = value;
        break;
      default:
        if (typeof value !== "string") throw new Error(`${definition.name || slug} must be text.`);
        properties[slug] = value.trim().slice(0, 10_000);
    }
  }
  if (Object.keys(properties).length === 0) throw new Error("No editable properties changed.");

  const resource = objectResource(type);
  await resource.update(id, {
    default: properties,
    "If-Match": "*",
  });
}
