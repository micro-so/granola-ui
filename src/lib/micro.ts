import { isoDate } from "@/lib/data";
import Micro from "@micro-so/sdk";

export function missingCredentials() {
  return !process.env.MICRO_API_KEY || !process.env.MICRO_TEAM_ID;
}

export function getMicroClient() {
  const apiKey = process.env.MICRO_API_KEY;
  const teamID = process.env.MICRO_TEAM_ID;
  if (!apiKey || !teamID) {
    throw new Error("Missing MICRO_API_KEY or MICRO_TEAM_ID");
  }
  return new Micro({
    apiKey,
    teamID,
    baseURL: process.env.MICRO_BASE_URL || undefined,
  });
}

export function credentialsPayload(message = "Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local.") {
  return Response.json({ live: false, message, items: [] });
}

export function failedPayload(error: unknown) {
  const message = error instanceof Error ? error.message : "Micro request failed";
  return Response.json({ live: false, message, items: [] }, { status: 502 });
}

export type PrismRow = {
  id: string;
  email?: string | null;
  is_human_type?: boolean;
  is_user_object?: boolean;
  properties?: Record<string, unknown> | null;
  default?: Record<string, unknown> | null;
};

export function propertiesOf(row: PrismRow) {
  return row.properties ?? row.default ?? {};
}

export function asString(value: unknown, depth = 0): string {
  if (depth > 6 || value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return asString(value[0], depth + 1);
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("value" in record) return asString(record.value, depth + 1);
    for (const key of ["text", "markdown", "content", "html", "email", "address", "name"]) {
      if (typeof record[key] === "string") return record[key] as string;
    }
  }
  return "";
}

export function locationLabel(properties: Record<string, unknown>) {
  const city = asString(properties.city).trim();
  if (city) return city;

  const country = asString(properties.country).trim();
  if (!country) return "";
  if (country.length !== 2) return country;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(country.toUpperCase()) ?? country;
  } catch {
    return country;
  }
}

export function asRefs(value: unknown): Array<{ id: string; properties?: Record<string, unknown> }> {
  const unwrapped =
    value && typeof value === "object" && "value" in value
      ? (value as { value?: unknown }).value
      : value;
  const list = Array.isArray(unwrapped) ? unwrapped : unwrapped ? [unwrapped] : [];
  return list.filter((item): item is { id: string; properties?: Record<string, unknown> } => {
    return Boolean(item && typeof item === "object" && "id" in item && typeof (item as { id: unknown }).id === "string");
  });
}

const LOOKS_LIKE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function asPlainText(value: unknown) {
  return asString(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function asSummary(value: unknown) {
  return asString(value)
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/[^\S\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function formatStrength(value: unknown) {
  const raw = asString(value).trim();
  if (!raw) return "";
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

function isoIfDate(value: unknown) {
  const text = asString(value).trim();
  if (!text || LOOKS_LIKE_ID.test(text)) return "";
  const parsed = isoDate(text);
  return parsed || "";
}

/** last_calendar_event is an event ref; use nested start when selected, else fall back. */
export function lastMeetingIso(calendarEvent: unknown, fallback: string) {
  if (calendarEvent && typeof calendarEvent === "object") {
    const record = calendarEvent as Record<string, unknown>;
    const nested =
      record.properties && typeof record.properties === "object"
        ? (record.properties as Record<string, unknown>)
        : record;
    const start = isoIfDate(nested.start ?? nested.starts_at ?? nested.start_time);
    if (start) return start;
  }
  return isoIfDate(calendarEvent) || fallback;
}
