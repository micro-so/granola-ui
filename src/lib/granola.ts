import type { Note } from "@/lib/data";
import { formatClockTime, formatDateLabel, isoDate } from "@/lib/data";

const GRANOLA_API_URL = "https://public-api.granola.ai/v1";
const CACHE_TTL_MS = 60_000;

type GranolaUser = {
  name: string | null;
  email: string;
};

export type GranolaNoteSummary = {
  id: string;
  title: string | null;
  owner: GranolaUser;
  created_at: string;
  updated_at: string;
};

export type GranolaFolder = {
  id: string;
  name: string;
  parentFolderId: string | null;
};

export type GranolaSpacePerson = {
  id: string;
  name: string;
  email: string;
  href?: string;
  photoUrl?: string;
  color?: string;
};

export type GranolaSpaceCompany = {
  id: string;
  name: string;
  domain: string;
  href?: string;
  photoUrl?: string;
  color?: string;
};

export type GranolaSpaceContext = {
  people: GranolaSpacePerson[];
  companies: GranolaSpaceCompany[];
};

type GranolaCalendarEvent = {
  event_title: string | null;
  scheduled_start_time: string | null;
  scheduled_end_time: string | null;
};

type GranolaNote = GranolaNoteSummary & {
  web_url: string;
  calendar_event: GranolaCalendarEvent | null;
  attendees: GranolaUser[];
  summary_text: string;
  summary_markdown: string | null;
};

type GranolaNotesPage = {
  notes: GranolaNoteSummary[];
  hasMore: boolean;
  cursor: string | null;
};

type GranolaFoldersPage = {
  folders: Array<{
    id: string;
    name: string;
    parent_folder_id: string | null;
  }>;
  hasMore: boolean;
  cursor: string | null;
};

let summariesCache:
  | { expiresAt: number; promise: Promise<GranolaNoteSummary[]> }
  | undefined;
let detailsCache:
  | { expiresAt: number; promise: Promise<GranolaNote[]> }
  | undefined;
let foldersCache:
  | { expiresAt: number; promise: Promise<GranolaFolder[]> }
  | undefined;
const spaceNotesCache = new Map<
  string,
  { expiresAt: number; promise: Promise<Note[]> }
>();
const spaceContextCache = new Map<
  string,
  { expiresAt: number; promise: Promise<GranolaSpaceContext> }
>();

export function hasGranolaCredentials() {
  return Boolean(process.env.GRANOLA_API_KEY);
}

async function granolaRequest<T>(path: string): Promise<T> {
  const apiKey = process.env.GRANOLA_API_KEY;
  if (!apiKey) throw new Error("Missing GRANOLA_API_KEY");

  const response = await fetch(`${GRANOLA_API_URL}${path}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Granola API request failed (${response.status}): ${body}`);
  }
  return response.json() as Promise<T>;
}

function createdAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export async function listRecentGranolaNotes() {
  if (summariesCache && summariesCache.expiresAt > Date.now()) return summariesCache.promise;

  const promise = (async () => {
    const notes: GranolaNoteSummary[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 2; page += 1) {
      const query = new URLSearchParams({
        created_after: createdAfter(30),
        page_size: "30",
      });
      if (cursor) query.set("cursor", cursor);
      const result = await granolaRequest<GranolaNotesPage>(`/notes?${query.toString()}`);
      notes.push(...result.notes);
      if (!result.hasMore || !result.cursor) break;
      cursor = result.cursor;
    }
    return notes;
  })();

  summariesCache = { expiresAt: Date.now() + CACHE_TTL_MS, promise };
  void promise.catch(() => {
    if (summariesCache?.promise === promise) summariesCache = undefined;
  });
  return promise;
}

