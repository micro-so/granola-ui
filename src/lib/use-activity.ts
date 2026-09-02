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
import { fetchJsonCached } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";

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
  person?: Pick<Person, "id" | "name" | "avatarColor" | "photoUrl">;
  company?: Pick<Company, "id" | "name" | "logoColor" | "logoUrl">;
  enabled?: boolean;
} = {}) {
  const { source } = useDataSource();
  const placeholder = placeholderActivity(options);
  const [result, setResult] = useState<{
    key: string;
    items: Note[];
    upcoming: Note[];
    live: boolean;
    message: string | null;
  }>({ key: "", items: [], upcoming: [], live: false, message: null });
  const enabled = options.enabled ?? true;
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
  query.set("v", "2");
  const queryString = query.toString();

  useEffect(() => {
    if (source === "placeholder" || !enabled) return;

    let cancelled = false;
    fetchJsonCached<Payload>(`/api/activity?${queryString}`)
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: queryString,
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
          items: [],
          upcoming: [],
          live: false,
          message: error instanceof Error ? error.message : "Could not load activity.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [source, queryString, enabled]);

  if (source === "placeholder") {
    return { source, status: "ready" as const, ...placeholder, live: false, message: null };
  }
  if (!enabled || result.key !== queryString) {
    return { source, status: "loading" as const, items: [], upcoming: [], live: false, message: null };
  }
  return { source, status: "ready" as const, ...result };
}
