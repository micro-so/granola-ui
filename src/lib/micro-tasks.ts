import type { ProfileTask } from "@/lib/data";
import { asString, getMicroClient, propertiesOf } from "@/lib/micro";

function searchToken(name: string) {
  const trimmed = name.trim();
  const first = trimmed.split(/\s+/)[0] ?? "";
  return first.length >= 3 ? first : trimmed;
}

async function titleForFilter(options: { personId?: string; companyId?: string; q?: string }) {
  if (options.q?.trim()) return searchToken(options.q);
  if (options.personId) {
    const { getPerson } = await import("@/lib/micro-people");
    const person = await getPerson(options.personId, { fallback: false });
    return person?.name ? searchToken(person.name) : "";
  }
  if (options.companyId) {
    const { getCompany } = await import("@/lib/micro-companies");
    const company = await getCompany(options.companyId, { fallback: false });
    return company?.name ? searchToken(company.name) : "";
  }
  return "";
}

export async function queryTasks(options: { personId?: string; companyId?: string; q?: string }) {
  const titleQuery = await titleForFilter(options);
  if ((options.personId || options.companyId) && !titleQuery) {
    return { items: [] as ProfileTask[] };
  }

  const micro = getMicroClient();
  const filter = titleQuery ? { filter: [{ title: { contains: titleQuery } }] } : {};
  const response = await micro.prism.objects.actions
    .query({
      query: { select: ["title", "recommended"], limit: 40, ...filter },
    })
    .catch(() =>
      micro.prism.objects.actions.query({
        query: { select: ["title"], limit: 40, ...filter },
      }),
    );

  const items = (response.data ?? [])
    .map((row) => {
      const properties = propertiesOf(row);
      const title = asString(properties.title).trim();
      if (!title) return null;
      return {
        id: row.id,
        title,
        suggested: properties.recommended === true || asString(properties.recommended).toLowerCase() === "true",
      };
    })
    .filter((task) => task !== null);

  return { items };
}

export async function decideTask(id: string, decision: "approve" | "reject") {
  const micro = getMicroClient();
  if (decision === "reject") {
    await micro.prism.objects.actions.delete(id);
    return;
  }
  await micro.prism.objects.actions.update(id, { default: { recommended: false } });
}
