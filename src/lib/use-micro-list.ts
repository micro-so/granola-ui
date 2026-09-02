"use client";

import { useEffect, useRef, useState } from "react";
import { fetchJsonCached, getCachedJson } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";

type Payload<T> = {
  items?: T[];
  live?: boolean;
  message?: string | null;
};

export function useMicroList<T>({
  path,
  params,
  placeholder,
  fallbackWhenEmpty = false,
  enabled = true,
  debounceMs = 0,
}: {
  path: string;
  params?: Record<string, string | undefined>;
  placeholder: T[];
  fallbackWhenEmpty?: boolean;
  enabled?: boolean;
  debounceMs?: number;
}) {
  const { source } = useDataSource();
  const [items, setItems] = useState<T[]>(placeholder);
  const [status, setStatus] = useState<"ready" | "loading">("ready");
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const placeholderRef = useRef(placeholder);
  useEffect(() => {
    placeholderRef.current = placeholder;
  }, [placeholder]);
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) query.set(key, value);
  }
  const queryString = query.toString();
  const url = `${path}?${queryString}`;

  useEffect(() => {
    if (source === "placeholder" || !enabled) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const cached = getCachedJson<Payload<T>>(url);
      if (cached) {
        setItems(cached.items ?? []);
        setLive(Boolean(cached.live));
        setMessage(cached.message ?? null);
        setStatus("ready");
      } else {
        setStatus("loading");
      }
      try {
        const data = await fetchJsonCached<Payload<T>>(url);
        if (cancelled) return;
        const next = data.items ?? [];
        const nextLive = Boolean(data.live);
        if (fallbackWhenEmpty && !nextLive) {
          setItems(placeholderRef.current);
          setLive(false);
          setMessage(data.message ?? "Could not load Micro data.");
        } else {
          setItems(next);
          setLive(nextLive);
          setMessage(data.message ?? null);
        }
        setStatus("ready");
      } catch (error) {
        if (cancelled) return;
        if (fallbackWhenEmpty) {
          setItems(placeholderRef.current);
          setLive(false);
          setMessage(error instanceof Error ? error.message : "Could not load Micro data.");
        } else {
          setItems([]);
          setLive(false);
          setMessage(error instanceof Error ? error.message : "Could not load Micro data.");
        }
        setStatus("ready");
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [source, url, fallbackWhenEmpty, enabled, debounceMs]);

  if (source === "placeholder") {
    return { source, status: "ready" as const, items: placeholder, live: false, message: null };
  }
  if (!enabled) {
    return { source, status: "loading" as const, items: [] as T[], live: false, message: null };
  }
  const cached = getCachedJson<Payload<T>>(url);
  if (cached) {
    return {
      source,
      status: "ready" as const,
      items: cached.items ?? [],
      live: Boolean(cached.live),
      message: cached.message ?? null,
    };
  }
  return { source, status, items, live, message };
}
