import { colorFromId } from "@/lib/data";
import { asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";

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
  color: string;
  href?: string;
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
                query: { select: ["name", "status"], list_id: list.id, limit: 50 },
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

  return (response.data ?? []).map((raw) => {
    const row = raw as unknown as PrismRow;
    const properties = propertiesOf(row);
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
      photoUrl: asString(properties.photo_url || properties.logo_url).trim() || undefined,
      color: colorFromId(row.id),
      href,
    } satisfies MicroListRecord;
  });
}