export async function listGranolaFolders() {
  if (foldersCache && foldersCache.expiresAt > Date.now()) return foldersCache.promise;

  const promise = (async () => {
    const folders: GranolaFolder[] = [];
    let cursor: string | null = null;
    do {
      const query = new URLSearchParams({ page_size: "30" });
      if (cursor) query.set("cursor", cursor);
      const result = await granolaRequest<GranolaFoldersPage>(`/folders?${query.toString()}`);
      folders.push(
        ...result.folders.map((folder) => ({
          id: folder.id,
          name: folder.name,
          parentFolderId: folder.parent_folder_id,
        })),
      );
      cursor = result.hasMore ? result.cursor : null;
    } while (cursor);
    return folders;
  })();

  foldersCache = { expiresAt: Date.now() + CACHE_TTL_MS, promise };
  void promise.catch(() => {
    if (foldersCache?.promise === promise) foldersCache = undefined;
  });
  return promise;
}

function summaryToNote(note: GranolaNoteSummary): Note {
  return {
    id: note.id,
    title: note.title || "Untitled meeting",
    date: isoDate(note.created_at),
    dateLabel: formatDateLabel(note.created_at),
    time: formatClockTime(note.created_at),
    occurredAt: note.created_at,
    personIds: [],
    companyId: "",
    preview: "",
    kind: "meet",
    source: "granola",
    leadName: note.owner.name || note.owner.email,
    otherNames: [note.owner.name || note.owner.email],
  };
}

export async function queryGranolaSpaceNotes(folderId?: string) {
  const key = folderId || "my-notes";
  const cached = spaceNotesCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = (async () => {
    const notes: GranolaNoteSummary[] = [];
    let cursor: string | null = null;
    for (let page = 0; page < 2; page += 1) {
      const query = new URLSearchParams({ page_size: "30" });
      if (folderId) query.set("folder_id", folderId);
      if (cursor) query.set("cursor", cursor);
      const result = await granolaRequest<GranolaNotesPage>(`/notes?${query.toString()}`);
      notes.push(...result.notes);
      if (!result.hasMore || !result.cursor) break;
      cursor = result.cursor;
    }
    return notes.map(summaryToNote);
  })();

  spaceNotesCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, promise });
  void promise.catch(() => {
    if (spaceNotesCache.get(key)?.promise === promise) spaceNotesCache.delete(key);
  });
  return promise;
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "icloud.com",
  "outlook.com",
  "proton.me",
  "protonmail.com",
  "yahoo.com",
]);

function companyNameFromDomain(domain: string) {
  const name = domain.split(".")[0]?.replace(/[-_]+/g, " ").trim() || domain;
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export async function queryGranolaSpaceContext(folderId?: string) {
  const key = folderId || "my-notes";
  const cached = spaceContextCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = (async () => {
    const query = new URLSearchParams({ page_size: "8" });
    if (folderId) query.set("folder_id", folderId);
    const result = await granolaRequest<GranolaNotesPage>(`/notes?${query.toString()}`);
    const details: GranolaNote[] = [];
    for (let index = 0; index < result.notes.length; index += 4) {
      const batch = result.notes.slice(index, index + 4);
      details.push(
        ...(await Promise.all(
          batch.map((note) =>
            granolaRequest<GranolaNote>(`/notes/${encodeURIComponent(note.id)}`),
          ),
        )),
      );
      if (index + 4 < result.notes.length) {
        await new Promise((resolve) => setTimeout(resolve, 1_050));
      }
    }

    const mine = normalized(process.env.MICRO_ME_EMAIL || "brett@micro.so");
    const peopleByEmail = new Map<string, GranolaSpacePerson>();
    for (const note of details) {
      for (const person of [note.owner, ...note.attendees]) {
        const email = normalized(person.email);
        if (!email || email === mine || peopleByEmail.has(email)) continue;
        peopleByEmail.set(email, {
          id: email,
          name: person.name?.trim() || email,
          email,
        });
      }
    }

    const companiesByDomain = new Map<string, GranolaSpaceCompany>();
    for (const person of peopleByEmail.values()) {
      const domain = person.email.split("@")[1] || "";
      if (!domain || PERSONAL_EMAIL_DOMAINS.has(domain) || companiesByDomain.has(domain)) continue;
      companiesByDomain.set(domain, {
        id: domain,
        name: companyNameFromDomain(domain),
        domain,
      });
    }

    return {
      people: [...peopleByEmail.values()].sort((a, b) => a.name.localeCompare(b.name)),
      companies: [...companiesByDomain.values()].sort((a, b) => a.name.localeCompare(b.name)),
    };
  })();

  spaceContextCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, promise });
  void promise.catch(() => {
    if (spaceContextCache.get(key)?.promise === promise) spaceContextCache.delete(key);
  });
  return promise;
}

