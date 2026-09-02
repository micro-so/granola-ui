export type PeopleView = {
  id: string;
  name: string;
};

export type CompanyView = {
  id: string;
  name: string;
};

/** Micro view IDs are UUIDs; placeholder chips use ids like "all" / "met". */
export function isMicroViewId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export const placeholderPeopleViews: PeopleView[] = [
  { id: "all", name: "All People" },
  { id: "met", name: "People I met" },
];

export const placeholderCompanyViews: CompanyView[] = [
  { id: "all", name: "All Companies" },
  { id: "met", name: "I've met" },
];

export type SocialKind = "linkedin" | "github" | "twitter" | "crunchbase" | "facebook";

export type SocialHandles = {
  linkedin?: string;
  github?: string;
  twitter?: string;
  crunchbase?: string;
  facebook?: string;
};

export type SocialLink = {
  kind: SocialKind;
  href: string;
  label: string;
};

export type ProfileHistoryItem = {
  id: string;
  organizationId?: string;
  organization: string;
  title: string;
  logoUrl?: string;
  startDate?: string;
  endDate?: string;
};

export type Person = {
  id: string;
  name: string;
  title: string;
  companyId: string;
  companyName?: string;
  email: string;
  phone?: string;
  extraEmailCount: number;
  photoUrl: string;
  summary: string;
  about?: string;
  location?: string;
  city?: string;
  country?: string;
  workHistory?: ProfileHistoryItem[];
  educationHistory?: ProfileHistoryItem[];
  skillsAndInterests?: string[];
  lastInteraction: string;
  lastMeeting: string;
  lastNoteLabel: string;
  noteCount: number;
  relationshipStrength: string;
  isMe?: boolean;
  avatarColor: string;
} & SocialHandles;

export type Company = {
  id: string;
  name: string;
  domain: string;
  domains?: string[];
  extraDomainCount?: number;
  logoUrl: string;
  summary: string;
  about?: string;
  location?: string;
  city?: string;
  country?: string;
  lastInteraction: string;
  lastMeeting: string;
  lastNoteLabel: string;
  noteCount: number;
  relationshipStrength: string;
  logoColor: string;
} & SocialHandles;

export type Note = {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  time: string;
  personIds: string[];
  companyId: string;
  preview: string;
  kind: "chat" | "meet" | "email" | "document";
  emailSnippet?: string;
  emailThreadId?: string;
  chatSnippet?: string;
  chatThreadId?: string;
  occurredAt?: string;
  source?: "micro" | "granola" | "demo";
  href?: string;
  badge?: string;
  addTo?: string;
  leadName?: string;
  leadColor?: string;
  leadPhotoUrl?: string;
  otherNames?: string[];
  companyName?: string;
  companyColor?: string;
  companyLogoUrl?: string;
};

export type ProfileComment = {
  id: string;
  body: string;
  author: string;
  occurredAt: string;
  authorColor: string;
  authorPhotoUrl?: string;
};

export const companies: Company[] = [
  {
    id: "micro",
    name: "Micro",
    domain: "micro.so",
    extraDomainCount: 2,
    logoUrl: "",
    summary: "AI workspace for email, CRM, meetings, and notes.",
    lastInteraction: "2026-09-01",
    lastMeeting: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1840,
    relationshipStrength: "Hot",
    logoColor: "#2a2a2a",
    linkedin: "company/microhq",
    twitter: "microHQ",
  },
  {
    id: "qreates",
    name: "Qreates",
    domain: "qreates.com",
    logoUrl: "",
    summary: "Design partner on the People directory and empty states.",
    lastInteraction: "2026-09-01",
    lastMeeting: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1,
    relationshipStrength: "Hot",
    logoColor: "#1d4ed8",
  },
  {
    id: "attio",
    name: "Attio",
    domain: "attio.com",
    extraDomainCount: 1,
    logoUrl: "",
    summary: "CRM conversations around pipeline and note sync.",
    lastInteraction: "2026-08-28",
    lastMeeting: "2026-08-27",
    lastNoteLabel: "Aug 27",
    noteCount: 12,
    relationshipStrength: "Average",
    logoColor: "#6d28d9",
  },
  {
    id: "notion",
    name: "Notion",
    domain: "notion.so",
    logoUrl: "",
    summary: "How shared notes should appear on a company page.",
    lastInteraction: "2026-08-22",
    lastMeeting: "2026-08-22",
    lastNoteLabel: "Aug 22",
    noteCount: 8,
    relationshipStrength: "Average",
    logoColor: "#3f3f46",
  },
  {
    id: "linear",
    name: "Linear",
    domain: "linear.app",
    logoUrl: "",
    summary: "Issue triage and what to pull into the next sprint.",
    lastInteraction: "2026-08-18",
    lastMeeting: "2026-08-18",
    lastNoteLabel: "Aug 18",
    noteCount: 5,
    relationshipStrength: "Cold",
    logoColor: "#5b21b6",
  },
  {
    id: "figma",
    name: "Figma",
    domain: "figma.com",
    logoUrl: "",
    summary: "Design tool we have not met with recently.",
    lastInteraction: "",
    lastMeeting: "",
    lastNoteLabel: "—",
    noteCount: 0,
    relationshipStrength: "",
    logoColor: "#1e1e1e",
  },
];

