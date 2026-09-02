import type { PeopleView, Person, ProfileHistoryItem } from "@/lib/data";
import { colorFromId, formatShortDate, isoDate } from "@/lib/data";
import {
  asSummary,
  asRefs,
  asString,
  formatStrength,
  getMicroClient,
  lastMeetingIso,
  locationLabel,
  propertiesOf,
  type PrismRow,
} from "@/lib/micro";
import { emailDomain, findCompaniesByNames, findCompanyByDomain, getCompany } from "@/lib/micro-companies";
import { companyLogoUrl, usablePhotoUrl } from "@/lib/photo-url";
import { socialHandlesFrom } from "@/lib/social";

export const PEOPLE_PAGE_SIZE = 25;

const IDENTITY = {
  FULL_NAME: "6efbbc0d-2675-4a6f-b8ec-0fb911843c86",
  TITLE: "bd52f8a1-7fbb-4495-8697-7eee5c9f0d08",
  TAGLINE: "8e6114e0-c25f-4041-ae78-b4ca2e17af28",
  PHOTO_URL: "a4be5426-a2c3-43ae-82f8-df8ec0faea47",
  SUMMARY: "1bf578c8-ac25-4b9d-bb6f-e141e53e31fa",
  LAST_INTERACTION_DATE: "9cfe1e18-91af-4937-8099-7ffed6129a45",
  EMAIL: "1289e393-6d6f-4fc3-9a08-f8187c26e0df",
  EMAIL_ADDRESSES: "67b84f06-b929-4942-964c-bda1a227b397",
  EMAIL_ADDRESS_TYPE: "601d8ef0-673b-4b2a-8efb-e1a947ae6e6f",
} as const;

const EMAIL_TYPE = {
  SYSTEM: "08211e05-5b4a-4011-aa26-23c6a9782537",
  GROUP: "216ef2ae-de40-41d9-af5e-2dc8191d8b9b",
  HUMAN: "fd7a113a-1af6-4acc-9910-a7fadbd9ee30",
} as const;

type PrismProp = {
  value?: unknown;
  opt_id?: string;
};

function asRows(response: unknown): PrismRow[] {
  if (Array.isArray(response)) return response as PrismRow[];
  if (response && typeof response === "object" && Array.isArray((response as { data?: unknown }).data)) {
    return (response as { data: PrismRow[] }).data;
  }
  return [];
}

function looksLikeEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function propValue(properties: Record<string, unknown>, id: string) {
  const prop = properties[id];
  if (prop && typeof prop === "object" && "value" in prop) {
    return (prop as PrismProp).value;
  }
  return prop;
}

function propOpt(properties: Record<string, unknown>, id: string) {
  const prop = properties[id];
  if (prop && typeof prop === "object") {
    const record = prop as PrismProp & Record<string, unknown>;
    if (typeof record.opt_id === "string") return record.opt_id;
    const value = record.value;
    if (value && typeof value === "object" && "opt_id" in value) {
      return asString((value as { opt_id?: unknown }).opt_id);
    }
  }
  return "";
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if ("properties" in value && value.properties && typeof value.properties === "object") {
    return value.properties as Record<string, unknown>;
  }
  return value as Record<string, unknown>;
}

function nestedContacts(value: unknown): Record<string, unknown>[] {
  const unwrapped =
    value && typeof value === "object" && "value" in value ? (value as { value?: unknown }).value : value;
  const list = Array.isArray(unwrapped) ? unwrapped : unwrapped ? [unwrapped] : [];
  return list.map(asRecord).filter((item): item is Record<string, unknown> => item !== null);
}

function emailFromContact(contact: Record<string, unknown>) {
  const email = asString(propValue(contact, IDENTITY.EMAIL) ?? contact.email).trim();
  return looksLikeEmail(email) ? email : "";
}

function emailTypeOf(contact: Record<string, unknown>) {
  return (
    propOpt(contact, IDENTITY.EMAIL_ADDRESS_TYPE) ||
    asString(contact.email_address_type).trim().toLowerCase()
  );
}

function isSkippedEmailType(type: string) {
  return (
    type === EMAIL_TYPE.SYSTEM ||
    type === EMAIL_TYPE.GROUP ||
    type === "system" ||
    type === "group"
  );
}

function extractPrimaryEmail(row: PrismRow, properties: Record<string, unknown>, name = "") {
  const emails = extractRealEmails(row, properties);
  return pickBestEmail(name, emails);
}

