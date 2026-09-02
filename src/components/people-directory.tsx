"use client";

import { useMemo, useState } from "react";
import { DirectoryPage } from "@/components/directory-page";
import { formatShortDate, isMicroViewId } from "@/lib/data";
import { usePeople, usePeopleViews } from "@/lib/use-people";
import { useStoredString } from "@/lib/use-stored-string";

const VIEW_STORAGE_KEY = "granola-ui:people-view";

export function PeopleDirectory() {
  const [search, setSearch] = useState("");
  const [viewId, setViewId] = useStoredString(VIEW_STORAGE_KEY);
  const { items: views, source } = usePeopleViews();
  const selectedViewId = views.some((view) => view.id === viewId) ? viewId : (views[0]?.id ?? "");
  // Don't send placeholder chip ids ("all") to Micro — only real view UUIDs.
  const microViewId = source === "micro" && isMicroViewId(selectedViewId) ? selectedViewId : source === "placeholder" ? selectedViewId : "";
  const { items, status, message, hasMore, loadingMore, loadMore } = usePeople({
    search,
    viewId: microViewId,
    enabled: source === "placeholder" || source === "micro" || Boolean(search),
  });

  const rows = useMemo(
    () =>
      items
        .filter((person) => !(source === "placeholder" && selectedViewId === "met" && person.isMe))
        .map((person) => ({
          id: person.id,
          href: `/people/${person.id}`,
          name: person.name,
          subtitle: person.email,
          extraEmailCount: person.extraEmailCount,
          lastNoteLabel: person.lastNoteLabel,
          lastMeetingLabel: person.lastMeeting ? formatShortDate(person.lastMeeting) : person.lastNoteLabel,
          summary: person.summary,
          lastInteractionLabel: person.lastInteraction ? formatShortDate(person.lastInteraction) : "—",
          relationshipStrength: person.relationshipStrength,
          noteCount: person.noteCount,
          color: person.avatarColor,
          photoUrl: person.photoUrl,
          nameExtra: person.isMe ? " (me)" : undefined,
          searchText: person.title,
        })),
    [items, selectedViewId, source],
  );

  return (
    <DirectoryPage
      title="People"
      entityLabel="Person"
      searchPlaceholder="Search people"
      empty="No people in this view."
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
      hasMore={hasMore}
      loadingMore={loadingMore}
      onLoadMore={loadMore}
      rows={rows}
    />
  );
}