export const people: Person[] = [
  {
    id: "naveen",
    name: "Naveen Sreekandan",
    title: "Founder",
    companyId: "micro",
    email: "naveen@micro.so",
    extraEmailCount: 1,
    photoUrl: "",
    summary: "Hiring loop, Town People page, and next-week priorities.",
    lastInteraction: "2026-09-01",
    lastMeeting: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 470,
    relationshipStrength: "Hot",
    avatarColor: "#3f3f46",
    linkedin: "in/naveensreekandan",
    github: "naveen25",
  },
  {
    id: "brett",
    name: "Brett Goldstein",
    title: "Founder",
    companyId: "micro",
    email: "brett@micro.so",
    extraEmailCount: 2,
    photoUrl: "",
    summary: "Founder notes, 1-1s, and the Granola Home pass.",
    lastInteraction: "2026-09-01",
    lastMeeting: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1300,
    relationshipStrength: "Hot",
    isMe: true,
    avatarColor: "#44403c",
    linkedin: "in/bgoldstein3",
    github: "brettgoldstein3",
    twitter: "thatguybg",
  },
  {
    id: "salma",
    name: "Salma A.",
    title: "Designer",
    companyId: "qreates",
    email: "salma@qreates.com",
    extraEmailCount: 0,
    photoUrl: "",
    summary: "Design review on the People directory and empty states.",
    lastInteraction: "2026-09-01",
    lastMeeting: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1,
    relationshipStrength: "Hot",
    avatarColor: "#2563eb",
  },
  {
    id: "lakxhays",
    name: "Lakxhays",
    title: "Sales",
    companyId: "attio",
    email: "lakxhays@gmail.com",
    extraEmailCount: 0,
    photoUrl: "",
    summary: "Pipeline, Attio sync, and what to send after the demo.",
    lastInteraction: "2026-08-28",
    lastMeeting: "2026-08-28",
    lastNoteLabel: "Aug 28",
    noteCount: 1,
    relationshipStrength: "Average",
    avatarColor: "#b45309",
  },
  {
    id: "irshad",
    name: "Irshad Ahmed",
    title: "Engineer",
    companyId: "micro",
    email: "irshad@micro.so",
    extraEmailCount: 1,
    photoUrl: "",
    summary: "Internal demo of search and the new People view.",
    lastInteraction: "2026-08-28",
    lastMeeting: "2026-08-28",
    lastNoteLabel: "Aug 28",
    noteCount: 201,
    relationshipStrength: "Hot",
    avatarColor: "#3f3f46",
  },
  {
    id: "chris",
    name: "Christopher Beharry-Yambo",
    title: "Sales",
    companyId: "attio",
    email: "chris@attio.com",
    extraEmailCount: 0,
    photoUrl: "",
    summary: "Discovery on how notes should land on a person record.",
    lastInteraction: "2026-08-27",
    lastMeeting: "2026-08-27",
    lastNoteLabel: "Aug 27",
    noteCount: 3,
    relationshipStrength: "Average",
    avatarColor: "#0f766e",
  },
  {
    id: "maya",
    name: "Maya Chen",
    title: "Product",
    companyId: "notion",
    email: "maya@notion.so",
    extraEmailCount: 0,
    photoUrl: "",
    summary: "How shared notes should appear on a company page.",
    lastInteraction: "2026-08-22",
    lastMeeting: "2026-08-22",
    lastNoteLabel: "Aug 22",
    noteCount: 6,
    relationshipStrength: "Cold",
    avatarColor: "#7c3aed",
  },
  {
    id: "jordan",
    name: "Jordan Hale",
    title: "Engineer",
    companyId: "linear",
    email: "jordan@linear.app",
    extraEmailCount: 0,
    photoUrl: "",
    summary: "Issue triage and what to pull into the next sprint.",
    lastInteraction: "2026-08-18",
    lastMeeting: "2026-08-18",
    lastNoteLabel: "Aug 18",
    noteCount: 4,
    relationshipStrength: "Cold",
    avatarColor: "#be185d",
  },
];

