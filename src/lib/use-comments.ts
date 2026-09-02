"use client";

import { useEffect, useState } from "react";
import {
  fetchJsonCached,
  invalidateCachedJson,
} from "@/lib/client-query-cache";
import type { ProfileComment } from "@/lib/data";
import { useDataSource } from "@/lib/data-source";

type CommentsPayload = {
  items?: ProfileComment[];
  message?: string | null;
};

export function useComments(options: {
  personId?: string;
  companyId?: string;
  enabled?: boolean;
}) {
  const { source } = useDataSource();
  const enabled = options.enabled ?? true;
  const query = new URLSearchParams();
  if (options.personId) query.set("personId", options.personId);
  if (options.companyId) query.set("companyId", options.companyId);
  const queryString = query.toString();
  const url = `/api/comments?${queryString}`;
  const [result, setResult] = useState<{
    key: string;
    items: ProfileComment[];
    message: string | null;
  }>({ key: "", items: [], message: null });
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (source === "placeholder" || !enabled || !queryString) return;
    let cancelled = false;

    fetchJsonCached<CommentsPayload>(url)
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: queryString,
          items: data.items ?? [],
          message: data.message ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          key: queryString,
          items: [],
          message: error instanceof Error ? error.message : "Could not load comments.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, queryString, source, url]);

  async function addComment(body: string) {
    if (!queryString || posting) return;
    setPosting(true);
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: options.personId,
          companyId: options.companyId,
          body,
        }),
      });
      const data = (await response.json()) as {
        item?: ProfileComment;
        message?: string;
      };
      if (!response.ok || !data.item) {
        throw new Error(data.message || "Could not post comment.");
      }
      invalidateCachedJson(url);
      setResult((current) => ({
        key: queryString,
        items: [data.item!, ...current.items.filter((item) => item.id !== data.item!.id)],
        message: null,
      }));
    } finally {
      setPosting(false);
    }
  }

  if (source === "placeholder") {
    return {
      items: [] as ProfileComment[],
      status: "ready" as const,
      posting: false,
      message: null,
      addComment,
    };
  }

  return {
    items: result.key === queryString ? result.items : [],
    status:
      !enabled || result.key !== queryString
        ? ("loading" as const)
        : ("ready" as const),
    posting,
    message: result.key === queryString ? result.message : null,
    addComment,
  };
}
