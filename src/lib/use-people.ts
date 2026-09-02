"use client";

import { useCallback, useEffect, useState } from "react";
import {
  people as placeholderPeople,
  peopleAtCompany,
  personById,
  placeholderPeopleViews,
  type PeopleView,
  type Person,
} from "@/lib/data";
import { fetchJsonCached, getCachedJson } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";
import { useMicroList } from "@/lib/use-micro-list";

type PeoplePayload = {
  items?: Person[];
  live?: boolean;
  message?: string | null;
  hasMore?: boolean;
  nextPage?: number | null;
};

export function usePeopleViews() {
  return useMicroList<PeopleView>({
    path: "/api/people/views",
    placeholder: placeholderPeopleViews,
  });
}

export function usePeople(
  options: { search?: string; viewId?: string; enabled?: boolean } = {},
) {
  const { source } = useDataSource();
  const enabled = options.enabled ?? true;
  const [items, setItems] = useState<Person[]>(placeholderPeople);
  const [loadedKey, setLoadedKey] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextPage, setNextPage] = useState<number | null>(null);
  const params = new URLSearchParams();
  if (options.search) params.set("q", options.search);
  if (options.viewId && !options.search) params.set("view", options.viewId);
  const queryString = params.toString();
  const delay = options.search ? 250 : 0;

  useEffect(() => {
    if (source === "placeholder" || !enabled) return;

    let cancelled = false;
    const url = `/api/people?${queryString}`;
    const timer = window.setTimeout(async () => {
      try {
        const cached = getCachedJson<PeoplePayload>(url);
        if (cached) {
          setItems(cached.items ?? []);
          setLive(Boolean(cached.live));
          setMessage(cached.message ?? null);
          setHasMore(Boolean(cached.hasMore));
          setNextPage(cached.nextPage ?? null);
          setLoadedKey(queryString);
        }
        const data = await fetchJsonCached<PeoplePayload>(url);
        if (cancelled) return;
        setItems(data.items ?? []);
        setLive(Boolean(data.live));
        setMessage(data.message ?? null);
        setHasMore(Boolean(data.hasMore));
        setNextPage(data.nextPage ?? null);
        setLoadedKey(queryString);
      } catch (error) {
        if (cancelled) return;
        setItems([]);
        setLive(false);
        setMessage(error instanceof Error ? error.message : "Could not load people.");
        setHasMore(false);
        setNextPage(null);
        setLoadedKey(queryString);
      }
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [delay, enabled, queryString, source]);

  const loadMore = useCallback(async () => {
    if (loadedKey !== queryString || !nextPage || loadingMore || source !== "micro" || !enabled) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ page: String(nextPage) });
      if (options.search) params.set("q", options.search);
      if (options.viewId && !options.search) params.set("view", options.viewId);
      const response = await fetch(`/api/people?${params.toString()}`);
      const data = (await response.json()) as PeoplePayload;
      setItems((current) => {
        const seen = new Set(current.map((person) => person.id));
        return [...current, ...(data.items ?? []).filter((person) => !seen.has(person.id))];
      });
      setHasMore(Boolean(data.hasMore));
      setNextPage(data.nextPage ?? null);
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, loadedKey, loadingMore, nextPage, options.search, options.viewId, queryString, source]);

  if (source === "placeholder") {
    return {
      source,
      status: "ready" as const,
      items: placeholderPeople,
      live: false,
      message: null,
      hasMore: false,
      loadingMore: false,
      loadMore,
    };
  }
  if (!enabled || loadedKey !== queryString) {
    return {
      source,
      status: "loading" as const,
      items: [],
      live: false,
      message: null,
      hasMore: false,
      loadingMore: false,
      loadMore,
    };
  }
  return { source, status: "ready" as const, items, live, message, hasMore, loadingMore, loadMore };
}

export function usePerson(id: string) {
  const { source } = useDataSource();
  const [person, setPerson] = useState<Person | undefined>();
  const [loadedId, setLoadedId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const url = `/api/people?id=${encodeURIComponent(id)}&v=2`;

  useEffect(() => {
    if (!id || source === "placeholder") return;

    let cancelled = false;
    fetchJsonCached<{ items?: Person[]; message?: string | null }>(url)
      .then((data) => {
        if (cancelled) return;
        setPerson(data.items?.[0]);
        setMessage(data.message ?? null);
        setLoadedId(id);
      })
      .catch((error) => {
        if (cancelled) return;
        setPerson(undefined);
        setMessage(error instanceof Error ? error.message : "Could not load person.");
        setLoadedId(id);
      });

    return () => {
      cancelled = true;
    };
  }, [id, source, url]);

  if (!id) return { source, person: undefined, status: "ready" as const, message: null };
  if (source === "placeholder") {
    return { source, person: personById(id), status: "ready" as const, message: null };
  }
  if (loadedId !== id) {
    const cached = getCachedJson<{ items?: Person[]; message?: string | null }>(url);
    if (cached) {
      return {
        source,
        person: cached.items?.[0],
        status: "ready" as const,
        message: cached.message ?? null,
      };
    }
    return { source, person: undefined, status: "loading" as const, message: null };
  }
  return { source, person, status: "ready" as const, message };
}

export function useCompanyConnections(options: {
  companyId: string;
  domain?: string;
  domains?: string[];
  name?: string;
  enabled?: boolean;
}) {
  const { source } = useDataSource();
  const enabled = options.enabled ?? true;
  const placeholder = peopleAtCompany(options.companyId);
  const [items, setItems] = useState<Person[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const query = new URLSearchParams({ companyId: options.companyId });
  query.set("identityType", "human");
  if (options.domain) query.set("domain", options.domain);
  if (options.domains?.length) query.set("domains", options.domains.join(","));
  if (options.name) query.set("name", options.name);
  const queryString = query.toString();
  const url = `/api/people?${queryString}`;

  useEffect(() => {
    if (source === "placeholder" || !enabled || !options.companyId) return;

    let cancelled = false;
    fetchJsonCached<{
          items?: Person[];
          connectionCount?: number;
        }>(url)
      .then((data) => {
        if (cancelled) return;
        const next = data.items ?? [];
        setItems(next);
        setConnectionCount(data.connectionCount ?? next.length);
        setLoadedKey(queryString);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setConnectionCount(0);
        setLoadedKey(queryString);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, options.companyId, queryString, source, url]);

  if (source === "placeholder") {
    return { items: placeholder, connectionCount: placeholder.length, status: "ready" as const };
  }
  if (!enabled || !options.companyId || loadedKey !== queryString) {
    const cached = getCachedJson<{
      items?: Person[];
      connectionCount?: number;
    }>(url);
    if (enabled && options.companyId && cached) {
      const next = cached.items ?? [];
      return {
        items: next,
        connectionCount: cached.connectionCount ?? next.length,
        status: "ready" as const,
      };
    }
    return { items: [], connectionCount: 0, status: "loading" as const };
  }
  return { items, connectionCount, status: "ready" as const };
}
