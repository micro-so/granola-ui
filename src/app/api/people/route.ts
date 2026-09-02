import { NextRequest } from "next/server";
import { credentialsPayload, failedPayload, getMicroClient, missingCredentials } from "@/lib/micro";
import {
  getEditablePropertyOptions,
  getEditableRecord,
  updateEditableRecord,
} from "@/lib/micro-editable";
import { getLocalPersonOverride } from "@/lib/local-profile-overrides";
import { getPerson, queryPeople, queryPeopleAtCompany } from "@/lib/micro-people";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const id = request.nextUrl.searchParams.get("id")?.trim() || "";
  const viewId = request.nextUrl.searchParams.get("view")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";
  const domain = request.nextUrl.searchParams.get("domain")?.trim() || "";
  const domains = (request.nextUrl.searchParams.get("domains") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const name = request.nextUrl.searchParams.get("name")?.trim() || "";
  const page = Number(request.nextUrl.searchParams.get("page") || "1");
  const editor = request.nextUrl.searchParams.get("editor") === "1";
  const editorOptions = request.nextUrl.searchParams.get("editorOptions")?.trim() || "";

  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load people.");
  }

  try {
    if (id) {
      if (editorOptions) {
        const options = await getEditablePropertyOptions("identity", editorOptions);
        return Response.json({ live: true, message: null, options });
      }
      if (editor) {
        const result = await getEditableRecord("identity", id);
        return Response.json({ live: true, message: null, ...result });
      }
      const person = await getPerson(id);
      const localOverride = person ? await getLocalPersonOverride(id) : {};
      const resolvedPerson = person ? { ...person, ...localOverride } : null;
      return Response.json({
        live: true,
        message: resolvedPerson ? null : "Person not found.",
        items: resolvedPerson ? [resolvedPerson] : [],
      });
    }

    if (companyId || domain || name) {
      const result = await queryPeopleAtCompany({
        companyId: companyId || undefined,
        domain: domain || undefined,
        domains,
        name: name || undefined,
      });
      return Response.json({ live: true, message: null, ...result });
    }

    const result = await queryPeople({ page, q, viewId });
    return Response.json({ live: true, message: null, ...result });
  } catch (error) {
    return failedPayload(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (missingCredentials()) {
    return Response.json(
      { live: false, message: "Add MICRO_API_KEY and MICRO_TEAM_ID to edit profiles." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { id?: unknown; properties?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ message: "Profile ID is required." }, { status: 400 });
    await updateEditableRecord("identity", id, body.properties);
    return Response.json({ live: true, message: null });
  } catch (error) {
    return failedPayload(error);
  }
}

export async function DELETE(request: NextRequest) {
  if (missingCredentials()) {
    return Response.json(
      { live: false, message: "Add MICRO_API_KEY and MICRO_TEAM_ID to remove profiles." },
      { status: 503 },
    );
  }

  const id = request.nextUrl.searchParams.get("id")?.trim() || "";
  if (!id) {
    return Response.json({ message: "Profile ID is required." }, { status: 400 });
  }

  try {
    const micro = getMicroClient();
    await micro.prism.objects.identities.delete(id);
    return Response.json({ live: true, message: null });
  } catch (error) {
    return failedPayload(error);
  }
}
