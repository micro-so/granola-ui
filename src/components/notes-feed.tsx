"use client";

import { CircleUser, NotepadText } from "lucide-react";
import { useState } from "react";
import { FilterChip } from "@/components/chrome";
import { NoteGroups } from "@/components/note-row";
import { meId, type Note } from "@/lib/data";

export function NotesFeed({ notes, peopleCircles = false }: { notes: Note[]; peopleCircles?: boolean }) {
  const [tab, setTab] = useState<"all" | "mine">("all");
  const mineId = meId;
  const visible =
    tab === "mine" && mineId ? notes.filter((note) => note.personIds.includes(mineId)) : notes;

  return (
    <div className="min-h-0 flex-1 overflow-auto pb-10 scrollbar-thin">
      <div className="mt-8 border-t border-border pt-8">
        <div className="flex items-center gap-2">
          <FilterChip active={tab === "all"} quiet onClick={() => setTab("all")}>
            <NotepadText className="h-3.5 w-3.5" strokeWidth={1.75} />
            All notes
          </FilterChip>
          <FilterChip active={tab === "mine"} quiet onClick={() => setTab("mine")}>
            <CircleUser className="h-3.5 w-3.5" strokeWidth={1.75} />
            My notes
          </FilterChip>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="py-10 text-[13px] text-muted-foreground">No notes yet.</div>
      ) : (
        <NoteGroups notes={visible} peopleCircles={peopleCircles} />
      )}
    </div>
  );
}
