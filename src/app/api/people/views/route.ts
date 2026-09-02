import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { listPeopleViews } from "@/lib/micro-people";

export const runtime = "nodejs";

export async function GET() {
  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load people views.");
  }

  try {
    const items = await listPeopleViews();
    return Response.json({ live: true, message: null, items });
  } catch (error) {
    return failedPayload(error);
  }
}
