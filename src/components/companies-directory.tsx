"use client";

import { useMemo, useState } from "react";
import { DirectoryPage } from "@/components/directory-page";
import { companies, notes } from "@/lib/data";

const metCompanyIds = new Set(notes.map((note) => note.companyId));

export function CompaniesDirectory() {
  const [filter, setFilter] = useState<"all" | "met">("all");

  const rows = useMemo(
    () =>
      companies
        .filter((company) => !(filter === "met" && !metCompanyIds.has(company.id)))
        .map((company) => ({
          id: company.id,
          href: `/companies/${company.id}`,
          name: company.name,
          subtitle: company.domain,
          lastNoteLabel: company.lastNoteLabel,
          noteCount: company.noteCount,
          color: company.logoColor,
          photoUrl: company.logoUrl,
          rounded: "md" as const,
        })),
    [filter],
  );

  return (
    <DirectoryPage
      title="Companies"
      entityLabel="Company"
      searchPlaceholder="Search companies"
      empty="No companies match that search."
      filters={[
        { id: "all", label: "All companies", active: filter === "all", onClick: () => setFilter("all") },
        { id: "met", label: "I've met", active: filter === "met", onClick: () => setFilter("met") },
      ]}
      rows={rows}
    />
  );
}
