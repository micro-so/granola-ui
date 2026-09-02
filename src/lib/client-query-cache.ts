"use client";

const CACHE_TTL_MS = 10 * 60_000;
const SESSION_PREFIX = "granola-ui:query:";

type CacheEntry = {
  data?: unknown;
  expiresAt: number;
  promise?: Promise<unknown>;
};

const cache = new Map<string, CacheEntry>();

function readEntry(url: string) {
  const memoryEntry = cache.get(url);
  if (memoryEntry) return memoryEntry;
  if (typeof window === "undefined") return undefined;

  try {
    const stored = window.sessionStorage.getItem(`${SESSION_PREFIX}${url}`);
    if (!stored) return undefined;
    const entry = JSON.parse(stored) as CacheEntry;
    if (entry.data === undefined) return undefined;
    cache.set(url, entry);
    return entry;
  } catch {
    return undefined;
  }
}

function persistEntry(url: string, entry: CacheEntry) {
  if (typeof window === "undefined" || entry.data === undefined) return;
  try {
    window.sessionStorage.setItem(
      `${SESSION_PREFIX}${url}`,
      JSON.stringify({ data: entry.data, expiresAt: entry.expiresAt }),
    );
  } catch {
    // Keep the in-memory cache when session storage is unavailable or full.
  }
}

export function getCachedJson<T>(url: string): T | undefined {
  return readEntry(url)?.data as T | undefined;
}

export function fetchJsonCached<T>(url: string): Promise<T> {
  const existing = readEntry(url);
  if (existing?.data !== undefined && existing.expiresAt > Date.now()) {
    return Promise.resolve(existing.data as T);
  }
  if (existing?.promise) return existing.promise as Promise<T>;

  const promise = fetch(url)
    .then(async (response) => {
      const data = (await response.json()) as T & { message?: string };
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
      const entry = { data, expiresAt: Date.now() + CACHE_TTL_MS };
      cache.set(url, entry);
      persistEntry(url, entry);
      return data;
    })
    .catch((error) => {
      if (existing?.data !== undefined) {
        cache.set(url, { ...existing, promise: undefined });
      } else {
        cache.delete(url);
      }
      throw error;
    });

  cache.set(url, {
    data: existing?.data,
    expiresAt: existing?.expiresAt ?? 0,
    promise,
  });
  if (existing?.data !== undefined) {
    void promise.catch(() => undefined);
    return Promise.resolve(existing.data as T);
  }
  return promise;
}

export function prefetchJson(url: string) {
  void fetchJsonCached(url).catch(() => undefined);
}

export function invalidateCachedJson(url: string) {
  cache.delete(url);
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(`${SESSION_PREFIX}${url}`);
  }
}
