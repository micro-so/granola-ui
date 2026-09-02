import type { Note, UpcomingEvent } from "@/lib/data";
import { colorFromId, eventColorFromId, formatClockTime, formatDateLabel, formatEventRange, isoDate } from "@/lib/data";
import {
  hasGranolaCredentials,
  listRecentGranolaNotes,
  type GranolaNoteSummary,
} from "@/lib/granola";
import { asRefs, asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";

const CALENDAR_EMAIL = (process.env.MICRO_ME_EMAIL || "").trim().toLowerCase();
const EVENT_SELECT = [
  "name",
  "start",
  "end",
  "status",
  "summary",
  "meeting_recording_url",
  "all_day",
  "location",
  "entry_points",
  "organizer.email",
  "creator.email",
  "attendees.contact.email",
  "attendees.contact.full_name",
  "attendees.contact.photo_url",
];

function collectEmails(value: unknown, out = new Set<string>()) {
  if (value == null) return out;
  if (typeof value === "string") {
    const matches = value.toLowerCase().match(/[^\s@]+@[^\s@]+\.[^\s@]+/g);
    if (matches) {
      for (const email of matches) out.add(email);
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectEmails(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const item of Object.values(value)) collectEmails(item, out);
  }
  return out;
}

function hasMeetingNotes(properties: Record<string, unknown>) {
  return Boolean(
    asString(properties.summary).trim() ||
      asString(properties.meeting_recording_url).trim(),
  );
}

function granolaNoteKey(title: string, value: string) {
  return `${title.trim().toLowerCase()}|${isoDate(value)}`;
}

function granolaNoteKeys(notes: GranolaNoteSummary[]) {
  return new Set(
    notes.map((note) =>
      granolaNoteKey(note.title || "", note.created_at),
    ),
  );
}

function refId(value: unknown) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value && typeof (value as { id: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return "";
}

function isCalendarOwnerEvent(row: PrismRow, properties: Record<string, unknown>, ownerId: string) {
  if (ownerId && (refId(properties.organizer) === ownerId || refId(properties.creator) === ownerId)) {
    return true;
  }
  return collectEmails(properties).has(CALENDAR_EMAIL);
}

function isSoloMeeting(properties: Record<string, unknown>, ownerId: string) {
  const attendees = asRefs(properties.attendees);
  if (attendees.length === 0) return true;

  return !attendees.some((attendee) => {
    const contact = attendee.properties?.contact;
    const contactId = refId(contact);
    if (ownerId && (attendee.id === ownerId || contactId === ownerId)) return false;
    return !collectEmails(attendee).has(CALENDAR_EMAIL);
  });
}

function stillUpcoming(properties: Record<string, unknown>, now: Date) {
  const end = asString(properties.end) || asString(properties.start);
  const time = new Date(end);
  if (Number.isNaN(time.getTime())) return true;
  return time.getTime() >= now.getTime();
}

function otherPeople(properties: Record<string, unknown>) {
  const people: Array<{ id: string; name: string; photoUrl: string }> = [];
  for (const attendee of asRefs(properties.attendees)) {
    const contact = attendee.properties?.contact;
    const nested =
      contact && typeof contact === "object" ? ((contact as { properties?: Record<string, unknown> }).properties ?? {}) : {};
    const email = asString(nested.email || attendee.properties?.email).trim().toLowerCase();
    if (email === CALENDAR_EMAIL) continue;
    const name = asString(nested.full_name || attendee.properties?.full_name).trim();
    if (!name && !email) continue;
    people.push({
      id: refId(contact) || attendee.id,
      name: name || email,
      photoUrl: asString(nested.photo_url || attendee.properties?.photo_url).trim(),
    });
  }
  return people;
}

export function eventToNote(row: PrismRow): Note | null {
  const mapped = mapEvent(row);
  if (!mapped) return null;
  const people = otherPeople(propertiesOf(row));
  const lead = people[0];
  return {
    id: row.id,
    title: mapped.title,
    date: mapped.date,
    dateLabel: formatDateLabel(mapped.startsAt || mapped.date),
    time: mapped.startLabel || mapped.start,
    personIds: people.map((person) => person.id),
    companyId: "",
    preview: "",
    kind: "meet",
    occurredAt: mapped.startsAt,
    leadName: lead?.name,
    leadColor: lead ? colorFromId(lead.id) : undefined,
    leadPhotoUrl: lead?.photoUrl,
    otherNames: people.map((person) => person.name),
  };
}

export function mapEvent(row: PrismRow, options: { solo?: boolean } = {}): UpcomingEvent | null {
  const properties = propertiesOf(row);
  const status = asString(properties.status).trim().toLowerCase();
  if (status === "no" || status === "canceled" || status === "cancelled") return null;
  const title = asString(properties.name).trim();
  const start = asString(properties.start);
  if (!title || !start) return null;
  const people = otherPeople(properties);

  const allDay = properties.all_day === true;
  if (allDay) {
    const date = start.slice(0, 10);
    return {
      id: row.id,
      date,
      title,
      start: "8:00 AM",
      end: "8:00 PM",
      color: eventColorFromId(row.id),
      solo: options.solo,
      startsAt: `${date}T00:00:00.000Z`,
      startLabel: "8:00 AM",
      peopleNames: people.map((person) => person.name),
      personIds: people.map((person) => person.id).filter(Boolean),
    };
  }

  const end = asString(properties.end);
  const range = formatEventRange(start, end || start);

  return {
    id: row.id,
    date: isoDate(start),
    title,
    start: range.start,
    end: range.end,
    color: eventColorFromId(row.id),
    solo: options.solo,
    startsAt: start,
    startLabel: formatClockTime(start),
    peopleNames: people.map((person) => person.name),
    personIds: people.map((person) => person.id).filter(Boolean),
  };
}

async function findCalendarOwnerId() {
  if (!CALENDAR_EMAIL) return "";
  const micro = getMicroClient();
  try {
    const contact = await micro.prism.objects.contacts.find(CALENDAR_EMAIL, { slug: "email" });
    return contact.id;
  } catch {
    return "";
  }
}

function dayBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 2);
  return {
    start,
    end,
    today: isoDate(start),
    tomorrow: isoDate(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1)),
  };
}

