import type { ProfileComment } from "@/lib/data";
import { colorFromId } from "@/lib/data";
import { asString, getMicroClient, propertiesOf, type PrismRow } from "@/lib/micro";

type CommentTarget = {
  personId?: string;
  companyId?: string;
};

type CommentQueryResponse = {
  data?: PrismRow[];
};

function commentPath(suffix = "") {
  const teamId = process.env.MICRO_TEAM_ID;
  if (!teamId) throw new Error("Missing MICRO_TEAM_ID");
  return `/v2/prism/${teamId}/comment${suffix}`;
}

function normalizeTimestamp(value: unknown) {
  const timestamp = asString(value).trim();
  if (!timestamp) return new Date().toISOString();
  return /(?:Z|[+-]\d{2}:\d{2})$/i.test(timestamp) ? timestamp : `${timestamp}Z`;
}

function mapComment(row: PrismRow): ProfileComment | null {
  const properties = propertiesOf(row);
  const body = asString(properties.body).trim();
  if (!body) return null;
  const author = asString(properties.created_by).trim() || "You";

  return {
    id: row.id,
    body,
    author,
    occurredAt: normalizeTimestamp(properties.created_at),
    authorColor: colorFromId(author),
  };
}

function targetProperty(target: CommentTarget) {
  if (target.personId) return { slug: "people", id: target.personId };
  if (target.companyId) return { slug: "companies", id: target.companyId };
  throw new Error("A person or company is required.");
}

export async function queryComments(target: CommentTarget): Promise<ProfileComment[]> {
  const micro = getMicroClient();
  const relation = targetProperty(target);
  const response = await micro.post<CommentQueryResponse>(commentPath("/query"), {
    body: {
      query: {
        select: ["body", "created_at", "created_by", relation.slug],
        sort: [{ created_at: "desc" }],
        filter: [{ [relation.slug]: { "=": relation.id } }],
        limit: 50,
      },
    },
  });

  return (response.data ?? [])
    .map(mapComment)
    .filter((comment): comment is ProfileComment => comment !== null);
}

export async function createComment(target: CommentTarget, body: string): Promise<ProfileComment> {
  const micro = getMicroClient();
  const relation = targetProperty(target);
  const response = await micro.post<PrismRow>(commentPath(), {
    body: {
      default: {
        body,
        [relation.slug]: [relation.id],
      },
    },
  });
  const comment = mapComment(response);
  if (!comment) throw new Error("Micro created an empty comment.");
  const resolved = await queryComments(target);
  return resolved.find((item) => item.id === comment.id) ?? comment;
}
