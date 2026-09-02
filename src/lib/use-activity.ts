"use client";

import { useEffect, useState } from "react";
import {
  notesForCompany,
  notesForPerson,
  upcomingEvents,
  upcomingForCompany,
  upcomingForPerson,
  upcomingToNote,
  type Company,
  type Note,
  type Person,
} from "@/lib/data";
import { fetchJsonCached, getCachedJson } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";
import { groupAdjacentMessages } from "@/lib/group-activity-messages";

type Payload = {
  items?: Note[];
  upcoming?: Note[];
  live?: boolean;
  message?: string | null;
};

function placeholderActivity(options: {
  personId?: string;
  companyId?: string;
  person?: Pick<Person, "id" | "name" | "avatarColor" | "photoUrl">;
  company?: Pick<Company, "id" | "name" | "logoColor" | "logoUrl">;
}) {
  const items = options.personId
    ? notesForPerson(options.personId)
    : options.companyId
      ? notesForCompany(options.companyId)
      : [];

  const upcoming = options.person
    ? upcomingForPerson(upcomingEvents, options.person).map((event) =>
        upcomingToNote(event, {
          leadName: options.person?.name,
          leadColor: options.person?.avatarColor,
          leadPhotoUrl: options.person?.photoUrl,
          otherNames: options.person ? [options.person.name] : [],
        }),
      )
    : options.company
      ? upcomingForCompany(upcomingEvents, options.company).map((event) =>
          upcomingToNote(event, {
            leadName: options.company?.name,
            leadColor: options.company?.logoColor,
            leadPhotoUrl: options.company?.logoUrl,
            otherNames: options.company ? [options.company.name] : [],
          }),
        )
      : [];

  return { items, upcoming };
}

export function useActivity(options: {
  personId?: string;
  companyId?: string;
  q?: string;
  email?: string;
  domain?: string;
  domains?: string[];
  person?: Pick<Person, "id" | "name" | "avatarColor" | "photoUrl">;
  company?: Pick<Company, "id" | "name" | "logoColor" | "logoUrl">;
  enabled?: boolean;
} = {}) {
  const { source } = useDataSource();
  const placeholder = placeholderActivity(options);
  const [result, setResult] = useState<{
    key: string;
    targetKey: string;
    items: Note[];
    upcoming: Note[];
    live: boolean;
    message: string | null;
  }>({ key: "", targetKey: "", items: [], upcoming: [], live: false, message: null });
  const [localResult, setLocalResult] = useState<{ key: string; items: Note[] }>({
    key: "",
    items: [],
  });
  const enabled = options.enabled ?? true;
  const targetKey = options.personId
    ? `person:${options.personId}`
    : options.companyId
      ? `company:${options.companyId}`
      : "";
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries({
    personId: options.personId,
    companyId: options.companyId,
    q: options.q,
    email: options.email,
    domain: options.domain,
  })) {
    if (value) query.set(key, value);
  }
  if (options.domains?.length) query.set("domains", options.domains.join(","));
  query.set("v", "17");
  const queryString = query.toString();
  const url = `/api/activity?${queryString}`;
  const emailQuery = new URLSearchParams(query);
  emailQuery.delete("q");
  emailQuery.set("v", "6");
  const emailQueryString = emailQuery.toString();
  const emailUrl = `/api/email-activity?${emailQueryString}`;
  const imessageQuery = new URLSearchParams(query);
  imessageQuery.delete("email");
  imessageQuery.delete("q");
  imessageQuery.set("v", "3");
  const imessageQueryString = imessageQuery.toString();
  const imessageUrl = `/api/imessage-activity?${imessageQueryString}`;
  const localKey = `${emailQueryString}|${imessageQueryString}`;

  useEffect(() => {
    if (source === "placeholder" || !enabled) return;

    let cancelled = false;
    fetchJsonCached<Payload>(url)
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: queryString,
          targetKey,
          items: data.items ?? [],
          upcoming: data.upcoming ?? [],
          live: Boolean(data.live),
          message: data.message ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          key: queryString,
          targetKey,
          items: [],
          upcoming: [],
          live: false,
          message: error instanceof Error ? error.message : "Could not load activity.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [source, queryString, targetKey, enabled, url]);

  useEffect(() => {
    if (source === "placeholder" || !enabled) return;

    let cancelled = false;
    Promise.all([
      fetchJsonCached<Payload>(emailUrl).catch(() => ({ items: [] })),
      fetchJsonCached<Payload>(imessageUrl).catch(() => ({ items: [] })),
    ])
      .then(([emailData, imessageData]) => {
        if (cancelled) return;
        const items = [
          ...(emailData.items ?? []),
          ...(imessageData.items ?? []),
        ].sort((left, right) =>
          (right.occurredAt ?? right.date).localeCompare(
            left.occurredAt ?? left.date,
          ),
        );
        setLocalResult({ key: localKey, items: groupAdjacentMessages(items) });
      });

    return () => {
      cancelled = true;
    };
  }, [emailUrl, enabled, imessageUrl, localKey, source]);

  if (source === "placeholder") {
    return { source, status: "ready" as const, ...placeholder, live: false, message: null };
  }
  if (!enabled) {
    return { source, status: "loading" as const, items: [], upcoming: [], live: false, message: null };
  }
  if (result.key !== queryString) {
    const cached = getCachedJson<Payload>(url);
    if (cached) {
      return {
        source,
        status: "ready" as const,
        items: cached.items ?? [],
        upcoming: cached.upcoming ?? [],
        live: Boolean(cached.live),
        message: cached.message ?? null,
      };
    }
    if (result.targetKey === targetKey) {
      return { source, status: "loading" as const, ...result };
    }
    const cachedEmails = getCachedJson<Payload>(emailUrl)?.items ?? [];
    const cachedMessages = getCachedJson<Payload>(imessageUrl)?.items ?? [];
    const immediateItems =
      cachedEmails.length > 0 || cachedMessages.length > 0
        ? groupAdjacentMessages(
            [...cachedEmails, ...cachedMessages].sort((left, right) =>
              (right.occurredAt ?? right.date).localeCompare(
                left.occurredAt ?? left.date,
              ),
            ),
          )
        : localResult.key === localKey
          ? localResult.items
          : [];
    if (immediateItems.length > 0) {
      return {
        source,
        status: "loading" as const,
        items: immediateItems,
        upcoming: [],
        live: true,
        message: null,
      };
    }
    return { source, status: "loading" as const, items: [], upcoming: [], live: false, message: null };
  }
  return { source, status: "ready" as const, ...result };
}