export async function queryUpcoming() {
  const micro = getMicroClient();
  const ownerId = await findCalendarOwnerId();
  const { start, end, today, tomorrow } = dayBounds();
  const allowedDays = new Set([today, tomorrow]);
  const historyStart = new Date(start);
  historyStart.setDate(historyStart.getDate() - 30);

  const [response, historyResponse, granolaNotes] = await Promise.all([
    micro.prism.objects.events.query({
      query: {
        select: EVENT_SELECT,
        sort: [{ start: "asc" }],
        limit: 50,
        filter: [{ start: { ">=": start.toISOString() } }, { start: { "<": end.toISOString() } }],
      },
    }),
    micro.prism.objects.events.query({
      query: {
        select: EVENT_SELECT,
        sort: [{ start: "desc" }],
        limit: 50,
        filter: [
          { start: { ">=": historyStart.toISOString() } },
          { start: { "<": start.toISOString() } },
        ],
      },
    }),
    hasGranolaCredentials()
      ? listRecentGranolaNotes().catch(() => null)
      : Promise.resolve(null),
  ]);
  const notedMeetings = granolaNotes ? granolaNoteKeys(granolaNotes) : null;

  const now = new Date();
  const remaining: UpcomingEvent[] = [];
  const pastRows: Array<{ note: Note; startsAt: string }> = [];

  for (const row of response.data ?? []) {
    const properties = propertiesOf(row);
    if (!isCalendarOwnerEvent(row, properties, ownerId)) continue;
    const solo = isSoloMeeting(properties, ownerId);
    const event = mapEvent(row, { solo });
    if (!event || !allowedDays.has(event.date)) continue;

    if (stillUpcoming(properties, now)) {
      remaining.push(event);
      continue;
    }

    const hasNotes = notedMeetings
      ? notedMeetings.has(granolaNoteKey(event.title, event.startsAt || event.date))
      : hasMeetingNotes(properties);
    if (event.date === today && !solo && hasNotes) {
      const note = eventToNote(row);
      if (note) pastRows.push({ note, startsAt: event.startsAt ?? "" });
    }
  }

  for (const row of historyResponse.data ?? []) {
    const properties = propertiesOf(row);
    if (!isCalendarOwnerEvent(row, properties, ownerId)) continue;
    const solo = isSoloMeeting(properties, ownerId);
    const event = mapEvent(row, { solo });
    if (!event || solo) continue;
    const hasNotes = notedMeetings
      ? notedMeetings.has(granolaNoteKey(event.title, event.startsAt || event.date))
      : hasMeetingNotes(properties);
    if (!hasNotes) continue;
    const note = eventToNote(row);
    if (note) pastRows.push({ note, startsAt: event.startsAt ?? "" });
  }

  remaining.sort((left, right) => {
    const day = (left.date || "").localeCompare(right.date || "");
    if (day !== 0) return day;
    return (left.startsAt ?? "").localeCompare(right.startsAt ?? "");
  });
  pastRows.sort((left, right) => right.startsAt.localeCompare(left.startsAt));

  return { items: remaining, past: pastRows.map((row) => row.note) };
}
