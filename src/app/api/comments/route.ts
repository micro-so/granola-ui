import { NextRequest } from "next/server";
import { createComment, queryComments } from "@/lib/micro-comments";
import { credentialsPayload, failedPayload, missingCredentials } from "@/lib/micro";

export const runtime = "nodejs";

function targetFrom(request: NextRequest) {
  return {
    personId: request.nextUrl.searchParams.get("personId")?.trim() || undefined,
    companyId: request.nextUrl.searchParams.get("companyId")?.trim() || undefined,
  };
}

export async function GET(request: NextRequest) {
  if (missingCredentials()) {
    return credentialsPayload("Add MICRO_API_KEY and MICRO_TEAM_ID to load comments.");
  }

  try {
    const target = targetFrom(request);
    if (Boolean(target.personId) === Boolean(target.companyId)) {
      return Response.json({ message: "Provide exactly one person or company." }, { status: 400 });
    }
    const items = await queryComments(target);
    return Response.json({ live: true, message: null, items });
  } catch (error) {
    return failedPayload(error);
  }
}

export async function POST(request: NextRequest) {
  if (missingCredentials()) {
    return Response.json(
      { live: false, message: "Add MICRO_API_KEY and MICRO_TEAM_ID to create comments." },
      { status: 503 },
    );
  }

  try {
    const payload = (await request.json()) as {
      personId?: unknown;
      companyId?: unknown;
      body?: unknown;
    };
    const body = typeof payload.body === "string" ? payload.body.trim() : "";
    if (!body) return Response.json({ message: "Comment cannot be empty." }, { status: 400 });
    if (body.length > 10_000) {
      return Response.json({ message: "Comment must be 10,000 characters or fewer." }, { status: 400 });
    }

    const target = {
      personId: typeof payload.personId === "string" ? payload.personId.trim() : undefined,
      companyId: typeof payload.companyId === "string" ? payload.companyId.trim() : undefined,
    };
    if (Boolean(target.personId) === Boolean(target.companyId)) {
      return Response.json({ message: "Provide exactly one person or company." }, { status: 400 });
    }
    const item = await createComment(target, body);
    return Response.json({ live: true, message: null, item }, { status: 201 });
  } catch (error) {
    return failedPayload(error);
  }
}
