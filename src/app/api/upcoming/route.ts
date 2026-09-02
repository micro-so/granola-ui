import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";
import { queryUpcoming } from "@/lib/micro-events";

export const runtime = "nodejs";

export async function GET() {
  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to .env.local to load events.");
  }

  try {
    const result = await queryUpcoming();
    return Response.json({
      live: true,
      message: null,
      ...result,
    });
  } catch (error) {
    return failedPayload(error);
  }
}