function meEmail() {
  return process.env.MICRO_ME_EMAIL?.trim().toLowerCase() ?? "";
}

function isMe(row: PrismRow, email: string) {
  if (row.is_user_object === true) return true;
  const mine = meEmail();
  return Boolean(mine && email.toLowerCase() === mine);
}

function firstCompany(properties: Record<string, unknown>) {
  return asRefs(properties.companies)[0] ?? asRefs(propValue(properties, "companies"))[0] ?? null;
}

function extractRealEmails(row: PrismRow, properties: Record<string, unknown>) {
  const emails: string[] = [];
  const seen = new Set<string>();

  const add = (value: string) => {
    const email = value.trim().toLowerCase();
    if (!looksLikeEmail(email) || seen.has(email)) return;
    seen.add(email);
    emails.push(email);
  };

  const top = typeof row.email === "string" ? row.email : "";
  add(top);
  add(asString(propValue(properties, IDENTITY.EMAIL) ?? properties.email));

  const contacts = nestedContacts(propValue(properties, IDENTITY.EMAIL_ADDRESSES) ?? properties.email_addresses);
  for (const contact of contacts) {
    if (isSkippedEmailType(emailTypeOf(contact))) continue;
    add(emailFromContact(contact));
  }

  return emails;
}

function emailLocalPart(email: string) {
  return email.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() ?? "";
}

function nameTokens(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(" ")
    .filter((part) => part.length > 1);
}

function scoreEmail(email: string, name: string) {
  const local = emailLocalPart(email);
  let score = emailDomain(email) ? 10 : 0;
  if (nameTokens(name).some((part) => local.includes(part))) score += 8;
  if (local && name.toLowerCase().includes(local.slice(0, 4))) score += 2;
  return score;
}

