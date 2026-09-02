import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Note } from "@/lib/data";
import { activityDateLabel, formatClockTime, isoDate } from "@/lib/data";

type LocalIMessageFixture = {
  conversations: Array<{
    id: string;
    title: string;
    personIds: string[];
    companyDomains?: string[];
    participantName: string;
    messages: Array<{
      id: string;
      text: string;
      senderName: string;
      occurredAt: string;
    }>;
  }>;
};

export async function queryLocalIMessageActivity(options: {
  personId?: string;
  companyId?: string;
  domain?: string;
  domains?: string[];
}) {
  const targetDomains = [options.domain, ...(options.domains ?? [])]
    .map((domain) => domain?.trim().toLowerCase())
    .filter((domain): domain is string => Boolean(domain));
  if (!options.personId && !options.companyId) return [] as Note[];

  const fixturePath =
    process.env.LOCAL_IMESSAGE_ACTIVITY_PATH ||
    path.join(process.cwd(), ".local", "imessage-activity.json");

  try {
    const fixture = JSON.parse(
      await readFile(/* turbopackIgnore: true */ fixturePath, "utf8"),
    ) as LocalIMessageFixture;

    return fixture.conversations
      .filter(
        (conversation) =>
          (options.personId &&
            conversation.personIds.includes(options.personId)) ||
          (options.companyId &&
            conversation.companyDomains?.some((domain) =>
              targetDomains.includes(domain.toLowerCase()),
            )),
      )
      .flatMap((conversation) =>
        conversation.messages.map((message) => ({
          id: `local-imessage-${message.id}`,
          title: conversation.title || "iMessage chat",
          date: isoDate(message.occurredAt),
          dateLabel: activityDateLabel(message.occurredAt),
          time: formatClockTime(message.occurredAt),
          personIds: conversation.personIds,
          companyId: options.companyId ?? "",
          preview: `You & ${conversation.participantName}`,
          chatSnippet: message.text,
          chatThreadId: `${conversation.id}:${isoDate(message.occurredAt)}`,
          kind: "chat" as const,
          occurredAt: message.occurredAt,
          source: "demo" as const,
          leadName: conversation.participantName,
          otherNames: [conversation.participantName],
        })),
      )
      .sort((left, right) =>
        right.occurredAt.localeCompare(left.occurredAt),
      );
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [] as Note[];
    throw error;
  }
}
