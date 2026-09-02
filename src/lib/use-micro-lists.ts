"use client";

import { useEffect, useState } from "react";
import { fetchJsonCached } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";
import type { MicroListDefinition, MicroListRecord } from "@/lib/micro-lists";
import { useMicroList } from "@/lib/use-micro-list";

export function useMicroLists() {
  return useMicroList<MicroListDefinition>({
    path: "/api/micro-lists",
    placeholder: [],
  });
}

export function useMicroListRecords(id: string) {
  const { source } = useDataSource();
  const [result, setResult] = useState<{
    id: string;
    list: MicroListDefinition | null;
    items: MicroListRecord[];
    message: string | null;
  }>({ id: "", list: null, items: [], message: null });
  const url = `/api/micro-lists?id=${encodeURIComponent(id)}`;

  useEffect(() => {
    if (source === "placeholder" || !id) return;
    let cancelled = false;
    fetchJsonCached<{
      list?: MicroListDefinition | null;
      items?: MicroListRecord[];
      message?: string | null;
    }>(url)
      .then((data) => {
        if (cancelled) return;
        setResult({
          id,
          list: data.list ?? null,
          items: data.items ?? [],
          message: data.message ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          id,
          list: null,
          items: [],
          message: error instanceof Error ? error.message : "Could not load CRM.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [id, source, url]);

  if (source === "placeholder") {
    return {
      list: null,
      items: [] as MicroListRecord[],
      status: "ready" as const,
      message: null,
    };
  }
  if (result.id !== id) {
    return {
      list: null,
      items: [] as MicroListRecord[],
      status: "loading" as const,
      message: null,
    };
  }
  return {
    list: result.list,
    items: result.items,
    status: "ready" as const,
    message: result.message,
  };
}
