"use client";

import { Check, Files as FilesIcon, IdentificationCard, ListChecks, Note as NoteIcon, Pulse, Users, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  ActivityCommentComposer,
  ActivityCommentRow,
} from "@/components/activity-comments";
import { Avatar } from "@/components/avatar";
import { FilterChip } from "@/components/chrome";
import { FeedRowsSkeleton } from "@/components/loading-state";
import { NoteGroups, NoteRow } from "@/components/note-row";
import { ProfileFiles } from "@/components/profile-files";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import {
  meId,
  type Note,
  type Person,
  type ProfileComment,
  type ProfileTask,
} from "@/lib/data";
import { useDataSource } from "@/lib/data-source";

export type ProfileTab = "profile" | "activity" | "notes" | "files" | "tasks" | "people";

export function NotesFeed({
  profile,
  notes,
  documents,
  upcoming = [],
  tasks = [],
  comments = [],
  people = [],
  peopleCircles = false,
  mineId = meId,
  loading = false,
  documentsLoading = false,
  tasksLoading = false,
  commentsLoading = false,
  commentsPosting = false,
  onSubmitComment,
  tab: tabProp,
  onTabChange,
}: {
  profile?: ReactNode;
  notes: Note[];
  documents?: Note[];
  upcoming?: Note[];
  tasks?: ProfileTask[];
  comments?: ProfileComment[];
  people?: Person[];
  peopleCircles?: boolean;
  mineId?: string;
  loading?: boolean;
  documentsLoading?: boolean;
  tasksLoading?: boolean;
  commentsLoading?: boolean;
  commentsPosting?: boolean;
  onSubmitComment?: (body: string) => Promise<void>;
  tab?: ProfileTab;
  onTabChange?: (tab: ProfileTab) => void;
}) {
  const [internalTab, setInternalTab] = useState<ProfileTab>(profile ? "profile" : "activity");
  const tab = tabProp ?? internalTab;
  const setTab = (next: ProfileTab) => {
    onTabChange?.(next);
    if (tabProp === undefined) setInternalTab(next);
  };
  const [scope, setScope] = useState<"all" | "me">("all");
  const [taskDecisions, setTaskDecisions] = useState<Record<string, "approve" | "reject">>({});
  const { source } = useDataSource();
  const showPeopleTab = people.length > 0;

  const taskItems = useMemo(
    () =>
      tasks
        .filter((task) => taskDecisions[task.id] !== "reject")
        .map((task) => (taskDecisions[task.id] === "approve" ? { ...task, suggested: false } : task)),
    [taskDecisions, tasks],
  );

  const visibleNotes = useMemo(() => {
    if (scope !== "me" || !mineId) return notes;
    return notes.filter((note) => note.personIds.includes(mineId));
  }, [mineId, notes, scope]);

  const allDocuments = documents ?? notes;
  const transcriptAndSummaryDocuments = useMemo(
    () =>
      allDocuments.filter(
        (note) => note.badge === "Transcript" || note.badge === "Meeting summary",
      ),
    [allDocuments],
  );
  const visibleDocuments = useMemo(() => {
    if (scope !== "me" || !mineId) return transcriptAndSummaryDocuments;
    return transcriptAndSummaryDocuments.filter(
      (note) => note.personIds.length === 0 || note.personIds.includes(mineId),
    );
  }, [mineId, scope, transcriptAndSummaryDocuments]);

  const visibleUpcoming = useMemo(() => {
    if (scope !== "me" || !mineId) return upcoming;
    return upcoming.filter((note) => note.personIds.includes(mineId));
  }, [mineId, scope, upcoming]);
  const pastItems = useMemo(
    () =>
      [
        ...visibleNotes.map((note) => ({ type: "note" as const, item: note })),
        ...comments.map((comment) => ({ type: "comment" as const, item: comment })),
      ].sort((a, b) => {
        const aTime = new Date(a.item.occurredAt || ("date" in a.item ? a.item.date : "")).getTime();
        const bTime = new Date(b.item.occurredAt || ("date" in b.item ? b.item.date : "")).getTime();
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
      }),
    [comments, visibleNotes],
  );

  return (
    <div className="pb-6">
      <div className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {profile ? (
              <FilterChip active={tab === "profile"} quiet onClick={() => setTab("profile")}>
                <IdentificationCard className="h-3.5 w-3.5" />
                Profile
              </FilterChip>
            ) : null}
            <FilterChip active={tab === "activity"} quiet onClick={() => setTab("activity")}>
              <Pulse className="h-3.5 w-3.5" />
              Activity
            </FilterChip>
            <FilterChip active={tab === "notes"} quiet onClick={() => setTab("notes")}>
              <NoteIcon className="h-3.5 w-3.5" />
              Notes
            </FilterChip>
            <FilterChip active={tab === "files"} quiet onClick={() => setTab("files")}>
              <FilesIcon className="h-3.5 w-3.5" />
              Files
            </FilterChip>
            <FilterChip active={tab === "tasks"} quiet onClick={() => setTab("tasks")}>
              <ListChecks className="h-3.5 w-3.5" />
              Tasks
            </FilterChip>
            {showPeopleTab ? (
              <FilterChip active={tab === "people"} quiet onClick={() => setTab("people")}>
                <Users className="h-3.5 w-3.5" />
                People
              </FilterChip>
            ) : null}
          </div>
          {tab === "profile" || tab === "people" || tab === "files" ? null : (
            <div className="flex shrink-0 items-center gap-1">
              <FilterChip active={scope === "all"} quiet onClick={() => setScope("all")}>
                All
              </FilterChip>
              <FilterChip active={scope === "me"} quiet onClick={() => setScope("me")}>
                Me
              </FilterChip>
            </div>
          )}
        </div>
      </div>

      {tab === "profile" ? profile : null}

      {tab === "activity" ? (
        <>
          {visibleUpcoming.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-1 text-[13px] text-muted-foreground">Upcoming</h2>
              <div className="flex flex-col">
                {visibleUpcoming.map((note, index) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    peopleCircles={false}
                    connectToNext={index < visibleUpcoming.length - 1}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {onSubmitComment ? (
            <>
              {visibleUpcoming.length > 0 ? (
                <div className="mt-5 border-t border-border/70" />
              ) : null}
              <ActivityCommentComposer posting={commentsPosting} onSubmit={onSubmitComment} />
            </>
          ) : null}
          {(loading || commentsLoading) && pastItems.length === 0 ? (
            <FeedRowsSkeleton />
          ) : pastItems.length > 0 ? (
            <section className="mt-2">
              <div className="flex flex-col">
                {pastItems.map((entry, index) =>
                  entry.type === "comment" ? (
                    <ActivityCommentRow
                      key={`comment-${entry.item.id}`}
                      comment={entry.item}
                      connectToNext={index < pastItems.length - 1}
                    />
                  ) : (
                    <NoteRow
                      key={`note-${entry.item.id}`}
                      note={entry.item}
                      peopleCircles={peopleCircles}
                      connectToNext={index < pastItems.length - 1}
                    />
                  ),
                )}
              </div>
            </section>
          ) : visibleUpcoming.length === 0 ? (
            <div className="py-10 text-[13px] text-muted-foreground">No activity yet.</div>
          ) : null}
        </>
      ) : null}

      {tab === "notes" ? (
        documentsLoading && visibleDocuments.length === 0 ? (
          <FeedRowsSkeleton />
        ) : visibleDocuments.length === 0 ? (
          <div className="py-10 text-[13px] text-muted-foreground">No docs yet.</div>
        ) : (
          <NoteGroups notes={visibleDocuments} peopleCircles={peopleCircles} showSectionTitles={false} />
        )
      ) : null}

      {tab === "files" ? <ProfileFiles /> : null}

      {tab === "tasks" ? (
        tasksLoading && taskItems.length === 0 ? (
          <FeedRowsSkeleton rows={3} />
        ) : taskItems.length === 0 ? (
          <div className="py-10 text-[13px] text-muted-foreground">No tasks yet.</div>
        ) : (
          <>
            <TaskSection
              title="Suggested"
              tasks={taskItems.filter((task) => task.suggested)}
              suggested
              live={source === "micro"}
              onDecide={(id, decision) => {
                setTaskDecisions((current) => ({ ...current, [id]: decision }));
              }}
              onRestore={(task) => {
                setTaskDecisions((current) => {
                  const next = { ...current };
                  delete next[task.id];
                  return next;
                });
              }}
            />
            <TaskSection title="Active" tasks={taskItems.filter((task) => !task.suggested)} />
          </>
        )
      ) : null}

      {tab === "people" ? (
        people.length === 0 ? (
          <div className="py-10 text-[13px] text-muted-foreground">No people yet.</div>
        ) : (
          <div className="mt-6 flex flex-col">
            {people.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-hover"
              >
                <Avatar name={person.name} color={person.avatarColor} photoUrl={person.photoUrl} size={28} />
                <div className="min-w-0">
                  <div className="flex min-w-0 items-center gap-1">
                    <span className="truncate text-[14px] text-foreground">{person.name}</span>
                    {isVerifiedEntity(person.id, person.name) ? (
                      <VerifiedBadge entityId={person.id} />
                    ) : null}
                  </div>
                  <div className="truncate text-[12.5px] text-muted-foreground">
                    {person.title || person.email || "—"}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}

const TASKS_VISIBLE = 5;

function TaskSection({
  title,
  tasks,
  suggested = false,
  live = false,
  onDecide,
  onRestore,
}: {
  title: string;
  tasks: ProfileTask[];
  suggested?: boolean;
  live?: boolean;
  onDecide?: (id: string, decision: "approve" | "reject") => void;
  onRestore?: (task: ProfileTask) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  if (tasks.length === 0) return null;

  const visible = expanded ? tasks : tasks.slice(0, TASKS_VISIBLE);
  const canToggle = tasks.length > TASKS_VISIBLE;

  async function decide(task: ProfileTask, decision: "approve" | "reject") {
    if (pendingId) return;
    onDecide?.(task.id, decision);
    if (!live) return;
    setPendingId(task.id);
    try {
      const response = await fetch("/api/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: task.id, decision }),
      });
      if (!response.ok) throw new Error("Could not update task.");
    } catch {
      onRestore?.(task);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-[13px] text-muted-foreground">{title}</h2>
      <div className="flex flex-col">
        {visible.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 rounded-lg px-1 py-2 text-[14px] leading-5 text-foreground hover:bg-hover"
          >
            <span
              className={`h-4 w-4 shrink-0 rounded-full ${
                suggested
                  ? "border border-dashed border-muted-foreground/75"
                  : "border border-muted-foreground/80"
              }`}
            />
            <span className="min-w-0 flex-1">{task.title}</span>
            {suggested ? (
              <div className="flex h-6 shrink-0 items-center gap-1.5 rounded-full border border-border px-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                <span className="text-[12.5px] text-muted-foreground">Add</span>
                <button
                  type="button"
                  aria-label="Approve suggestion"
                  disabled={pendingId === task.id}
                  onClick={() => decide(task, "approve")}
                  className="flex h-4 w-4 items-center justify-center text-[#b6cf3a] hover:text-[#c7df4a] disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" weight="bold" />
                </button>
                <button
                  type="button"
                  aria-label="Reject suggestion"
                  disabled={pendingId === task.id}
                  onClick={() => decide(task, "reject")}
                  className="flex h-4 w-4 items-center justify-center text-placeholder hover:text-muted-foreground disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 rounded-full px-1 py-1.5 text-[13px] text-placeholder hover:text-muted-foreground"
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </section>
  );
}
