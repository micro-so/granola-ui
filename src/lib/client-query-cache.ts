"use client";

const CACHE_TTL_MS = 10 * 60_000;

type CacheEntry = {
  data?: unknown;
  expiresAt: number;
  promise?: Promise<unknown>;
};

const cache = new Map<string, CacheEntry>();

export function getCachedJson<T>(url: string): T | undefined {
  return cache.get(url)?.data as T | undefined;
}

export function fetchJsonCached<T>(url: string): Promise<T> {
  const existing = cache.get(url);
  if (existing?.data !== undefined && existing.expiresAt > Date.now()) {
    return Promise.resolve(existing.data as T);
  }
  if (existing?.promise) return existing.promise as Promise<T>;

  const promise = fetch(url)
    .then(async (response) => {
      const data = (await response.json()) as T & { message?: string };
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status}).`);
      cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
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
}
