import { NextRequest } from "next/server";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { queryProfileDeals } from "@/lib/micro-lists";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";

  if (!personId && !companyId) {
    return Response.json(
      { message: "A personId or companyId is required." },
      { status: 400 },
    );
  }
  if (missingCredentials()) {
    return credentialsPayload("Add Micro credentials to load deals.");
  }

  try {
    const items = await queryProfileDeals({
      personId: personId || undefined,
      companyId: companyId || undefined,
    });
    return Response.json({ live: true, message: null, items });
  } catch (error) {
    return failedPayload(error);
  }
}
