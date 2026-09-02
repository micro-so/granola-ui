import type { Company, CompanyView } from "@/lib/data";
import { colorFromId, formatShortDate, isoDate, isMicroViewId } from "@/lib/data";
import {
  asSummary,
  asString,
  formatStrength,
  getMicroClient,
  lastMeetingIso,
  locationLabel,
  propertiesOf,
  type PrismRow,
} from "@/lib/micro";
import { companyLogoUrl } from "@/lib/photo-url";
import { socialHandlesFrom } from "@/lib/social";

export const COMPANIES_PAGE_SIZE = 50;

const COMPANY_SELECT = [
  "name",
  "primary_domain",
  "logo_url",
  "last_interaction_date",
  "last_calendar_event.start",
  "domains",
  "summary",
  "about",
  "city",
  "country",
  "linkedin",
  "twitter",
  "crunchbase",
  "facebook",
  "relationship_strength",
] as const;

const COMPANY_SELECT_FALLBACKS: readonly (readonly string[])[] = [
  COMPANY_SELECT,
  ["name", "primary_domain", "logo_url", "last_interaction_date", "domains", "summary", "relationship_strength"],
  ["name", "primary_domain", "logo_url", "last_interaction_date"],
  ["name", "primary_domain", "logo_url"],
  ["name"],
];

function uniqueDomains(properties: Record<string, unknown>) {
  const primary = asString(properties.primary_domain).trim().toLowerCase();
  const raw = properties.domains;
  const listed = Array.isArray(raw) ? raw.map((item) => asString(item).trim().toLowerCase()) : [asString(raw).trim().toLowerCase()];
  const seen = new Set<string>();
  const domains: string[] = [];
  for (const domain of [primary, ...listed]) {
    if (!domain || seen.has(domain)) continue;
    seen.add(domain);
    domains.push(domain);
  }
  return domains;
}

export function mapCompany(row: PrismRow): Company | null {
  const properties = propertiesOf(row);
  const name = asString(properties.name).trim();
  if (!name) return null;

  const lastInteractionRaw = asString(properties.last_interaction_date);
  const lastInteraction = lastInteractionRaw ? isoDate(lastInteractionRaw) : "";
  const lastMeeting = lastMeetingIso(properties.last_calendar_event, lastInteraction);
  const domains = uniqueDomains(properties);

  return {
    id: row.id,
    name,
    domain: domains[0] ?? "",
    domains,
    extraDomainCount: Math.max(0, domains.length - 1),
    logoUrl: companyLogoUrl(asString(properties.logo_url), domains[0]),
    summary: asSummary(properties.summary),
    about: asSummary(properties.about),
    location: locationLabel(properties),
    city: asString(properties.city).trim(),
    country: asString(properties.country).trim(),
    lastInteraction,
    lastMeeting,
    lastNoteLabel: lastMeeting ? formatShortDate(lastMeeting) : "—",
    noteCount: 0,
    relationshipStrength: formatStrength(properties.relationship_strength),
    logoColor: colorFromId(row.id),
    ...socialHandlesFrom(properties),
  };
}

async function queryWithSelect(select: string[], q: string) {
  const micro = getMicroClient();
  return micro.prism.objects.organizations.query({
    query: {
      select,
      limit: COMPANIES_PAGE_SIZE,
      ...(q ? { filter: [{ name: { contains: q } }] } : {}),
      ...(select.includes("last_interaction_date") ? { sort: [{ last_interaction_date: "desc" as const }] } : {}),
    },
  });
}

