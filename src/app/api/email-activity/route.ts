import { NextRequest } from "next/server";
import { queryLocalEmailActivity } from "@/lib/local-email-activity";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";
  const email = request.nextUrl.searchParams.get("email")?.trim() || "";
  const domain = request.nextUrl.searchParams.get("domain")?.trim() || "";
  const domains = (request.nextUrl.searchParams.get("domains") || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const items = await queryLocalEmailActivity({
    personId: personId || undefined,
    companyId: companyId || undefined,
    email: email || undefined,
    domain: domain || undefined,
    domains,
  });

  return Response.json({ items });
}