export const notes: Note[] = [
  {
    id: "n1",
    title: "1-1 - Naveen / Brett",
    date: "2026-09-01",
    dateLabel: "Today",
    time: "1:30 PM",
    personIds: ["naveen", "brett"],
    companyId: "micro",
    preview: "Hiring loop, Town People page, and next-week priorities.",
    kind: "chat",
    badge: "Meeting notes",
    addTo: "1-1s",
  },
  {
    id: "n2",
    title: "30 Min Meeting between Brett Goldstein and Salma",
    date: "2026-09-01",
    dateLabel: "Today",
    time: "12:30 PM",
    personIds: ["salma", "brett"],
    companyId: "qreates",
    preview: "Design review on the People directory and empty states.",
    kind: "meet",
    badge: "Meeting summary",
  },
  {
    id: "n3",
    title: "Talk to Sales - Full between Brett Goldstein and lakshay",
    date: "2026-08-28",
    dateLabel: "Fri, Aug 28, 2026",
    time: "1:00 PM",
    personIds: ["lakxhays", "brett"],
    companyId: "attio",
    preview: "Pipeline, Attio sync, and what to send after the demo.",
    kind: "meet",
    badge: "Meeting notes",
  },
  {
    id: "n4",
    title: "Demos n Chill",
    date: "2026-08-28",
    dateLabel: "Fri, Aug 28, 2026",
    time: "10:00 AM",
    personIds: ["naveen", "irshad", "brett"],
    companyId: "micro",
    preview: "Internal demo of search and the new People view.",
    kind: "chat",
    badge: "Transcript",
    addTo: "Standups",
  },
  {
    id: "n5",
    title: "Talk to Sales - Full between Brett Goldstein and Chris Yambo",
    date: "2026-08-27",
    dateLabel: "Thu, Aug 27, 2026",
    time: "12:00 PM",
    personIds: ["chris", "brett"],
    companyId: "attio",
    preview: "Discovery on how notes should land on the person record.",
    kind: "meet",
  },
  {
    id: "n6",
    title: "standup!",
    date: "2026-08-27",
    dateLabel: "Thu, Aug 27, 2026",
    time: "11:30 AM",
    personIds: ["irshad", "naveen", "brett"],
    companyId: "micro",
    preview: "Ship checklist for Library and People.",
    kind: "chat",
    addTo: "Standups",
  },
  {
    id: "n7",
    title: "Notion x Micro — workspace sharing",
    date: "2026-08-22",
    dateLabel: "Fri, Aug 22, 2026",
    time: "3:00 PM",
    personIds: ["maya", "brett"],
    companyId: "notion",
    preview: "How shared notes should appear on a company page.",
    kind: "meet",
  },
  {
    id: "n8",
    title: "Linear weekly",
    date: "2026-08-18",
    dateLabel: "Mon, Aug 18, 2026",
    time: "10:00 AM",
    personIds: ["jordan", "brett"],
    companyId: "linear",
    preview: "Issue triage and what to pull into the next sprint.",
    kind: "chat",
  },
];

export type UpcomingEvent = {
  id: string;
  date: string;
  title: string;
  start: string;
  end: string;
  color: string;
  solo?: boolean;
  startsAt?: string;
  startLabel?: string;
  peopleNames?: string[];
  personIds?: string[];
};

export type UpcomingDay = {
  date: string;
  day: string;
  month: string;
  weekday: string;
  isToday: boolean;
};