function rankedWorkDomains(emails: string[]) {
  const counts = new Map<string, number>();
  for (const email of emails) {
    const domain = emailDomain(email);
    if (!domain) continue;
    counts.set(domain, (counts.get(domain) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([domain]) => domain);
}

function pickBestEmail(name: string, emails: string[]) {
  if (emails.length === 0) return "";
  const preferredDomain = rankedWorkDomains(emails)[0];
  const pool = preferredDomain ? emails.filter((email) => email.endsWith(`@${preferredDomain}`)) : emails;
  const ranked = (pool.length > 0 ? pool : emails).sort((left, right) => scoreEmail(right, name) - scoreEmail(left, name));
  return ranked[0] ?? "";
}

function historyItems(value: unknown): ProfileHistoryItem[] {
  const list = Array.isArray(value) ? value : [];
  const items: ProfileHistoryItem[] = [];

  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const record = item as { id?: unknown; properties?: unknown };
    const properties =
      record.properties && typeof record.properties === "object" && !Array.isArray(record.properties)
        ? (record.properties as Record<string, unknown>)
        : {};
    const organizationRef =
      properties.organization && typeof properties.organization === "object"
        ? (properties.organization as { id?: unknown; properties?: Record<string, unknown> })
        : null;
    const organizationProperties = organizationRef?.properties ?? {};
    const organization =
      asString(properties.institution).trim() ||
      asString(organizationRef?.properties?.name).trim();
    const title = asString(properties.position).trim();
    if (!organization && !title) continue;

    items.push({
      id: asString(record.id).trim() || `${organization}-${title}`,
      organizationId: asString(organizationRef?.id).trim() || undefined,
      organization,
      title,
      logoUrl:
        companyLogoUrl(
          asString(organizationProperties.logo_url),
          asString(organizationProperties.primary_domain),
        ) || undefined,
      startDate: asString(properties.start).trim() || undefined,
      endDate: asString(properties.end).trim() || undefined,
    });
  }

  return items.sort((left, right) => (right.startDate ?? "").localeCompare(left.startDate ?? ""));
}

function stringList(value: unknown) {
  const unwrapped =
    value && typeof value === "object" && !Array.isArray(value) && "value" in value
      ? (value as { value?: unknown }).value
      : value;
  const values = Array.isArray(unwrapped) ? unwrapped : unwrapped ? [unwrapped] : [];
  return [...new Set(values.map((item) => asString(item).trim()).filter(Boolean))];
}

let skillLabelsCache:
  | { expiresAt: number; promise: Promise<Map<string, string>> }
  | undefined;

function skillLabels() {
  if (skillLabelsCache && skillLabelsCache.expiresAt > Date.now()) {
    return skillLabelsCache.promise;
  }

  const promise = getMicroClient()
    .prism.properties.list("identity", { include_options: true })
    .then((response) => {
      const definitions = Object.values(
        (response as unknown as {
          identity?: Record<
            string,
            {
              slug?: string;
              options?: Array<{ slug?: string; value?: string | null }>;
            }
          >;
        }).identity ?? {},
      );
      const property = definitions.find(
        (definition) => definition.slug === "skills_and_interests",
      );
      return new Map(
        (property?.options ?? []).flatMap((option) =>
          option.slug && option.value ? [[option.slug, option.value] as const] : [],
        ),
      );
    });

  skillLabelsCache = { expiresAt: Date.now() + 10 * 60_000, promise };
  return promise;
}

async function hydrateSkillLabels(person: Person) {
  if (!person.skillsAndInterests?.length) return person;
  const labels = await skillLabels();
  return {
    ...person,
    skillsAndInterests: person.skillsAndInterests.map(
      (skill) => labels.get(skill) ?? skill,
    ),
  };
}

export function mapPerson(row: PrismRow): Person | null {
  if (row.is_human_type === false) return null;

  const properties = propertiesOf(row);
  const name =
    asString(propValue(properties, IDENTITY.FULL_NAME) ?? properties.full_name).trim() ||
    asString(properties.name).trim();
  if (!name) return null;

  const lastInteractionRaw = asString(
    propValue(properties, IDENTITY.LAST_INTERACTION_DATE) ?? properties.last_interaction_date,
  );
  const lastInteraction = lastInteractionRaw ? isoDate(lastInteractionRaw) : "";
  const lastMeeting = lastMeetingIso(
    propValue(properties, "last_calendar_event") ?? properties.last_calendar_event,
    lastInteraction,
  );
  const email = extractPrimaryEmail(row, properties, name);
  if (looksLikeGroupName(name) || isRoleMailbox(email) || !isLikelyHumanIdentity(row, name, email)) return null;
  const extraEmails = extractRealEmails(row, properties).filter((item) => item !== email.toLowerCase());
  const company = firstCompany(properties);
  const companyName = asString(company?.properties?.name).trim();
  const summary = asSummary(propValue(properties, IDENTITY.SUMMARY) ?? properties.summary);

  return {
    id: row.id,
    name,
    title:
      asString(propValue(properties, IDENTITY.TITLE) ?? properties.title).trim() ||
      asString(propValue(properties, IDENTITY.TAGLINE) ?? properties.tagline).trim(),
    companyId: company?.id ?? "",
    companyName,
    email,
    extraEmailCount: extraEmails.length,
    photoUrl: usablePhotoUrl(asString(propValue(properties, IDENTITY.PHOTO_URL) ?? properties.photo_url)),
    summary,
    about: asSummary(properties.about),
    location: locationLabel(properties),
    city: asString(properties.city).trim(),
    country: asString(properties.country).trim(),
    workHistory: historyItems(properties.work_history),
    educationHistory: historyItems(properties.education_history),
    skillsAndInterests: [
      ...new Set([
        ...stringList(properties.skills_and_interests),
        ...stringList(properties.skills),
      ]),
    ],
    lastInteraction,
    lastMeeting,
    lastNoteLabel: lastMeeting ? formatShortDate(lastMeeting) : "—",
    noteCount: 0,
    relationshipStrength: formatStrength(
      propValue(properties, "relationship_strength") ?? properties.relationship_strength,
    ),
    isMe: isMe(row, email) || undefined,
    avatarColor: colorFromId(row.id),
    ...socialHandlesFrom(properties),
  };
}

const IDENTITY_SELECT = [
  "full_name",
  "title",
  "tagline",
  "photo_url",
  "summary",
  "about",
  "city",
  "country",
  "last_interaction_date",
  "last_calendar_event.start",
  "relationship_strength",
  "email_addresses.email",
  "email_addresses.email_address_type",
  "companies.name",
] as const;

const PERSON_DETAIL_SELECT = [
  ...IDENTITY_SELECT,
  "linkedin",
  "github",
  "twitter",
  "crunchbase",
  "skills_and_interests",
  "work_history.institution",
  "work_history.position",
  "work_history.start",
  "work_history.end",
  "work_history.organization.name",
  "work_history.organization.logo_url",
  "work_history.organization.primary_domain",
  "education_history.institution",
  "education_history.position",
  "education_history.start",
  "education_history.end",
] as const;

async function queryIdentitiesV2(options: { page?: number; q?: string }) {
  const micro = getMicroClient();
  const q = options.q?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);
  const response = await micro.prism.objects.identities.query({
    query: {
      select: [...IDENTITY_SELECT],
      sort: [{ last_interaction_date: "desc" }],
      limit: PEOPLE_PAGE_SIZE,
      page,
      ...(q
        ? {
            combinator: "OR" as const,
            filter: [
              { full_name: { contains: q } },
              { title: { contains: q } },
              { tagline: { contains: q } },
              { summary: { contains: q } },
            ],
          }
        : {}),
    },
  });

  const items = (response.data ?? [])
    .map((row) => mapPerson(row))
    .filter((person): person is Person => person !== null);

  return {
    items,
    hasMore: Boolean(response.has_more),
    nextPage: page + 1,
  };
}

