import type { Note } from "@/lib/data";
import { activityDateLabel, formatClockTime, isoDate } from "@/lib/data";
import { asRefs, asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";
import { eventToNote } from "@/lib/micro-events";

const EVENT_SELECT = [
  "name",
  "start",
  "end",
  "status",
  "all_day",
  "attendees.contact.full_name",
  "attendees.contact.email",
  "attendees.contact.photo_url",
];

const DEMO_ACTIVITY_ENABLED = process.env.DEMO_ACTIVITY !== "false";
const NIKOLA_EMAIL = "nikola@granola.so";

type ActivityQuery = {
  personId?: string;
  companyId?: string;
  q?: string;
  email?: string;
  domain?: string;
};

type EventQueryParams = Parameters<
  ReturnType<typeof getMicroClient>["prism"]["objects"]["events"]["query"]
>[0];
type EventFilter = NonNullable<EventQueryParams["query"]["filter"]>[number];

function matchFilters(options: ActivityQuery): EventFilter[] {
  const name = options.q?.trim() ?? "";
  const email = options.email?.trim().toLowerCase() ?? "";
  const domain = options.domain?.trim().toLowerCase().replace(/^@/, "") ?? "";
  if (email) return [{ "attendees.contact.email": { "=": email } }];
  if (domain) return [{ "attendees.contact.email": { contains: `@${domain}` } }];
  if (options.personId && name.length >= 3) {
    return [{ "attendees.contact.full_name": { contains: name } }];
  }
  if (name && !options.personId) return [{ name: { contains: name } }];
  return [];
}

function eventMatchesPerson(row: PrismRow, options: ActivityQuery) {
  if (!options.personId) return true;
  const expectedEmail = options.email?.trim().toLowerCase() ?? "";
  const expectedName = options.q?.trim().toLowerCase() ?? "";

  return asRefs(propertiesOf(row).attendees).some((attendee) => {
    const contact = attendee.properties?.contact;
    const contactProperties =
      contact && typeof contact === "object"
        ? ((contact as { properties?: Record<string, unknown> }).properties ?? {})
        : {};
    const email = asString(contactProperties.email || attendee.properties?.email).trim().toLowerCase();
    const name = asString(contactProperties.full_name || attendee.properties?.full_name).trim().toLowerCase();
    return expectedEmail ? email === expectedEmail : Boolean(expectedName && name === expectedName);
  });
}

async function queryMatchedEvents(
  filters: EventFilter[],
  start: EventFilter,
  sort: "asc" | "desc",
  limit: number,
) {
  const micro = getMicroClient();
  const responses = await Promise.allSettled(
    filters.map((filter) =>
      micro.prism.objects.events.query({
        query: {
          select: EVENT_SELECT,
          sort: [{ start: sort }],
          limit,
          filter: [start, filter],
        },
      }),
    ),
  );
  const rows = new Map<string, PrismRow>();
  for (const response of responses) {
    if (response.status !== "fulfilled") continue;
    for (const row of (response.value.data ?? []) as PrismRow[]) rows.set(row.id, row);
  }
  if (rows.size === 0 && responses.every((response) => response.status === "rejected")) {
    const rejected = responses.find((response) => response.status === "rejected");
    throw rejected?.reason;
  }
  return [...rows.values()];
}

function toActivityNote(row: PrismRow, upcoming: boolean): Note | null {
  const note = eventToNote(row);
  if (!note) return null;
  return {
    ...note,
    dateLabel: upcoming ? "Upcoming" : activityDateLabel(note.date),
  };
}

function sortByStart(rows: PrismRow[], direction: "asc" | "desc") {
  return [...rows].sort((left, right) => {
    const leftStart = String(left.properties?.start ?? left.default?.start ?? "");
    const rightStart = String(right.properties?.start ?? right.default?.start ?? "");
    return direction === "asc" ? leftStart.localeCompare(rightStart) : rightStart.localeCompare(leftStart);
  });
}

function demoEmailActivity(options: ActivityQuery, now = new Date()): Note[] {
  if (!DEMO_ACTIVITY_ENABLED || options.email?.trim().toLowerCase() !== NIKOLA_EMAIL) return [];

  const rows = [
    {
      id: "nikola-re-london",
      sender: "Nikola Otasevic",
      subject: "Re: London this week",
      millisecondsAgo: 5 * 60 * 60 * 1000,
    },
    {
      id: "nikola-invitation",
      sender: "Nikola Otasevic",
      subject: "Invitation: Brett / Nikola @ Sep 2, 12:00 PM",
      millisecondsAgo: 5 * 60 * 60 * 1000 + 12 * 60 * 1000,
    },
    {
      id: "brett-re-london",
      sender: "Brett Goldstein",
      subject: "Re: London this week",
      millisecondsAgo: 24 * 60 * 60 * 1000,
    },
    {
      id: "sam-re-london",
      sender: "Sam",
      subject: "Re: London this week",
      millisecondsAgo: 25 * 60 * 60 * 1000,
    },
  ];

  return rows.map((row) => {
    const occurredAt = new Date(now.getTime() - row.millisecondsAgo).toISOString();
    return {
      id: `demo-email-${row.id}`,
      title: row.sender,
      date: isoDate(occurredAt),
      dateLabel: activityDateLabel(occurredAt),
      time: formatClockTime(occurredAt),
      personIds: options.personId ? [options.personId] : [],
      companyId: "",
      preview: row.subject,
      kind: "email",
      occurredAt,
      source: "demo",
      leadName: row.sender,
      otherNames: [row.sender],
    };
  });
}

async function queryLatestEmail(options: ActivityQuery): Promise<Note | null> {
  const email = options.email?.trim().toLowerCase();
  if (!email || !options.personId) return null;

  const micro = getMicroClient();
  const response = await micro.prism.objects.contacts.query({
    query: {
      select: ["email", "last_email.subject", "last_interaction_date"],
      filter: [{ email: { "=": email } }],
      limit: 5,
    },
  });
  const contact = (response.data ?? []).find(
    (row) => asString(propertiesOf(row).email).trim().toLowerCase() === email,
  );
  if (!contact) return null;

  const properties = propertiesOf(contact);
  const emailRef =
    properties.last_email && typeof properties.last_email === "object"
      ? (properties.last_email as { id?: unknown; properties?: Record<string, unknown> })
      : null;
  const subject = asString(emailRef?.properties?.subject).trim();
  const occurredAt = asString(properties.last_interaction_date).trim();
  if (!subject || !occurredAt) return null;

  return {
    id: `email-${asString(emailRef?.id).trim() || contact.id}`,
    title: options.q || "Latest email",
    date: isoDate(occurredAt),
    dateLabel: activityDateLabel(occurredAt),
    time: formatClockTime(occurredAt),
    personIds: [options.personId],
    companyId: "",
    preview: subject,
    kind: "email",
    occurredAt,
    source: "micro",
    badge: "Latest email",
    leadName: options.q,
    otherNames: options.q ? [options.q] : [],
  };
}

export async function queryActivity(options: ActivityQuery) {
  const filters = matchFilters(options);
  if (filters.length === 0) return { items: [] as Note[], upcoming: [] as Note[] };

  const now = new Date().toISOString();
  const [upcomingRows, pastRows, latestEmail] = await Promise.all([
    queryMatchedEvents(filters, { start: { ">=": now } }, "asc", 20),
    queryMatchedEvents(filters, { start: { "<": now } }, "desc", 50),
    queryLatestEmail(options).catch(() => null),
  ]);

  const upcoming = sortByStart(upcomingRows.filter((row) => eventMatchesPerson(row, options)), "asc")
    .map((row) => toActivityNote(row, true))
    .filter((note): note is Note => note !== null)
    .slice(0, 12);

  const eventItems = sortByStart(pastRows.filter((row) => eventMatchesPerson(row, options)), "desc")
    .map((row) => toActivityNote(row, false))
    .filter((note): note is Note => note !== null)
    .slice(0, 50);
  const emailItems = [...demoEmailActivity(options), ...(latestEmail ? [latestEmail] : [])];
  const dedupedEmails = new Map(
    emailItems.map((item) => [`${item.title.toLowerCase()}|${item.preview.toLowerCase()}`, item]),
  );
  const items = [...eventItems, ...dedupedEmails.values()]
    .sort((left, right) => (right.occurredAt ?? right.date).localeCompare(left.occurredAt ?? left.date))
    .slice(0, 50);

  return { items, upcoming };
}
