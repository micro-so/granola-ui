import { NextRequest } from "next/server";
import {
  hasGranolaCredentials,
  listGranolaFolders,
  queryGranolaSpaceContext,
  queryGranolaSpaceNotes,
} from "@/lib/granola";
import { findCompanyByDomain } from "@/lib/micro-companies";
import { missingCredentials } from "@/lib/micro";
import { queryPeople } from "@/lib/micro-people";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (!hasGranolaCredentials()) {
    return Response.json(
      { live: false, message: "Add GRANOLA_API_KEY to load spaces.", items: [] },
      { status: 503 },
    );
  }

  try {
    const folderId = request.nextUrl.searchParams.get("folderId")?.trim() || "";
    const view = request.nextUrl.searchParams.get("view")?.trim() || "";
    if (folderId && folderId !== "my-notes" && !/^fol_[a-zA-Z0-9]{14}$/.test(folderId)) {
      return Response.json({ message: "Invalid space ID.", items: [] }, { status: 400 });
    }
    if (view === "context") {
      const context = await queryGranolaSpaceContext(
        folderId === "my-notes" ? undefined : folderId,
      );
      if (missingCredentials()) {
        return Response.json({ live: true, message: null, ...context });
      }
      const [people, companies] = await Promise.all([
        Promise.all(
          context.people.map(async (person) => {
            const result = await queryPeople({ q: person.name });
            const normalizedEmail = person.email.trim().toLowerCase();
            const normalizedName = person.name.trim().toLowerCase();
            const match =
              result.items.find(
                (candidate) => candidate.email.trim().toLowerCase() === normalizedEmail,
              ) ??
              result.items.find(
                (candidate) => candidate.name.trim().toLowerCase() === normalizedName,
              );
            return match
              ? {
                  ...person,
                  id: match.id,
                  href: `/people/${match.id}`,
                  photoUrl: match.photoUrl,
                  color: match.avatarColor,
                }
              : person;
          }),
        ),
        Promise.all(
          context.companies.map(async (company) => {
            const match = await findCompanyByDomain(company.domain);
            return match
              ? {
                  ...company,
                  id: match.id,
                  name: match.name,
                  href: `/companies/${match.id}`,
                  photoUrl: match.logoUrl,
                  color: match.logoColor,
                }
              : company;
          }),
        ),
      ]);
      return Response.json({ live: true, message: null, people, companies });
    }
    const items = folderId
      ? await queryGranolaSpaceNotes(folderId === "my-notes" ? undefined : folderId)
      : await listGranolaFolders();
    return Response.json({ live: true, message: null, items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load spaces.";
    return Response.json({ live: false, message, items: [] }, { status: 502 });
  }
}