async function queryIdentitiesV1(options: { page?: number; q?: string }) {
  const micro = getMicroClient();
  const page = Math.max(1, options.page ?? 1);
  const q = options.q?.trim() ?? "";

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const strFilters = q
    ? [
        { prop_def_id: IDENTITY.FULL_NAME, comparator: "like_regex" as const, value: escaped },
        { prop_def_id: IDENTITY.TITLE, comparator: "like_regex" as const, value: escaped },
        { prop_def_id: IDENTITY.TAGLINE, comparator: "like_regex" as const, value: escaped },
        { prop_def_id: IDENTITY.SUMMARY, comparator: "like_regex" as const, value: escaped },
      ]
    : [];

  const response = await micro.post(`/v1/prism/query/${micro.teamID}/identity`, {
    body: {
      query: {
        identity_view_select_str: [
          { prop_def_id: IDENTITY.FULL_NAME },
          { prop_def_id: IDENTITY.TITLE },
          { prop_def_id: IDENTITY.TAGLINE },
          { prop_def_id: IDENTITY.PHOTO_URL },
          { prop_def_id: IDENTITY.SUMMARY },
        ],
        identity_view_select_multiref_contact: [
          {
            prop_def_id: IDENTITY.EMAIL_ADDRESSES,
            ref_view: {
              contact_view_select_str: [{ prop_def_id: IDENTITY.EMAIL }],
              contact_view_select_select_str: [{ prop_def_id: IDENTITY.EMAIL_ADDRESS_TYPE }],
            },
          },
        ],
        identity_view_select_date: [{ prop_def_id: IDENTITY.LAST_INTERACTION_DATE }],
        combinator: q ? "OR" : "AND",
        ...(strFilters.length > 0 ? { identity_view_filter_str: strFilters } : {}),
        identity_view_sort_date: [{ prop_def_id: IDENTITY.LAST_INTERACTION_DATE, ascending: false }],
      },
      limit: PEOPLE_PAGE_SIZE,
      page,
    },
  });

  const rows = asRows(response);
  const items = rows.map((row) => mapPerson(row)).filter((person): person is Person => person !== null);

  return {
    items,
    hasMore: rows.length >= PEOPLE_PAGE_SIZE,
    nextPage: page + 1,
  };
}

type PeoplePage = {
  items: Person[];
  hasMore: boolean;
  nextPage: number;
};

export async function queryPeople(options: { page?: number; q?: string; viewId?: string }): Promise<PeoplePage> {
  if (options.q?.trim()) {
    try {
      return await queryIdentitiesV2(options);
    } catch {
      return queryIdentitiesV1(options);
    }
  }

  if (options.viewId) {
    return queryPeopleByView(options);
  }

  try {
    return await queryIdentitiesV2(options);
  } catch {
    return queryIdentitiesV1(options);
  }
}

export async function listPeopleViews(): Promise<PeopleView[]> {
  const micro = getMicroClient();
  const listed = await micro.views.list("identity", { limit: 50 });
  const views: PeopleView[] = [];
  const seen = new Set<string>();

  for (const view of listed.data ?? []) {
    if (view.list_id || !view.id || !view.name.trim()) continue;
    if (seen.has(view.name)) continue;
    seen.add(view.name);
    views.push({ id: view.id, name: view.name });
  }

  return views;
}