async function queryCompaniesByIds(ids: string[]) {
  const micro = getMicroClient();
  let lastError: unknown;
  for (const select of COMPANY_SELECT_FALLBACKS) {
    try {
      return await micro.prism.objects.organizations.query({
        id: ids,
        query: { select: [...select], limit: COMPANIES_PAGE_SIZE },
      });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not load companies.");
}

type CompaniesPage = {
  items: Company[];
};

export async function queryCompanies(options: { q?: string; viewId?: string }): Promise<CompaniesPage> {
  // Placeholder UI uses ids like "all"; only real Micro view UUIDs hit /views/:id.
  if (options.viewId && isMicroViewId(options.viewId)) {
    return queryCompaniesByView(options);
  }

  const q = options.q?.trim() ?? "";
  let lastError: unknown;
  for (const select of COMPANY_SELECT_FALLBACKS) {
    try {
      const response = await queryWithSelect([...select], q);
      const items = (response.data ?? [])
        .map((row) => mapCompany(row))
        .filter((company): company is Company => company !== null);
      return { items };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Could not load companies.");
}

export async function listCompanyViews(): Promise<CompanyView[]> {
  const micro = getMicroClient();
  const listed = await micro.views.list("organization", { limit: 50 });
  const views: CompanyView[] = [];
  const seen = new Set<string>();

  for (const view of listed.data ?? []) {
    if (view.list_id || !view.id || !view.name.trim()) continue;
    if (seen.has(view.name)) continue;
    seen.add(view.name);
    views.push({ id: view.id, name: view.name });
  }

  return views;
}

async function queryCompaniesByView(options: { viewId?: string; q?: string }): Promise<CompaniesPage> {
  const viewId = options.viewId?.trim() ?? "";
  const q = options.q?.trim().toLowerCase() ?? "";
  const micro = getMicroClient();
  const records = await micro.views.records.list(viewId, {
    objectType: "organization",
    limit: COMPANIES_PAGE_SIZE,
  });

  const rows = (records.data ?? []) as PrismRow[];
  const ids = rows.map((row) => row.id).filter(Boolean);
  const response =
    ids.length > 0
      ? await queryCompaniesByIds(ids)
      : { data: [] };
  const companiesById = new Map(
    (response.data ?? [])
      .map((row) => mapCompany(row))
      .filter((company): company is Company => company !== null)
      .map((company) => [company.id, company]),
  );
  const items = rows
    .map((row) => companiesById.get(row.id) ?? mapCompany(row))
    .filter((company): company is Company => company !== null);

  const filtered = q
    ? items.filter((company) =>
        `${company.name} ${company.domain} ${company.summary}`.toLowerCase().includes(q),
      )
    : items;

  return { items: filtered };
}

function companyFromRow(row: { id: string; properties?: Record<string, unknown> | null; default?: Record<string, unknown> | null }) {
  return mapCompany({
    id: row.id,
    properties: row.properties ?? row.default ?? {},
    default: row.default ?? {},
  });
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  "aol.com",
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "live.com",
  "mac.com",
  "mail.com",
  "me.com",
  "msn.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
  "ymail.com",
]);

export function emailDomain(email: string) {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain)) return "";
  if (domain.endsWith(".edu") || domain.endsWith(".gov")) return "";
  return domain;
}

export async function findCompanyByDomain(domain: string): Promise<Company | null> {
  const host = emailDomain(`x@${domain}`) || domain.trim().toLowerCase();
  if (!host) return null;

  const micro = getMicroClient();
  try {
    const row = await micro.prism.objects.organizations.find(host, { slug: "primary_domain" });
    return companyFromRow(row as { id: string; properties?: Record<string, unknown>; default?: Record<string, unknown> });
  } catch {
    try {
      const response = await micro.prism.objects.organizations.query({
        query: {
          select: ["name", "primary_domain", "logo_url", "domains", "summary"],
          limit: 1,
          filter: [{ primary_domain: { contains: host } }],
        },
      });
      const row = response.data?.[0];
      return row ? companyFromRow(row) : null;
    } catch {
      return null;
    }
  }
}

export async function findCompaniesByNames(names: string[]): Promise<Company[]> {
  const uniqueNames = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (uniqueNames.length === 0) return [];

  const micro = getMicroClient();
  try {
    const response = await micro.prism.objects.organizations.query({
      query: {
        select: ["name", "primary_domain", "logo_url", "domains"],
        combinator: "OR",
        filter: uniqueNames.map((name) => ({ name: { contains: name } })),
        limit: Math.min(50, Math.max(uniqueNames.length * 2, 10)),
      },
    });
    const requested = new Set(uniqueNames.map((name) => name.toLowerCase()));
    return (response.data ?? [])
      .map((row) => mapCompany(row))
      .filter((company): company is Company => company !== null && requested.has(company.name.toLowerCase()));
  } catch {
    return [];
  }
}

export async function getCompany(id: string, options: { fallback?: boolean } = {}): Promise<Company | null> {
  try {
    const response = await queryCompaniesByIds([id]);
    const row = response.data?.[0];
    return row ? mapCompany(row) : null;
  } catch {
    if (options.fallback === false) return null;
    return null;
  }
}
