export type Person = {
  id: string;
  name: string;
  title: string;
  companyId: string;
  email: string;
  photoUrl: string;
  lastInteraction: string;
  lastNoteLabel: string;
  noteCount: number;
  isMe?: boolean;
  avatarColor: string;
};

export type Company = {
  id: string;
  name: string;
  domain: string;
  logoUrl: string;
  lastNoteLabel: string;
  noteCount: number;
  logoColor: string;
};

export type Note = {
  id: string;
  title: string;
  date: string;
  dateLabel: string;
  time: string;
  personIds: string[];
  companyId: string;
  preview: string;
  kind: "chat" | "meet";
  addTo?: string;
};

export const companies: Company[] = [
  {
    id: "micro",
    name: "Micro",
    domain: "micro.so",
    logoUrl: "",
    lastNoteLabel: "Today",
    noteCount: 1840,
    logoColor: "#2a2a2a",
  },
  {
    id: "qreates",
    name: "Qreates",
    domain: "qreates.com",
    logoUrl: "",
    lastNoteLabel: "Today",
    noteCount: 1,
    logoColor: "#1d4ed8",
  },
  {
    id: "attio",
    name: "Attio",
    domain: "attio.com",
    logoUrl: "",
    lastNoteLabel: "Aug 25",
    noteCount: 12,
    logoColor: "#6d28d9",
  },
  {
    id: "notion",
    name: "Notion",
    domain: "notion.so",
    logoUrl: "",
    lastNoteLabel: "Aug 22",
    noteCount: 8,
    logoColor: "#3f3f46",
  },
  {
    id: "linear",
    name: "Linear",
    domain: "linear.app",
    logoUrl: "",
    lastNoteLabel: "Aug 18",
    noteCount: 5,
    logoColor: "#5b21b6",
  },
  {
    id: "figma",
    name: "Figma",
    domain: "figma.com",
    logoUrl: "",
    lastNoteLabel: "—",
    noteCount: 0,
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
    photoUrl: "",
    lastInteraction: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 470,
    avatarColor: "#3f3f46",
  },
  {
    id: "brett",
    name: "Brett Goldstein",
    title: "Founder",
    companyId: "micro",
    email: "brett@micro.so",
    photoUrl: "",
    lastInteraction: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1300,
    isMe: true,
    avatarColor: "#44403c",
  },
  {
    id: "salma",
    name: "Salma A.",
    title: "Designer",
    companyId: "qreates",
    email: "salma@qreates.com",
    photoUrl: "",
    lastInteraction: "2026-09-01",
    lastNoteLabel: "Today",
    noteCount: 1,
    avatarColor: "#2563eb",
  },
  {
    id: "lakxhays",
    name: "Lakxhays",
    title: "Sales",
    companyId: "attio",
    email: "lakxhays@gmail.com",
    photoUrl: "",
    lastInteraction: "2026-08-28",
    lastNoteLabel: "Aug 28",
    noteCount: 1,
    avatarColor: "#b45309",
  },
  {
    id: "irshad",
    name: "Irshad Ahmed",
    title: "Engineer",
    companyId: "micro",
    email: "irshad@micro.so",
    photoUrl: "",
    lastInteraction: "2026-08-28",
    lastNoteLabel: "Aug 28",
    noteCount: 201,
    avatarColor: "#3f3f46",
  },
  {
    id: "chris",
    name: "Christopher Beharry-Yambo",
    title: "Sales",
    companyId: "attio",
    email: "chris@attio.com",
    photoUrl: "",
    lastInteraction: "2026-08-27",
    lastNoteLabel: "Aug 27",
    noteCount: 3,
    avatarColor: "#0f766e",
  },
  {
    id: "maya",
    name: "Maya Chen",
    title: "Product",
    companyId: "notion",
    email: "maya@notion.so",
    photoUrl: "",
    lastInteraction: "2026-08-22",
    lastNoteLabel: "Aug 22",
    noteCount: 6,
    avatarColor: "#7c3aed",
  },
  {
    id: "jordan",
    name: "Jordan Hale",
    title: "Engineer",
    companyId: "linear",
    email: "jordan@linear.app",
    photoUrl: "",
    lastInteraction: "2026-08-18",
    lastNoteLabel: "Aug 18",
    noteCount: 4,
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
};

export const upcomingDays = [
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
  },
  {
    id: "e3",
    date: "2026-09-02",
    title: "30 Min Meeting between Brett Goldstein and Salma",
    start: "12:00",
    end: "12:30 PM",
    color: "#6d8cff",
  },
  {
    id: "e4",
    date: "2026-09-02",
    title: "Talk to Sales — Lakxhays",
    start: "2:00",
    end: "2:30 PM",
    color: "#7c6af7",
  },
];

export function eventsForDate(date: string) {
  return upcomingEvents.filter((event) => event.date === date);
}

export function companyById(id: string) {
  return companies.find((company) => company.id === id);
}

export function personById(id: string) {
  return people.find((person) => person.id === id);
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

export const meId = people.find((person) => person.isMe)?.id;

export function noteLeadId(note: Note) {
  return note.personIds.find((id) => id !== meId) ?? note.personIds[0];
}

export function noteOtherNames(note: Note, mode: "full" | "first" = "full") {
  return note.personIds
    .map((id) => personById(id))
    .filter((person): person is Person => person != null && !person.isMe)
    .map((person) => (mode === "first" ? person.name.split(/\s+/)[0] : person.name));
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