async function queryPeopleByView(options: { viewId?: string; q?: string; page?: number }): Promise<PeoplePage> {
  const viewId = options.viewId?.trim() ?? "";
  const page = Math.max(1, options.page ?? 1);
  const micro = getMicroClient();
  const records = await micro.views.records.list(viewId, {
    objectType: "identity",
    limit: PEOPLE_PAGE_SIZE,
    page,
  });

  const rows = (records.data ?? []) as PrismRow[];
  const ids = rows.map((row) => row.id).filter(Boolean);
  const response =
    ids.length > 0
      ? await micro.prism.objects.identities.query({
          id: ids,
          query: { select: [...IDENTITY_SELECT], limit: PEOPLE_PAGE_SIZE },
        })
      : { data: [] };
  const peopleById = new Map(
    (response.data ?? [])
      .map((row) => mapPerson(row))
      .filter((person): person is Person => person !== null)
      .map((person) => [person.id, person]),
  );
  const items = rows
    .map((row) => peopleById.get(row.id) ?? mapPerson(row))
    .filter((person): person is Person => person !== null);

  return {
    items,
    hasMore: Boolean(records.has_more),
    nextPage: page + 1,
  };
}

export async function getPerson(id: string, options: { fallback?: boolean } = {}): Promise<Person | null> {
  const micro = getMicroClient();
  let lastError: unknown;
  for (const select of [PERSON_DETAIL_SELECT, IDENTITY_SELECT] as const) {
    try {
      const response = await micro.prism.objects.identities.query({
        id: [id],
        query: { select: [...select], limit: 1 },
      });
      const row = response.data?.[0];
      const person = row ? mapPerson(row) : null;
      if (!person) return null;
      const withSkillLabels = await hydrateSkillLabels(person).catch(() => person);
      const withHistoryOrganizations = await hydrateHistoryOrganizations(withSkillLabels).catch(
        () => withSkillLabels,
      );
      return hydratePersonCompany(withHistoryOrganizations).catch(() => withHistoryOrganizations);
    } catch (error) {
      lastError = error;
    }
  }
  if (options.fallback === false) return null;
  throw lastError instanceof Error ? lastError : new Error("Could not load person.");
}

async function hydrateHistoryOrganizations(person: Person): Promise<Person> {
  const workHistory = person.workHistory ?? [];
  const educationHistory = person.educationHistory ?? [];
  const names = [...workHistory, ...educationHistory]
    .filter((item) => !item.logoUrl)
    .map((item) => item.organization);
  const companies = await findCompaniesByNames(names);
  if (companies.length === 0) return person;

  const byName = new Map(companies.map((company) => [company.name.toLowerCase(), company]));
  const hydrate = (item: ProfileHistoryItem): ProfileHistoryItem => {
    const company = byName.get(item.organization.toLowerCase());
    if (!company) return item;
    return {
      ...item,
      organizationId: item.organizationId || company.id,
      logoUrl: item.logoUrl || company.logoUrl || undefined,
    };
  };

  return {
    ...person,
    workHistory: workHistory.map(hydrate),
    educationHistory: educationHistory.map(hydrate),
  };
}

async function hydratePersonCompany(person: Person): Promise<Person> {
  if (person.companyId && !person.companyName) {
    const linked = await getCompany(person.companyId, { fallback: false });
    if (linked) return { ...person, companyName: linked.name };
  }

  if (person.companyName) return person;

  const domains = rankedWorkDomains(person.email ? [person.email] : []);
  for (const domain of domains) {
    const fromEmail = await findCompanyByDomain(domain);
    if (fromEmail) return { ...person, companyId: fromEmail.id, companyName: fromEmail.name };
  }
  return person;
}

const ROLE_MAILBOX =
  /^(team|hello|hey|hi|info|invite|hiring|support|dev|noreply|no-reply|admin|mailer|notifications|sales|press)$/i;

function isRoleMailbox(email: string) {
  return ROLE_MAILBOX.test(email.split("@")[0] ?? "");
}

