import { NextRequest } from "next/server";
import type { Note } from "@/lib/data";
import { isoDate } from "@/lib/data";
import { hasGranolaCredentials, queryGranolaNotes } from "@/lib/granola";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { getCompany } from "@/lib/micro-companies";
import { queryNotes } from "@/lib/micro-notes";
import { getPerson } from "@/lib/micro-people";

export const runtime = "nodejs";

function documentKey(note: Note) {
  const title = note.title.trim().toLowerCase();
  const badge = note.badge?.trim().toLowerCase() || "document";
  return `${title}|${isoDate(note.occurredAt || note.date)}|${badge}`;
}

function mergeDocuments(microItems: Note[], granolaItems: Note[]) {
  const documents = new Map<string, Note>();
  for (const note of microItems) documents.set(documentKey(note), note);
  for (const note of granolaItems) documents.set(documentKey(note), note);
  return [...documents.values()].sort((left, right) =>
    (right.occurredAt || right.date).localeCompare(left.occurredAt || left.date),
  );
}

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const all = request.nextUrl.searchParams.get("all") === "1";

  const microMissing = missingCredentials();
  if (microMissing && !hasGranolaCredentials()) {
    return credentialsPayload("Add GRANOLA_API_KEY or Micro credentials to load notes.");
  }

  const granolaPromise = hasGranolaCredentials()
    ? (async () => {
      const [person, company] = await Promise.all([
        personId ? getPerson(personId, { fallback: false }).catch(() => null) : null,
        companyId ? getCompany(companyId, { fallback: false }).catch(() => null) : null,
      ]);
      return queryGranolaNotes({
        personEmail: person?.email,
        personName: person?.name || (personId ? q : undefined),
        companyDomains: company ? company.domains || [company.domain] : undefined,
        companyName: company?.name || (companyId ? q : undefined),
      });
    })()
    : Promise.resolve(null);
  const microPromise = microMissing
    ? Promise.resolve(null)
    : queryNotes({
        personId: personId || undefined,
        companyId: companyId || undefined,
        q: q || undefined,
        all,
      });
  const [granolaResult, microResult] = await Promise.allSettled([
    granolaPromise,
    microPromise,
  ]);
  const granola =
    granolaResult.status === "fulfilled" && granolaResult.value
      ? granolaResult.value
      : [];
  const micro =
    microResult.status === "fulfilled" && microResult.value
      ? microResult.value.items
      : [];

  if (granolaResult.status === "rejected" && microResult.status === "rejected") {
    return failedPayload(granolaResult.reason);
  }
  return Response.json({
    live: true,
    provider:
      granola.length > 0 && micro.length > 0
        ? "granola+micro"
        : granola.length > 0
          ? "granola"
          : "micro",
    message: null,
    items: mergeDocuments(micro, granola),
  });
}
