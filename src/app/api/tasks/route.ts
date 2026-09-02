import { NextRequest } from "next/server";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { decideTask, queryTasks } from "@/lib/micro-tasks";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const personId = request.nextUrl.searchParams.get("personId")?.trim() || "";
  const companyId = request.nextUrl.searchParams.get("companyId")?.trim() || "";
  const q = request.nextUrl.searchParams.get("q")?.trim() || "";

  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load tasks.");
  }

  try {
    const result = await queryTasks({
      personId: personId || undefined,
      companyId: companyId || undefined,
      q: q || undefined,
    });
    return Response.json({ live: true, message: null, ...result });
  } catch (error) {
    return failedPayload(error);
  }
}

export async function PATCH(request: NextRequest) {
  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to update tasks.");
  }

  try {
    const body = (await request.json()) as { id?: string; decision?: string };
    const id = body.id?.trim() ?? "";
    const decision = body.decision === "reject" ? "reject" : body.decision === "approve" ? "approve" : "";
    if (!id || !decision) {
      return Response.json({ live: false, message: "Missing task id or decision." }, { status: 400 });
    }
    await decideTask(id, decision);
    return Response.json({ live: true, message: null });
  } catch (error) {
    return failedPayload(error);
  }
}
