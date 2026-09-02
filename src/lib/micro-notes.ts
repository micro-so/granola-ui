import type { Note } from "@/lib/data";
import { colorFromId, formatClockTime, formatDateLabel, isoDate } from "@/lib/data";
import { asRefs, asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";

const NOTE_SELECT_FULL = [
  "title",
  "document_type",
  "meeting_doc_type",
  "last_updated_at",
  "created_at",
  "is_user_dossier",
  "is_system_dossier",
  "people.full_name",
  "people.photo_url",
  "companies.name",
  "companies.logo_url",
  "companies.primary_domain",
];

const NOTE_SELECT_BASIC = [
  "title",
  "document_type",
  "meeting_doc_type",
  "last_updated_at",
  "created_at",
  "is_user_dossier",
  "is_system_dossier",
];

function isHidden(properties: Record<string, unknown>) {
  const documentType = asString(properties.document_type);
  const meetingType = asString(properties.meeting_doc_type);
  return (
    documentType === "snippet" ||
    documentType === "prompt_template" ||
    meetingType === "meeting_notes" ||
    meetingType === "summary" ||
    meetingType === "transcript"
  );
}

function noteKind(properties: Record<string, unknown>): Note["kind"] {
  const meetingType = asString(properties.meeting_doc_type);
  if (meetingType === "meeting_notes" || meetingType === "transcript" || meetingType === "summary") {
    return "meet";
  }
  return "document";
}

function noteBadge(properties: Record<string, unknown>) {
  const meetingType = asString(properties.meeting_doc_type).trim().toLowerCase();
  if (meetingType === "meeting_notes") return "Meeting notes";
  if (meetingType === "summary") return "Meeting summary";
  if (meetingType === "transcript") return "Transcript";
  return "";
}

function firstCompany(properties: Record<string, unknown>) {
  return asRefs(properties.companies)[0] ?? null;
}

function normalizeMicroTimestamp(value: string) {
  if (!value.includes("T") || /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value)) return value;
  return `${value}Z`;
}

export function mapNote(row: PrismRow): Note | null {
  const properties = propertiesOf(row);
  if (isHidden(properties)) return null;
  if (properties.is_user_dossier === true || properties.is_system_dossier === true) return null;

  const title = asString(properties.title).trim() || "Untitled note";
  const updated = normalizeMicroTimestamp(
    asString(properties.last_updated_at) || asString(properties.created_at),
  );
  const people = asRefs(properties.people);
  const company = firstCompany(properties);
  const names = people
    .map((person) => asString(person.properties?.full_name).trim())
    .filter(Boolean);
  const lead = people[0];
  const leadName = asString(lead?.properties?.full_name).trim();
  const companyName = asString(company?.properties?.name).trim();

  return {
    id: row.id,
    title,
    date: updated ? isoDate(updated) : "",
    dateLabel: updated ? formatDateLabel(updated) : "",
    time: updated ? formatClockTime(updated) : "",
    occurredAt: updated || undefined,
    personIds: people.map((person) => person.id),
    companyId: company?.id ?? "",
    preview: asString(properties.description).trim() || asString(properties.content).trim(),
    kind: noteKind(properties),
    badge: noteBadge(properties) || undefined,
    leadName,
    leadColor: lead ? colorFromId(lead.id) : undefined,
    leadPhotoUrl: asString(lead?.properties?.photo_url).trim(),
    otherNames: names,
    companyName,
    companyColor: company ? colorFromId(company.id) : undefined,
    companyLogoUrl: asString(company?.properties?.logo_url).trim(),
  };
}

function addToken(tokens: Set<string>, value: string) {
  const trimmed = value.trim();
  if (trimmed.length >= 3) tokens.add(trimmed);
}

