import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { listCompanyViews } from "@/lib/micro-companies";

export const runtime = "nodejs";

export async function GET() {
  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load company views.");
  }

  try {
    const items = await listCompanyViews();
    return Response.json({ live: true, message: null, items });
  } catch (error) {
    return failedPayload(error);
  }
}
