"use client";

import { useMemo, useState } from "react";
import { DirectoryPage } from "@/components/directory-page";
import { formatShortDate } from "@/lib/data";
import { useCompanies, useCompanyViews } from "@/lib/use-companies";
import { useStoredString } from "@/lib/use-stored-string";

const VIEW_STORAGE_KEY = "granola-ui:companies-view";

export function CompaniesDirectory() {
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useStoredString(VIEW_STORAGE_KEY);
  const { items: views, source } = useCompanyViews();
  const selectedViewId = views.some((view) => view.id === viewId) ? viewId : (views[0]?.id ?? "");
  const { items, status, message } = useCompanies({
    search,
    viewId: selectedViewId,
    enabled: source === "placeholder" || Boolean(selectedViewId),
  });

  const rows = useMemo(
    () =>
      items
        .filter((company) => !(source === "placeholder" && selectedViewId === "met" && company.lastNoteLabel === "—" && company.noteCount === 0))
        .map((company) => ({
          id: company.id,
          href: `/companies/${company.id}`,
          name: company.name,
          subtitle: company.domain,
          extraDomainCount: company.extraDomainCount,
          lastNoteLabel: company.lastNoteLabel,
          lastMeetingLabel: company.lastMeeting ? formatShortDate(company.lastMeeting) : company.lastNoteLabel,
          summary: company.summary,
          lastInteractionLabel: company.lastInteraction ? formatShortDate(company.lastInteraction) : "—",
          relationshipStrength: company.relationshipStrength,
          noteCount: company.noteCount,
          color: company.logoColor,
          photoUrl: company.logoUrl,
          rounded: "md" as const,
        })),
    [items, selectedViewId, source],
  );

  return (
    <DirectoryPage
      title="Companies"
      entityLabel="Company"
      searchPlaceholder="Search companies"
      empty="No companies in this view."
      message={message}
      loading={status === "loading"}
      serverSearch={source === "micro"}
      onQueryChange={setSearch}
      filters={views.map((view) => ({
        id: view.id,
        label: view.name,
        active: view.id === selectedViewId,
        onClick: () => setViewId(view.id),
      }))}
      layout="directory"
      metricLabel={source === "micro" ? "Strength" : "Notes"}
      rows={rows}
    />
  );
}