function looksLikeGroupName(name: string) {
  const normalized = name.trim();
  return (
    /^(team|hello)\b/i.test(normalized) ||
    /^a16z\b/i.test(normalized) ||
    /\b(newsletter|report|news|rsvp|zoom|games?|practices?|talentplace|programs?|marketplace|team|audit|confirmation|consumer|front desk|accounting|meetingspace|monitoring|assessment)\b/i.test(
      normalized,
    ) ||
    /^startups$/i.test(normalized) ||
    /^[A-Z0-9]{2,}$/.test(normalized) ||
    /<[^>]*@[^>]*>.*,/.test(normalized)
  );
}

function isLikelyHumanIdentity(row: PrismRow, name: string, email: string) {
  if (typeof row.is_human_type === "boolean") return row.is_human_type;
  if (row.is_user_object) return true;

  const local = emailLocalPart(email);
  if (!local) return false;
  return nameTokens(name).some((token) => token.length >= 3 && (local.includes(token) || token.includes(local)));
}

type IdentityQueryParams = Parameters<
  ReturnType<typeof getMicroClient>["prism"]["objects"]["identities"]["query"]
>[0];
type IdentityFilter = NonNullable<IdentityQueryParams["query"]["filter"]>[number];

async function queryIdentityRows(filter: IdentityFilter, pages = 3) {
  const micro = getMicroClient();
  const rows: PrismRow[] = [];

  for (let page = 1; page <= pages; page += 1) {
    const response = await micro.prism.objects.identities
      .query({
        query: {
          select: [...IDENTITY_SELECT],
          sort: [{ last_interaction_date: "desc" }],
          limit: 50,
          page,
          filter: [filter],
        },
      })
      .catch(() => null);
    if (!response) break;
    rows.push(...((response.data ?? []) as PrismRow[]));
    if (!response.has_more) break;
  }

  return rows;
}

function rootDomains(values: Array<string | undefined>) {
  const domains = [...new Set(values)]
    .map((domain) => domain?.trim().toLowerCase().replace(/^@/, "") ?? "")
    .filter(Boolean);
  return domains.filter(
    (domain) =>
      !domains.some(
        (candidate) =>
          candidate !== domain && domain.endsWith(`.${candidate}`),
      ),
  );
}

function rowMatchesCompany(
  row: PrismRow,
  options: { domains?: string[]; name?: string },
) {
  const properties = propertiesOf(row);
  const domains = options.domains ?? [];
  const name = options.name?.trim().toLowerCase() ?? "";
  const hasCompanyEmail =
    domains.length > 0 &&
    extractRealEmails(row, properties).some((email) => {
      const candidateDomain = emailDomain(email);
      return domains.some(
        (domain) =>
          candidateDomain === domain || candidateDomain.endsWith(`.${domain}`),
      );
    });
  const hasCurrentCompany =
    Boolean(name) &&
    asRefs(properties.companies).some(
      (company) =>
        asString(company.properties?.name).trim().toLowerCase() === name,
    );
  return hasCompanyEmail || hasCurrentCompany;
}

export async function queryPeopleAtCompany(options: {
  companyId?: string;
  domain?: string;
  domains?: string[];
  name?: string;
}): Promise<{ items: Person[]; connectionCount: number }> {
  let domains = rootDomains([options.domain, ...(options.domains ?? [])]);
  let name = options.name?.trim() ?? "";

  if (options.companyId && (domains.length === 0 || !name)) {
    const company = await getCompany(options.companyId, { fallback: false });
    if (domains.length === 0) {
      domains = rootDomains([company?.domain, ...(company?.domains ?? [])]);
    }
    name = name || company?.name || "";
  }

  const filters: IdentityFilter[] = [];
  for (const domain of domains) {
    filters.push({ email_addresses: { contains: domain } });
  }
  if (name) filters.push({ "companies.name": { contains: name } });
  const rows = (await Promise.all(filters.map((filter) => queryIdentityRows(filter)))).flat();

  const seen = new Set<string>();
  const seenNames = new Set<string>();
  const normalizedCompanyName = name.toLowerCase();
  const people = rows
    .flatMap((row) => {
      const person = mapPerson(row);
      const normalizedName = person?.name.trim().toLowerCase() ?? "";
      if (!person || seen.has(person.id) || seenNames.has(normalizedName)) return [];
      if (normalizedCompanyName && normalizedName === normalizedCompanyName) return [];
      if (!rowMatchesCompany(row, { domains, name })) return [];
      seen.add(person.id);
      seenNames.add(normalizedName);
      return [person];
    })
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));

  return {
    items: people,
    connectionCount: people.length,
  };
}
