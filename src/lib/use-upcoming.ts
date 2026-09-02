"use client";

import { useEffect, useState } from "react";
import { fetchJsonCached } from "@/lib/client-query-cache";
import { upcomingEvents, type Note, type UpcomingEvent } from "@/lib/data";
import { useDataSource } from "@/lib/data-source";

type Payload = {
  items?: UpcomingEvent[];
  past?: Note[];
  live?: boolean;
  message?: string | null;
};

export function useUpcoming() {
  const { source } = useDataSource();
  const [result, setResult] = useState<{
    loaded: boolean;
    items: UpcomingEvent[];
    past: Note[];
    live: boolean;
    message: string | null;
  }>({ loaded: false, items: [], past: [], live: false, message: null });

  useEffect(() => {
    if (source === "placeholder") return;

    let cancelled = false;
    fetchJsonCached<Payload>("/api/upcoming?v=3")
      .then((data) => {
        if (cancelled) return;
        setResult({
          loaded: true,
          items: data.items ?? [],
          past: data.past ?? [],
          live: Boolean(data.live),
          message: data.message ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          loaded: true,
          items: [],
          past: [],
          live: false,
          message: error instanceof Error ? error.message : "Could not load events.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [source]);

  if (source === "placeholder") {
    return { source, status: "ready" as const, items: upcomingEvents, past: [], live: false, message: null };
  }
  if (!result.loaded) {
    return { source, status: "loading" as const, items: [], past: [], live: false, message: null };
  }
  return { source, status: "ready" as const, ...result };
}
