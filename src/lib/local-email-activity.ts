import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Note } from "@/lib/data";
import { activityDateLabel, formatClockTime, isoDate } from "@/lib/data";

type LocalEmail = {
  id: string;
  threadId: string;
  subject: string;
  senderEmail: string;
  senderName: string;
  recipients: string[];
  occurredAt: string;
  snippet?: string;
  messageCount?: number;
};

type LocalEmailFixture = {
  emails: LocalEmail[];
};

function normalized(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function emailDomain(email: string) {
  return normalized(email).split("@")[1] ?? "";
}

function decodeSnippet(value: string | undefined) {
  return (value ?? "")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function matchesTarget(
  email: LocalEmail,
  options: {
    personId?: string;
    companyId?: string;
    email?: string;
    domain?: string;
    domains?: string[];
  },
) {
  const participants = [email.senderEmail, ...email.recipients].map(normalized);
  const personEmail = normalized(options.email);
  if (options.personId && personEmail) return participants.includes(personEmail);

  const domains = [...new Set([options.domain, ...(options.domains ?? [])])]
    .map((domain) => normalized(domain).replace(/^@/, ""))
    .filter(Boolean);
  if (options.companyId && domains.length > 0) {
    return participants.some((participant) => {
      const candidate = emailDomain(participant);
      return domains.some(
        (domain) => candidate === domain || candidate.endsWith(`.${domain}`),
      );
    });
  }
  return false;
}

export async function queryLocalEmailActivity(options: {
  personId?: string;
  companyId?: string;
  email?: string;
  domain?: string;
  domains?: string[];
}) {
  const fixturePath =
    process.env.LOCAL_EMAIL_ACTIVITY_PATH ||
    path.join(process.cwd(), ".local", "email-activity.json");

  try {
    const fixture = JSON.parse(
      await readFile(/* turbopackIgnore: true */ fixturePath, "utf8"),
    ) as LocalEmailFixture;
    if (!Array.isArray(fixture.emails)) return [];

    const matchingThreadIds = new Set(
      fixture.emails
        .filter((email) => matchesTarget(email, options))
        .map((email) => email.threadId),
    );

    return fixture.emails
      .filter((email) => matchingThreadIds.has(email.threadId))
      .map((email) => ({
          id: `local-gmail-${email.id}`,
          title: email.senderName,
          date: isoDate(email.occurredAt),
          dateLabel: activityDateLabel(email.occurredAt),
          time: formatClockTime(email.occurredAt),
          personIds: options.personId ? [options.personId] : [],
          companyId: options.companyId ?? "",
          preview: email.subject,
          emailSnippet: decodeSnippet(email.snippet),
          emailThreadId: email.threadId,
          badge:
            email.messageCount && email.messageCount > 1
              ? String(email.messageCount)
              : undefined,
          href: `https://mail.google.com/mail/u/0/#all/${encodeURIComponent(email.threadId)}`,
          kind: "email" as const,
          occurredAt: email.occurredAt,
          source: "demo" as const,
          leadName: email.senderName,
          otherNames: [email.senderName],
      }))
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [] as Note[];
    throw error;
  }
}
