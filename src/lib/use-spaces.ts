"use client";

import { useEffect, useState } from "react";
import { fetchJsonCached } from "@/lib/client-query-cache";
import type { Note } from "@/lib/data";
import { useDataSource } from "@/lib/data-source";
import type { GranolaFolder, GranolaSpaceContext } from "@/lib/granola";
import { useMicroList } from "@/lib/use-micro-list";

const placeholderSpaces: GranolaFolder[] = [
  { id: "1-1s", name: "1-1s", parentFolderId: null },
  { id: "growth", name: "Growth", parentFolderId: null },
  { id: "investing", name: "Investing", parentFolderId: null },
  { id: "recruiting", name: "Recruiting", parentFolderId: null },
];

export function useSpaces() {
  return useMicroList<GranolaFolder>({
    path: "/api/spaces",
    placeholder: placeholderSpaces,
  });
}

export function useSpaceNotes(folderId: string, enabled = true) {
  return useMicroList<Note>({
    path: "/api/spaces",
    params: { folderId },
    placeholder: [],
    enabled: Boolean(folderId) && enabled,
  });
}

export function useSpaceContext(folderId: string, enabled = true) {
  const { source } = useDataSource();
  const [result, setResult] = useState<{
    key: string;
    context: GranolaSpaceContext;
    message: string | null;
  }>({
    key: "",
    context: { people: [], companies: [] },
    message: null,
  });
  const url = `/api/spaces?folderId=${encodeURIComponent(folderId)}&view=context`;

  useEffect(() => {
    if (source === "placeholder" || !enabled || !folderId) return;
    let cancelled = false;
    fetchJsonCached<GranolaSpaceContext & { message?: string | null }>(url)
      .then((data) => {
        if (cancelled) return;
        setResult({
          key: folderId,
          context: {
            people: data.people ?? [],
            companies: data.companies ?? [],
          },
          message: data.message ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          key: folderId,
          context: { people: [], companies: [] },
          message: error instanceof Error ? error.message : "Could not load folder context.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, folderId, source, url]);

  if (source === "placeholder") {
    return {
      ...result.context,
      status: "ready" as const,
      message: null,
    };
  }
  if (!enabled || result.key !== folderId) {
    return {
      people: [],
      companies: [],
      status: "loading" as const,
      message: null,
    };
  }
  return {
    ...result.context,
    status: "ready" as const,
    message: result.message,
  };
}