async function profileContext(options: {
  personId?: string;
  companyId?: string;
  q?: string;
}) {
  const tokens = new Set<string>();
  const personIds = new Set(options.personId ? [options.personId] : []);
  if (options.q) {
    addToken(tokens, options.q);
    for (const part of options.q.split(/\s+/)) addToken(tokens, part);
  }
  if (options.personId) {
    const { getPerson } = await import("@/lib/micro-people");
    const person = await getPerson(options.personId, { fallback: false });
    if (person?.name) {
      addToken(tokens, person.name);
      for (const part of person.name.split(/\s+/)) addToken(tokens, part);
    }
    if (person?.email) {
      addToken(tokens, person.email.split("@")[0] ?? "");
      const normalizedEmail = person.email.trim().toLowerCase();
      const response = await getMicroClient()
        .prism.objects.identities.query({
          query: {
            select: ["email_addresses.email"],
            filter: [{ email_addresses: { contains: normalizedEmail } }],
            limit: 50,
          },
        })
        .catch(() => null);
      for (const row of response?.data ?? []) {
        const emails = asRefs(propertiesOf(row).email_addresses)
          .map((email) => asString(email.properties?.email).trim().toLowerCase())
          .filter(Boolean);
        if (emails.includes(normalizedEmail)) personIds.add(row.id);
      }
    }
  }
  if (options.companyId) {
    const { getCompany } = await import("@/lib/micro-companies");
    const company = await getCompany(options.companyId, { fallback: false });
    if (company?.name) addToken(tokens, company.name);
    if (company?.domain) addToken(tokens, company.domain.split(".")[0] ?? "");
  }
  return {
    tokens: [...tokens].slice(0, 4),
    personIds: [...personIds],
  };
}

function mapRows(rows: Array<{ id: string; properties?: Record<string, unknown> | null; default?: Record<string, unknown> | null }>) {
  return rows.map((row) => mapNote(row)).filter((note): note is Note => note !== null);
}

async function queryDocumentPages(options: {
  select: string[];
  tokens: string[];
  personIds?: string[];
  companyId?: string;
  pages: number;
}) {
  const micro = getMicroClient();
  const titleFilters = options.tokens.map((token) => ({ title: { contains: token } }));
  const rows: PrismRow[] = [];

  const personIds = options.personIds ?? [];
  const companyId = options.companyId;
  const relationFilter: Record<string, { in: string[] }> | null =
    personIds.length > 0
    ? { people: { in: personIds } }
    : companyId
      ? { companies: { in: [companyId] } }
      : null;
  if (relationFilter) {
    const linked = await micro.prism.objects.documents
      .query({
        query: {
          select: options.select,
          sort: [{ last_updated_at: "desc" }],
          limit: 50,
          filter: [relationFilter],
        },
      })
      .catch(() => null);
    rows.push(...((linked?.data ?? []) as PrismRow[]));
    return rows;
  }

  if (titleFilters.length === 0) {
    const response = await micro.prism.objects.documents.query({
      query: {
        select: options.select,
        sort: [{ last_updated_at: "desc" }],
        limit: 50,
        filter: [{ document_type: { not_in: ["snippet", "prompt_template"] } }],
      },
    });
    rows.push(...((response.data ?? []) as PrismRow[]));
    return rows;
  }

  for (let page = 1; page <= options.pages; page += 1) {
    const response = await micro.prism.objects.documents.query({
      query: {
        select: options.select,
        sort: [{ last_updated_at: "desc" }],
        limit: 50,
        page,
        combinator: "OR" as const,
        filter: titleFilters,
      },
    });
    rows.push(...((response.data ?? []) as PrismRow[]));
    if (!response.has_more) break;
  }

  return rows;
}

export async function queryNotes(options: {
  personId?: string;
  companyId?: string;
  q?: string;
  all?: boolean;
}) {
  const { tokens, personIds } = await profileContext(options);
  if ((options.personId || options.companyId) && tokens.length === 0) {
    return { items: [] as Note[] };
  }

  const pages = options.all ? 8 : 1;
  const select = options.all ? NOTE_SELECT_BASIC : NOTE_SELECT_FULL;

  try {
    const rows = await queryDocumentPages({
      select,
      tokens,
      personIds,
      companyId: options.companyId,
      pages,
    });
    const seen = new Set<string>();
    const items = mapRows(rows).filter((note) => {
      if (seen.has(note.id)) return false;
      seen.add(note.id);
      return true;
    });
    return { items };
  } catch {
    const rows = await queryDocumentPages({
      select: NOTE_SELECT_BASIC,
      tokens,
      personIds,
      companyId: options.companyId,
      pages,
    });
    const seen = new Set<string>();
    const items = mapRows(rows).filter((note) => {
      if (seen.has(note.id)) return false;
      seen.add(note.id);
      return true;
    });
    return { items };
  }
}