const AVATAR_COLORS = [
  "#3f3f46",
  "#44403c",
  "#1d4ed8",
  "#6d28d9",
  "#0f766e",
  "#b45309",
  "#2563eb",
  "#7c3aed",
];

const EVENT_COLORS = ["#6d8cff", "#8b7cf7", "#7c6af7", "#6d8cff"];

export function colorFromId(id: string, palette: string[] = AVATAR_COLORS) {
  let n = 0;
  for (const ch of id) n += ch.charCodeAt(0);
  return palette[n % palette.length] ?? palette[0];
}

export function eventColorFromId(id: string) {
  return colorFromId(id, EVENT_COLORS);
}

function asDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

export function isoDate(value: Date | string) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sameDay(left: Date, right: Date) {
  return isoDate(left) === isoDate(right);
}

export function formatDateLabel(value: Date | string) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";
  if (sameDay(date, new Date())) return "Today";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function localDate(value: Date | string) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1);
  }
  return asDate(value);
}

export function activityDateLabel(value: Date | string, from = new Date()) {
  const date = localDate(value);
  if (Number.isNaN(date.getTime())) return "";
  if (sameDay(date, from)) return "Today";

  const weekStart = new Date(from);
  const weekday = weekStart.getDay();
  weekStart.setDate(weekStart.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  weekStart.setHours(0, 0, 0, 0);
  if (date >= weekStart && date < from) return "This week";

  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
}

export function formatShortDate(value: Date | string) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  if (sameDay(date, new Date())) return "Today";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(date);
}

export function formatActivityTimestampDate(value: Date | string, from = new Date()) {
  const date = localDate(value);
  if (Number.isNaN(date.getTime()) || sameDay(date, from)) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === from.getFullYear() ? {} : { year: "numeric" }),
  }).format(date);
}

export function formatClockTime(value: Date | string) {
  const date = asDate(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(date);
}

export function formatEventRange(startValue: Date | string, endValue?: Date | string) {
  const startDate = asDate(startValue);
  if (Number.isNaN(startDate.getTime())) return { start: "", end: "" };
  const startClock = formatClockTime(startDate).replace(/\s+(AM|PM)$/i, "");
  if (!endValue) return { start: startClock, end: formatClockTime(startDate) };
  const endDate = asDate(endValue);
  if (Number.isNaN(endDate.getTime())) return { start: startClock, end: formatClockTime(startDate) };
  return { start: startClock, end: formatClockTime(endDate) };
}

export function toUpcomingDay(date: string): UpcomingDay {
  const parsed = new Date(`${date}T12:00:00`);
  return {
    date,
    day: String(parsed.getDate()),
    month: new Intl.DateTimeFormat("en-US", { month: "long" }).format(parsed),
    weekday: new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(parsed),
    isToday: date === isoDate(new Date()),
  };
}

export function upcomingDayPair(from = new Date()): UpcomingDay[] {
  const today = isoDate(from);
  const tomorrow = new Date(from);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return [toUpcomingDay(today), toUpcomingDay(isoDate(tomorrow))];
}

export const upcomingDays: UpcomingDay[] = [
  { date: "2026-09-01", day: "1", month: "September", weekday: "Tue", isToday: true },
  { date: "2026-09-02", day: "2", month: "September", weekday: "Wed", isToday: false },
];

export const upcomingEvents: UpcomingEvent[] = [
  {
    id: "e1",
    date: "2026-09-02",
    title: "standup!",
    start: "10:30",
    end: "11:00 AM",
    color: "#6d8cff",
  },
  {
    id: "e2",
    date: "2026-09-02",
    title: "Brett / Nikola",
    start: "11:15",
    end: "11:45 AM",
    color: "#8b7cf7",
    peopleNames: ["Nikola Otasevic", "Brett Goldstein"],
  },
  {
    id: "e3",
    date: "2026-09-02",
    title: "30 Min Meeting between Brett Goldstein and Salma",
    start: "12:00",
    end: "12:30 PM",
    color: "#6d8cff",
    peopleNames: ["Salma A.", "Brett Goldstein"],
    personIds: ["salma", "brett"],
  },
  {
    id: "e4",
    date: "2026-09-02",
    title: "Talk to Sales — Lakxhays",
    start: "2:00",
    end: "2:30 PM",
    color: "#7c6af7",
    peopleNames: ["Lakxhays"],
    personIds: ["lakxhays"],
  },
];

export function eventsForDate(date: string) {
  return upcomingEvents.filter((event) => event.date === date);
}

function matchesName(value: string, query: string) {
  const left = value.trim().toLowerCase();
  const right = query.trim().toLowerCase();
  if (!left || !right) return false;
  return left.includes(right) || right.includes(left);
}

export function upcomingForPerson(events: UpcomingEvent[], person: Pick<Person, "id" | "name">) {
  const first = person.name.trim().split(/\s+/)[0] ?? "";
  return events.filter((event) => {
    if (event.personIds?.includes(person.id)) return true;
    if (event.peopleNames?.some((name) => matchesName(name, person.name) || matchesName(name, first))) return true;
    return matchesName(event.title, person.name) || matchesName(event.title, first);
  });
}

export function upcomingForCompany(events: UpcomingEvent[], company: Pick<Company, "id" | "name">) {
  return events.filter((event) => matchesName(event.title, company.name));
}

export function upcomingToNote(
  event: UpcomingEvent,
  extras: { leadName?: string; leadColor?: string; leadPhotoUrl?: string; otherNames?: string[] } = {},
): Note {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    dateLabel: "Upcoming",
    time: event.startLabel || event.start,
    personIds: event.personIds ?? [],
    companyId: "",
    preview: "",
    kind: "meet",
    leadName: extras.leadName,
    leadColor: extras.leadColor,
    leadPhotoUrl: extras.leadPhotoUrl,
    otherNames: extras.otherNames ?? event.peopleNames,
    companyName: extras.leadName,
    companyColor: extras.leadColor,
    companyLogoUrl: extras.leadPhotoUrl,
  };
}