async function listDetailedGranolaNotes() {
  if (detailsCache && detailsCache.expiresAt > Date.now()) return detailsCache.promise;

  const promise = (async () => {
    const query = new URLSearchParams({
      created_after: createdAfter(30),
      page_size: "20",
    });
    const result = await granolaRequest<GranolaNotesPage>(`/notes?${query.toString()}`);
    const notes: GranolaNote[] = [];
    for (let index = 0; index < result.notes.length; index += 4) {
      const batch = result.notes.slice(index, index + 4);
      notes.push(
        ...(await Promise.all(
          batch.map((note) =>
            granolaRequest<GranolaNote>(`/notes/${encodeURIComponent(note.id)}`),
          ),
        )),
      );
      if (index + 4 < result.notes.length) {
        await new Promise((resolve) => setTimeout(resolve, 1_050));
      }
    }
    return notes;
  })();

  detailsCache = { expiresAt: Date.now() + CACHE_TTL_MS, promise };
  void promise.catch(() => {
    if (detailsCache?.promise === promise) detailsCache = undefined;
  });
  return promise;
}

function normalized(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function attendeeMatchesPerson(note: GranolaNote, email?: string, name?: string) {
  const expectedEmail = normalized(email);
  const expectedName = normalized(name);
  return [note.owner, ...note.attendees].some((person) => {
    const personEmail = normalized(person.email);
    const personName = normalized(person.name);
    return (
      (expectedEmail && personEmail === expectedEmail) ||
      (expectedName && personName === expectedName)
    );
  });
}

function attendeeMatchesCompany(note: GranolaNote, domains?: string[], name?: string) {
  const expectedDomains = (domains ?? [])
    .map((domain) => normalized(domain).replace(/^@/, ""))
    .filter(Boolean);
  const expectedName = normalized(name);
  if (expectedName && normalized(note.title).includes(expectedName)) return true;
  if (expectedDomains.length === 0) return false;
  return [note.owner, ...note.attendees].some((person) =>
    expectedDomains.some((domain) =>
      normalized(person.email).endsWith(`@${domain}`),
    ),
  );
}

function toNote(note: GranolaNote): Note {
  const occurredAt =
    note.calendar_event?.scheduled_start_time ||
    note.created_at;
  const mine = normalized(process.env.MICRO_ME_EMAIL || "brett@micro.so");
  const ownerEmail = normalized(note.owner.email);
  const attendees = note.attendees.filter(
    (person) => {
      const email = normalized(person.email);
      return email !== mine && email !== ownerEmail;
    },
  );
  const lead = attendees[0];

  return {
    id: note.id,
    title:
      note.title ||
      note.calendar_event?.event_title ||
      "Untitled meeting",
    date: isoDate(occurredAt),
    dateLabel: formatDateLabel(occurredAt),
    time: formatClockTime(occurredAt),
    occurredAt,
    personIds: [],
    companyId: "",
    preview: note.summary_text || note.summary_markdown || "",
    kind: "document",
    source: "granola",
    href: note.web_url,
    leadName: lead?.name || lead?.email || note.owner.name || note.owner.email,
    otherNames: attendees.map((person) => person.name || person.email),
  };
}

export async function queryGranolaNotes(options: {
  personEmail?: string;
  personName?: string;
  companyDomains?: string[];
  companyName?: string;
}) {
  const notes = await listDetailedGranolaNotes();
  return notes
    .filter((note) => {
      if (options.personEmail || options.personName) {
        return attendeeMatchesPerson(note, options.personEmail, options.personName);
      }
      if (options.companyDomains?.length || options.companyName) {
        return attendeeMatchesCompany(note, options.companyDomains, options.companyName);
      }
      return true;
    })
    .map(toNote)
    .sort((left, right) =>
      (right.occurredAt || right.date).localeCompare(left.occurredAt || left.date),
    );
}
