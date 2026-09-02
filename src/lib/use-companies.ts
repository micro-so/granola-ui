"use client";

import { useEffect, useState } from "react";
import {
  companies as placeholderCompanies,
  companyById,
  placeholderCompanyViews,
  type Company,
  type CompanyView,
} from "@/lib/data";
import { fetchJsonCached } from "@/lib/client-query-cache";
import { useDataSource } from "@/lib/data-source";
import { useMicroList } from "@/lib/use-micro-list";

export function useCompanyViews() {
  return useMicroList<CompanyView>({
    path: "/api/companies/views",
    placeholder: placeholderCompanyViews,
  });
}

export function useCompanies(options: { search?: string; viewId?: string; enabled?: boolean } = {}) {
  return useMicroList<Company>({
    path: "/api/companies",
    params: { q: options.search, view: options.viewId },
    placeholder: placeholderCompanies,
    fallbackWhenEmpty: !options.viewId,
    enabled: options.enabled,
  });
}

export function useCompany(id: string) {
  const { source } = useDataSource();
  const [result, setResult] = useState<{
    id: string;
    company?: Company;
    message: string | null;
  }>({ id: "", message: null });

  useEffect(() => {
    if (!id || source === "placeholder") return;

    let cancelled = false;
    const url = `/api/companies?id=${encodeURIComponent(id)}`;
    fetchJsonCached<{ items?: Company[]; live?: boolean; message?: string | null }>(url)
      .then((data) => {
        if (cancelled) return;
        const next = data.items?.[0] ?? (data.live ? undefined : companyById(id));
        setResult({
          id,
          company: next,
          message: data.message ?? (next ? null : "Company not found."),
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setResult({
          id,
          company: companyById(id),
          message: error instanceof Error ? error.message : "Could not load company.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, source]);

  if (!id) return { source, company: undefined, status: "ready" as const, message: null };
  if (source === "placeholder") {
    return { source, company: companyById(id), status: "ready" as const, message: null };
  }
  if (result.id !== id) {
    return { source, company: undefined, status: "loading" as const, message: null };
  }
  return { source, company: result.company, status: "ready" as const, message: result.message };
}