export function companyById(id: string) {
  return companies.find((company) => company.id === id);
}

export function personById(id: string) {
  return people.find((person) => person.id === id);
}

export function peopleAtCompany(companyId: string) {
  return people.filter((person) => person.companyId === companyId && !person.isMe);
}

export function groupNotesByDate(items: Note[]) {
  const groups: { label: string; notes: Note[] }[] = [];
  for (const note of items) {
    const last = groups[groups.length - 1];
    if (!last || last.label !== note.dateLabel) {
      groups.push({ label: note.dateLabel, notes: [note] });
    } else {
      last.notes.push(note);
    }
  }
  return groups;
}

export function includePersonId(items: Note[], personId?: string) {
  if (!personId) return items;
  return items.map((item) =>
    item.personIds.includes(personId) ? item : { ...item, personIds: [...item.personIds, personId] },
  );
}

export const meId = people.find((person) => person.isMe)?.id;

export function noteLeadId(note: Note, currentMeId = meId) {
  return note.personIds.find((id) => id !== currentMeId) ?? note.personIds[0];
}

export function noteOtherNames(note: Note, mode: "full" | "first" = "full") {
  if (note.otherNames?.length) {
    return mode === "first" ? note.otherNames.map((name) => name.split(/\s+/)[0] ?? name) : note.otherNames;
  }
  return note.personIds
    .map((id) => personById(id))
    .filter((person): person is Person => person != null && !person.isMe)
    .map((person) => (mode === "first" ? person.name.split(/\s+/)[0] : person.name));
}

export type ProfileTask = {
  id: string;
  title: string;
  suggested?: boolean;
};

export const placeholderTasks: ProfileTask[] = [
  { id: "t1", title: "Send follow-up after the Town People review", suggested: true },
  { id: "t2", title: "Share the updated People directory with the team", suggested: true },
  { id: "t3", title: "Prep next 1-1 with Naveen" },
  { id: "t4", title: "Book time for the Home notes pass" },
];

export function tasksForPerson(personId: string) {
  if (personId === "naveen" || personId === "brett") return placeholderTasks;
  return [];
}

export function tasksForCompany(companyId: string) {
  if (companyId === "micro") return placeholderTasks;
  return [];
}

export function notesForPerson(personId: string) {
  return notes.filter((note) => note.personIds.includes(personId));
}

export function notesForCompany(companyId: string) {
  return notes.filter((note) => note.companyId === companyId);
}

export function formatNoteCount(count: number) {
  if (count >= 1000) {
    const value = count / 1000;
    return `${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}k`;
  }
  return String(count);
}

