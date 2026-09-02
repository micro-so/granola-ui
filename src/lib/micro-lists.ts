import { colorFromId } from "@/lib/data";
import { asRefs, asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";

export type MicroListTab = "people" | "companies" | "notes" | "tasks" | "deals";

export type MicroListDefinition = {
  id: string;
  name: string;
  icon: string;
  description: string;
  objectType: string;
  tab: MicroListTab;
  viewId: string;
};

export type MicroListRecord = {
  id: string;
  name: string;
  subtitle: string;
  photoUrl?: string;
  avatarName?: string;
  sourceLogoUrl?: string;
  color: string;
  href?: string;
  status?: string;
};

export type ProfileFolderMembership = {
  id: string;
  name: string;
  icon: string;
  href: string;
};

type RawList = {
  id?: string;
  name?: string;
  icon?: string | null;
  description?: string | null;
  object_type?: string;
  views?: Array<{ id?: string }>;
};

type ListsResponse = {
  data?: RawList[];
};

type RecordsResponse = {
  data?: Array<Record<string, unknown>>;
};

let listsCache:
  | { expiresAt: number; promise: Promise<MicroListDefinition[]> }
  | undefined;

function tabForObjectType(objectType: string): MicroListTab | null {
  if (objectType === "contact" || objectType === "identity") return "people";
  if (objectType === "organization") return "companies";
  if (objectType === "document") return "notes";
  if (objectType === "action") return "tasks";
  if (objectType === "deal") return "deals";
  return null;
}

function firstNestedString(value: unknown, key: string) {
  const first = Array.isArray(value) ? value[0] : value;
  if (!first || typeof first !== "object") return "";
  const record = first as Record<string, unknown>;
  const nested =
    record.properties && typeof record.properties === "object"
      ? (record.properties as Record<string, unknown>)
      : record;
  return asString(nested[key]).trim();
}

function listsPath() {
  const teamId = process.env.MICRO_TEAM_ID;
  if (!teamId) throw new Error("Missing MICRO_TEAM_ID");
  return `/v2/prism/${teamId}/lists`;
}

export async function listMicroLists() {
  if (listsCache && listsCache.expiresAt > Date.now()) return listsCache.promise;

  const promise = (async () => {
    const micro = getMicroClient();
    const response = await micro.get<ListsResponse>(listsPath());
    const raw = response.data ?? [];
    const identityNames = new Set(
      raw
        .filter((list) => list.object_type === "identity")
        .map((list) => list.name?.trim().toLowerCase())
        .filter(Boolean),
    );

    return raw
      .filter((list) => {
        if (!list.id || !list.name?.trim() || !list.views?.[0]?.id) return false;
        if (!tabForObjectType(list.object_type ?? "")) return false;
        return !(
          list.object_type === "contact" &&
          identityNames.has(list.name.trim().toLowerCase())
        );
      })
      .map((list) => ({
        id: list.id!,
        name: list.name!.trim(),
        icon: list.icon?.trim() || "▦",
        description: list.description?.trim() || "",
        objectType: list.object_type!,
        tab: tabForObjectType(list.object_type!)!,
        viewId: list.views![0]!.id!,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  listsCache = { expiresAt: Date.now() + 10 * 60_000, promise };
  void promise.catch(() => {
    if (listsCache?.promise === promise) listsCache = undefined;
  });
  return promise;
}

export async function getMicroList(id: string) {
  const lists = await listMicroLists();
  return lists.find((list) => list.id === id) ?? null;
}

export async function queryMicroListRecords(list: MicroListDefinition) {
  const teamId = process.env.MICRO_TEAM_ID;
  if (!teamId) throw new Error("Missing MICRO_TEAM_ID");
  const micro = getMicroClient();
  const response =
    list.objectType === "contact"
      ? await micro.prism.objects.contacts.query({
          query: {
            select: ["first_name", "last_name", "email"],
            list_id: list.id,
            limit: 50,
          },
        })
      : list.objectType === "identity"
        ? await micro.prism.objects.identities.query({
            query: {
              select: ["full_name", "title", "photo_url", "email_addresses.email"],
              list_id: list.id,
              limit: 50,
            },
          })
        : list.objectType === "organization"
          ? await micro.prism.objects.organizations.query({
              query: {
                select: ["name", "primary_domain", "domains", "logo_url"],
                list_id: list.id,
                limit: 50,
              },
            })
          : list.objectType === "deal"
            ? await micro.prism.objects.deals.query({
                query: {
                  select: [
                    "name",
                    "status",
                    "company.name",
                    "company.logo_url",
                    "people.full_name",
                    "people.photo_url",
                  ],
                  list_id: list.id,
                  limit: 50,
                },
              })
            : list.objectType === "action"
              ? await micro.prism.objects.actions.query({
                  query: { select: ["title", "status"], list_id: list.id, limit: 50 },
                })
              : list.objectType === "document"
                ? await micro.prism.objects.documents.query({
                    query: { select: ["title", "status"], list_id: list.id, limit: 50 },
                  })
                : await micro.get<RecordsResponse>(
                    `/v2/prism/${teamId}/${encodeURIComponent(list.objectType)}/views/${encodeURIComponent(list.viewId)}/records?limit=50`,
                  );

  const dealStatusOrder = new Map<string, number>();
  if (list.objectType === "deal") {
    try {
      const propertyResponse = (await micro.prism.properties.list("deal", {
        list_id: list.id,
        include_options: true,
      })) as unknown as {
        deal?: Record<
          string,
          {
            alias?: string | null;
            options?: Array<{
              slug?: string;
              value?: string | null;
              sort_index?: number | null;
            }>;
          }
        >;
      };
      const stageDefinition = Object.values(propertyResponse.deal ?? {}).find(
        (definition) => definition.alias === "app_stage",
      );
      for (const option of stageDefinition?.options ?? []) {
        const order = option.sort_index ?? Number.MAX_SAFE_INTEGER;
        const slug = option.slug?.replaceAll("_", " ").toLowerCase();
        const value = option.value?.trim().toLowerCase();
        if (slug) dealStatusOrder.set(slug, order);
        if (value) dealStatusOrder.set(value, order);
        if (option.slug === "no_stage") dealStatusOrder.set("", order);
      }
    } catch {
      // Preserve the API record order when stage metadata is unavailable.
    }
  }

  const records = (response.data ?? []).map((raw) => {
    const row = raw as unknown as PrismRow;
    const properties = propertiesOf(row);
    const company = asRefs(properties.company)[0];
    const person = asRefs(properties.people)[0];
    const companyName = asString(company?.properties?.name).trim();
    const personName = asString(person?.properties?.full_name).trim();
    const relatedPhotoUrl =
      asString(person?.properties?.photo_url).trim() ||
      asString(company?.properties?.logo_url).trim();
    const relatedId = person?.id || company?.id;
    const name =
      asString(
        properties.full_name ||
          properties.name ||
          properties.title ||
          properties.subject ||
          `${asString(properties.first_name)} ${asString(properties.last_name)}`,
      ).trim() ||
      "Untitled";
    const subtitle = (() => {
      if (list.objectType === "contact") {
        return asString(properties.email).trim() || "Not found";
      }
      if (list.objectType === "identity") {
        return firstNestedString(properties.email_addresses, "email") || "Not found";
      }
      if (list.objectType === "organization") {
        return (
          asString(properties.primary_domain || properties.domains).trim() || "Not found"
        );
      }
      if (list.objectType === "deal") {
        return companyName || personName || "-";
      }
      return asString(
        properties.stage || properties.status || properties.description,
      ).trim();
    })();
    const href =
      list.objectType === "identity"
        ? `/people/${row.id}`
        : list.objectType === "organization"
          ? `/companies/${row.id}`
          : undefined;

    return {
      id: row.id,
      name,
      subtitle: subtitle.replaceAll("_", " "),
      photoUrl:
        relatedPhotoUrl ||
        asString(properties.photo_url || properties.logo_url).trim() ||
        undefined,
      avatarName: personName || companyName || undefined,
      color: colorFromId(relatedId || row.id),
      href,
      status:
        list.objectType === "deal"
          ? asString(properties.status).trim().replaceAll("_", " ")
          : undefined,
    } satisfies MicroListRecord;
  });

  if (list.objectType === "deal" && dealStatusOrder.size > 0) {
    records.sort(
      (left, right) =>
        (dealStatusOrder.get(left.status?.toLowerCase() ?? "") ??
          Number.MAX_SAFE_INTEGER) -
        (dealStatusOrder.get(right.status?.toLowerCase() ?? "") ??
          Number.MAX_SAFE_INTEGER),
    );
  }
  return records;
}

export async function queryProfileDeals(options: {
  personId?: string;
  companyId?: string;
}) {
  const lists = (await listMicroLists()).filter(
    (list) => list.objectType === "deal",
  );
  const filter: Record<string, { in: string[] }> | null = options.personId
    ? { people: { in: [options.personId] } }
    : options.companyId
      ? { company: { in: [options.companyId] } }
      : null;
  if (!filter) return [] as MicroListRecord[];

  const micro = getMicroClient();
  const responses = await Promise.allSettled(
    lists.map(async (list) => {
      const response = await micro.prism.objects.deals.query({
        query: {
          select: [
            "name",
            "status",
            "company.name",
            "company.logo_url",
            "people.full_name",
            "people.photo_url",
          ],
          list_id: list.id,
          filter: [filter],
          limit: 50,
        },
      });
      return { list, rows: (response.data ?? []) as PrismRow[] };
    }),
  );

  const deals = new Map<
    string,
    MicroListRecord & { listNames: string[] }
  >();
  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    for (const row of response.value.rows) {
      const existing = deals.get(row.id);
      if (existing) {
        if (!existing.listNames.includes(response.value.list.name)) {
          existing.listNames.push(response.value.list.name);
          existing.subtitle = existing.listNames.join(", ");
        }
        continue;
      }

      const properties = propertiesOf(row);
      const company = asRefs(properties.company)[0];
      const person = asRefs(properties.people)[0];
      const companyName = asString(company?.properties?.name).trim();
      const personName = asString(person?.properties?.full_name).trim();
      const photoUrl =
        asString(person?.properties?.photo_url).trim() ||
        asString(company?.properties?.logo_url).trim() ||
        undefined;
      const relatedId = person?.id || company?.id || row.id;
      deals.set(row.id, {
        id: row.id,
        name: asString(properties.name).trim() || "Untitled",
        subtitle: response.value.list.name || "-",
        photoUrl,
        avatarName: personName || companyName || undefined,
        color: colorFromId(relatedId),
        status: asString(properties.status).trim().replaceAll("_", " "),
        listNames: [response.value.list.name],
      });
    }
  }

  return [...deals.values()]
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      subtitle: deal.subtitle,
      photoUrl: deal.photoUrl,
      avatarName: deal.avatarName,
      color: deal.color,
      href: deal.href,
      status: deal.status,
    }))
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
}

export async function queryProfileFolderMemberships(options: {
  personId?: string;
  companyId?: string;
}) {
  const objectType = options.personId ? "identity" : options.companyId ? "organization" : null;
  const profileId = options.personId || options.companyId;
  if (!objectType || !profileId) return [] as ProfileFolderMembership[];

  const lists = (await listMicroLists()).filter(
    (list) => list.objectType === objectType,
  );
  const micro = getMicroClient();
  const memberships = await Promise.allSettled(
    lists.map(async (list) => {
      const response =
        objectType === "identity"
          ? await micro.prism.objects.identities.query({
              id: profileId,
              query: {
                select: ["full_name"],
                list_id: list.id,
                limit: 1,
              },
            })
          : await micro.prism.objects.organizations.query({
              id: profileId,
              query: {
                select: ["name"],
                list_id: list.id,
                limit: 1,
              },
            });
      return (response.data ?? []).some((row) => row.id === profileId)
        ? {
            id: list.id,
            name: list.name,
            icon: list.icon,
            href: `/lists/${list.id}`,
          }
        : null;
    }),
  );

  return memberships
    .flatMap((result) =>
      result.status === "fulfilled" && result.value ? [result.value] : [],
    )
    .sort((left, right) =>
      left.name.localeCompare(right.name, undefined, { sensitivity: "base" }),
    );
}
