import { NextRequest } from "next/server";
import { failedPayload, missingCredentials } from "@/lib/micro";
import {
  getMicroList,
  listMicroLists,
  queryProfileFolderMemberships,
  queryMicroListRecords,
} from "@/lib/micro-lists";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (missingCredentials()) {
    return Response.json(
      { live: false, message: "Add MICRO_API_KEY and MICRO_TEAM_ID to load CRMs.", items: [] },
      { status: 503 },
    );
  }

  try {
    const id = request.nextUrl.searchParams.get("id")?.trim() || "";
    const personId =
      request.nextUrl.searchParams.get("personId")?.trim() || "";
    const companyId =
      request.nextUrl.searchParams.get("companyId")?.trim() || "";
    if (personId || companyId) {
      const items = await queryProfileFolderMemberships({
        personId: personId || undefined,
        companyId: companyId || undefined,
      });
      return Response.json({ live: true, message: null, items });
    }
    if (!id) {
      const items = await listMicroLists();
      return Response.json({ live: true, message: null, items });
    }
    const list = await getMicroList(id);
    if (!list) {
      return Response.json({ live: true, message: "CRM not found.", list: null, items: [] });
    }
    const items = await queryMicroListRecords(list);
    return Response.json({ live: true, message: null, list, items });
  } catch (error) {
    return failedPayload(error);
  }
}
