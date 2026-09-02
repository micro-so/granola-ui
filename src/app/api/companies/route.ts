import { NextRequest } from "next/server";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { getCompany, queryCompanies } from "@/lib/micro-companies";
import {
  getEditablePropertyOptions,
  getEditableRecord,
  updateEditableRecord,
} from "@/lib/micro-editable";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";
  const id = request.nextUrl.searchParams.get("id")?.trim() || "";
  const viewId = request.nextUrl.searchParams.get("view")?.trim() || "";
  const editor = request.nextUrl.searchParams.get("editor") === "1";
  const editorOptions = request.nextUrl.searchParams.get("editorOptions")?.trim() || "";

  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load companies.");
  }

  try {
    if (id) {
      if (editorOptions) {
        const options = await getEditablePropertyOptions("organization", editorOptions);
        return Response.json({ live: true, message: null, options });
      }
      if (editor) {
        const result = await getEditableRecord("organization", id);
        return Response.json({ live: true, message: null, ...result });
      }
      const company = await getCompany(id);
      return Response.json({
        live: true,
        message: company ? null : "Company not found.",
        items: company ? [company] : [],
      });
    }

    const result = await queryCompanies({ q, viewId });
    return Response.json({
      live: true,
      message: result.items.length === 0 ? "No companies in Micro yet." : null,
      ...result,
    });
  } catch (error) {
    return failedPayload(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (missingCredentials()) {
    return Response.json(
      { live: false, message: "Add MICRO_API_KEY and MICRO_TEAM_ID to edit companies." },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { id?: unknown; properties?: unknown };
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (!id) return Response.json({ message: "Company ID is required." }, { status: 400 });
    await updateEditableRecord("organization", id, body.properties);
    return Response.json({ live: true, message: null });
  } catch (error) {
    return failedPayload(error);
  }
}
