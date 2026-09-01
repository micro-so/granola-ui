"use client";

import { useMemo, useState } from "react";
import { DirectoryPage } from "@/components/directory-page";
import { people } from "@/lib/data";

export function PeopleDirectory() {
  const [filter, setFilter] = useState<"everyone" | "met">("everyone");

  const rows = useMemo(
    () =>
      people
        .filter((person) => !(filter === "met" && person.isMe))
        .map((person) => ({
          id: person.id,
          href: `/people/${person.id}`,
          name: person.name,
          subtitle: person.email,
          lastNoteLabel: person.lastNoteLabel,
          noteCount: person.noteCount,
          color: person.avatarColor,
          photoUrl: person.photoUrl,
          nameExtra: person.isMe ? " (me)" : undefined,
          searchText: person.title,
        })),
    [filter],
  );

  return (
    <DirectoryPage
      title="People"
      entityLabel="Person"
      searchPlaceholder="Search people"
      empty="No people match that search."
      filters={[
        { id: "everyone", label: "Everyone", active: filter === "everyone", onClick: () => setFilter("everyone") },
        { id: "met", label: "People I met", active: filter === "met", onClick: () => setFilter("met") },
      ]}
      rows={rows}
    />
  );
}
