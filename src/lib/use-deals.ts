"use client";

import type { MicroListRecord } from "@/lib/micro-lists";
import { useMicroList } from "@/lib/use-micro-list";

export function useDeals(options: {
  personId?: string;
  companyId?: string;
  enabled?: boolean;
}) {
  return useMicroList<MicroListRecord>({
    path: "/api/deals",
    params: {
      personId: options.personId,
      companyId: options.companyId,
      v: "2",
    },
    placeholder: [],
    enabled: options.enabled,
  });
}
