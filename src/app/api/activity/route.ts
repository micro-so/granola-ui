import { NextRequest } from "next/server";
import type { Note } from "@/lib/data";
import { isoDate } from "@/lib/data";
import { hasGranolaCredentials, queryGranolaNotes } from "@/lib/granola";
import { groupAdjacentMessages } from "@/lib/group-activity-messages";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { queryActivity } from "@/lib/micro-activity";
import { getCompany } from "@/lib/micro-companies";
import { getPerson } from "@/lib/micro-people";

export const runtime = "nodejs";

function activityKey(note: Note) {
  const title = note.title.trim().toLowerCase();
  return `${title}|${isoDate(note.occurredAt || note.date)}`;
}

function mergePastActivity(microItems: Note[], granolaItems: Note[]) {
  const meetings = new Map<string, Note>();
  for (const note of granolaItems) {
    meetings.set(activityKey(note), { ...note, badge: undefined });
  }
  for (const note of microItems.filter((item) => item.kind === "meet")) {
    meetings.set(activityKey(note), note);
  }
  const messages = microItems.filter(
    (item) => item.kind === "email" || item.kind === "chat",
  );
  const sorted = [...meetings.values(), ...messages]
    .sort((left, right) =>
      (right.occurredAt || right.date).localeCompare(left.occurredAt || left.date),
    );
  return groupAdjacentMessages(sorted).slice(0, 50);
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const email = request.nextUrl.searchParams.get("email")?.trim() || "";
  const domain = request.nextUrl.searchParams.get("domain")?.trim() || "";
  const domains = (request.nextUrl.searchParams.get("domains") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const microMissing = missingCredentials();
  if (microMissing && !hasGranolaCredentials()) {
    return credentialsPayload("Add Micro or Granola credentials to load activity.");
  }

  const microPromise = microMissing
    ? Promise.resolve(null)
    : queryActivity({
        personId: personId || undefined,
        companyId: companyId || undefined,
        q: q || undefined,
        email: email || undefined,
        domain: domain || undefined,
        domains,
      });
  const granolaPromise =
    hasGranolaCredentials() && (personId || companyId)
      ? (async () => {
          const [person, company] = await Promise.all([
            personId ? getPerson(personId, { fallback: false }).catch(() => null) : null,
            companyId ? getCompany(companyId, { fallback: false }).catch(() => null) : null,
          ]);
          return queryGranolaNotes({
            personEmail: person?.email || email || undefined,
            personName: personId ? person?.name || q || undefined : undefined,
            companyDomains: companyId
              ? company?.domains || (company?.domain ? [company.domain] : domain ? [domain] : undefined)
              : undefined,
            companyName: companyId ? company?.name || q || undefined : undefined,
          });
        })()
      : Promise.resolve(null);

  const [microResult, granolaResult] = await Promise.allSettled([
    microPromise,
    granolaPromise,
  ]);
  const micro =
    microResult.status === "fulfilled" && microResult.value
      ? microResult.value
      : { items: [] as Note[], upcoming: [] as Note[] };
  const granola =
    granolaResult.status === "fulfilled" && granolaResult.value
      ? granolaResult.value
      : [];

  if (microResult.status === "rejected" && granolaResult.status === "rejected") {
    return failedPayload(microResult.reason);
  }
  return Response.json({
    live: true,
    provider: granola.length > 0 ? "micro+granola" : "micro",
    message: null,
    items: mergePastActivity(micro.items, granola),
    upcoming: micro.upcoming,
  });
}
