"use client";

import {
  Buildings,
  CaretDown,
  DotsThree,
  File,
  Files as FilesIcon,
  FolderSimple,
  Handshake,
  LinkSimple,
  ListChecks,
  LockSimple,
  Note as NoteIcon,
  PencilSimple,
  Pulse,
  ShareNetwork,
  Star,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityCommentComposer,
  ActivityCommentRow,
} from "@/components/activity-comments";
import { Avatar } from "@/components/avatar";
import { FilterChip } from "@/components/chrome";
import { FolderEditorDialog } from "@/components/folder-editor-dialog";
import { FeedRowsSkeleton } from "@/components/loading-state";
import { NoteGroups, NoteRow } from "@/components/note-row";
import { ProfileFiles } from "@/components/profile-files";
import { ProfileFrame, ProfileHeader } from "@/components/profile-frame";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import { colorFromId, type ProfileComment } from "@/lib/data";
import {
  useFolderProperties,
  type FolderProperties,
} from "@/lib/use-folder-properties";
import { usePinnedProfiles } from "@/lib/use-pinned-profiles";
import { useSpaceContext, useSpaceNotes, useSpaces } from "@/lib/use-spaces";
import { useUpcoming } from "@/lib/use-upcoming";

export type FolderTab = "activity" | "people" | "companies" | "notes" | "files" | "tasks" | "deals";

export function SpacePage({ spaceId }: { spaceId: string }) {
  const [tab, setTab] = useState<FolderTab>("activity");
  const [comments, setComments] = useState<ProfileComment[]>([]);
  const { items: spaces, status: spacesStatus } = useSpaces();
  const {
    items: notes,
    status: notesStatus,
    message,
  } = useSpaceNotes(spaceId, tab === "activity" || tab === "notes");
  const {
    people,
    companies,
    status: contextStatus,
    message: contextMessage,
  } = useSpaceContext(
    spaceId,
    tab === "activity" || tab === "people" || tab === "companies",
  );
  const { items: allUpcoming } = useUpcoming();
  const upcoming = useMemo(() => {
    const names = new Set(people.map((person) => person.name.trim().toLowerCase()));
    if (names.size === 0) return [];
    return allUpcoming
      .filter((event) =>
        (event.peopleNames ?? []).some((name) => names.has(name.trim().toLowerCase())),
      )
      .map((event) => ({
        id: event.id,
        title: event.title,
        date: event.date,
        dateLabel: "Upcoming",
        time: event.start,
        occurredAt: event.startsAt,
        personIds: event.personIds ?? [],
        companyId: "",
        preview: "",
        kind: "meet" as const,
        leadName: event.peopleNames?.[0],
        otherNames: event.peopleNames ?? [],
      }));
  }, [allUpcoming, people]);
  const sourceTitle =
    spaceId === "my-notes"
      ? "My space"
      : spaces.find((space) => space.id === spaceId)?.name || "Space";
  const { properties: folderProperties, saveProperties } = useFolderProperties(
    `space:${spaceId}`,
    {
      name: sourceTitle,
      description: "Granola space",
      parentFolder: spaceId === "my-notes" ? "" : "My space",
      subfolders: spaces
        .filter((space) => space.parentFolderId === spaceId)
        .map((space) => space.name),
      sharing: "private",
      folderType: "manual",
      includeConnectedObjects: true,
    },
  );
  const title = folderProperties.name;
  const parentOptions = [
    "My space",
    ...spaces
      .filter((space) => space.id !== spaceId)
      .map((space) => space.name),
  ];

  return (
    <ProfileFrame backHref="/" backLabel="Back to home">
      <ProfileHeader
        name={spacesStatus === "loading" && sourceTitle === "Space" ? "Loading…" : title}
        actions={
          <div className="ml-auto">
            <FolderAddMenu onSelect={setTab} />
          </div>
        }
        avatar={
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
            {spaceId === "my-notes" ? (
              <LockSimple className="h-5 w-5" weight="fill" />
            ) : (
              <FolderSimple className="h-5 w-5" weight="fill" />
            )}
          </span>
        }
      >
        <span>{folderProperties.description || "Granola space"}</span>
      </ProfileHeader>
      <FolderActions
        folderId={spaceId}
        name={title}
        editorProperties={folderProperties}
        parentOptions={parentOptions}
        onSaveProperties={saveProperties}
      />

      <div className="mt-8 flex items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-thin">
          <FolderTabChip tab="activity" active={tab} onChange={setTab} icon={<Pulse />}>
            Activity
          </FolderTabChip>
          <FolderTabChip tab="people" active={tab} onChange={setTab} icon={<Users />}>
            People
          </FolderTabChip>
          <FolderTabChip tab="companies" active={tab} onChange={setTab} icon={<Buildings />}>
            Companies
          </FolderTabChip>
          <FolderTabChip tab="notes" active={tab} onChange={setTab} icon={<NoteIcon />}>
            Notes
          </FolderTabChip>
          <FolderTabChip tab="tasks" active={tab} onChange={setTab} icon={<ListChecks />}>
            Tasks
          </FolderTabChip>
        </div>
        <FolderMoreMenu active={tab} onSelect={setTab} />
      </div>

      {message || contextMessage ? (
        <div className="mt-3 text-[12px] text-muted-foreground">{message || contextMessage}</div>
      ) : null}

      {tab === "activity" ? (
        <>
          {upcoming.length > 0 ? (
            <section className="mt-6">
              <h2 className="mb-1 text-[13px] text-muted-foreground">Upcoming</h2>
              <div className="flex flex-col">
                {upcoming.map((note, index) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    connectToNext={index < upcoming.length - 1}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {upcoming.length > 0 ? <div className="mt-5 border-t border-border/70" /> : null}
          <ActivityCommentComposer
            posting={false}
            onSubmit={async (body) => {
              setComments((current) => [
                {
                  id: crypto.randomUUID(),
                  body,
                  author: "Brett Goldstein",
                  authorColor: colorFromId("Brett Goldstein"),
                  occurredAt: new Date().toISOString(),
                },
                ...current,
              ]);
            }}
          />
          {comments.length > 0 ? (
            <div className="mt-2 flex flex-col">
              {comments.map((comment, index) => (
                <ActivityCommentRow
                  key={comment.id}
                  comment={comment}
                  connectToNext={index < comments.length - 1 || notes.length > 0}
                />
              ))}
            </div>
          ) : null}
          {notesStatus === "loading" && notes.length === 0 ? (
            <FeedRowsSkeleton rows={6} />
          ) : notes.length === 0 && comments.length === 0 ? (
            <EmptyTab>No activity in this folder yet.</EmptyTab>
          ) : notes.length > 0 ? (
            <NoteGroups
              notes={notes}
              sectionClassName={comments.length > 0 ? "" : "mt-6"}
              showSectionTitles={false}
              connectIcons
            />
          ) : null}
        </>
      ) : null}

      {tab === "people" ? (
        contextStatus === "loading" && people.length === 0 ? (
          <FeedRowsSkeleton rows={5} />
        ) : people.length === 0 ? (
          <EmptyTab>No people in this folder yet.</EmptyTab>
        ) : (
          <div className="mt-6 flex flex-col">
            {people.map((person) => {
              const content = (
                <>
                  <Avatar
                    name={person.name}
                    color={person.color || colorFromId(person.id)}
                    photoUrl={person.photoUrl}
                    size={28}
                  />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="truncate text-[14px] font-medium text-foreground">
                        {person.name}
                      </div>
                      {isVerifiedEntity(person.id, person.name) ? (
                        <VerifiedBadge entityId={person.id} />
                      ) : null}
                    </div>
                    <div className="truncate text-[12.5px] text-muted-foreground">{person.email}</div>
                  </div>
                </>
              );
              const className = "flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-hover";
              return person.href ? (
                <Link key={person.id} href={person.href} className={className}>
                  {content}
                </Link>
              ) : (
                <div key={person.id} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "companies" ? (
        contextStatus === "loading" && companies.length === 0 ? (
          <FeedRowsSkeleton rows={5} />
        ) : companies.length === 0 ? (
          <EmptyTab>No companies in this folder yet.</EmptyTab>
        ) : (
          <div className="mt-6 flex flex-col">
            {companies.map((company) => {
              const content = (
                <>
                  <Avatar
                    name={company.name}
                    color={company.color || colorFromId(company.id)}
                    photoUrl={company.photoUrl}
                    rounded="md"
                    size={28}
                  />
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <div className="truncate text-[14px] font-medium text-foreground">
                        {company.name}
                      </div>
                      {isVerifiedEntity(company.id, company.name) ? (
                        <VerifiedBadge entityId={company.id} />
                      ) : null}
                    </div>
                    <div className="truncate text-[12.5px] text-muted-foreground">{company.domain}</div>
                  </div>
                </>
              );
              const className = "flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-hover";
              return company.href ? (
                <Link key={company.id} href={company.href} className={className}>
                  {content}
                </Link>
              ) : (
                <div key={company.id} className={className}>
                  {content}
                </div>
              );
            })}
          </div>
        )
      ) : null}

      {tab === "notes" ? (
        notesStatus === "loading" && notes.length === 0 ? (
          <FeedRowsSkeleton rows={6} />
        ) : notes.length === 0 ? (
          <EmptyTab>No notes in this folder yet.</EmptyTab>
        ) : (
          <NoteGroups
            notes={notes}
            sectionClassName="mt-6"
            showSectionTitles={false}
            hideMeetingNotesBadge
          />
        )
      ) : null}

      {tab === "files" ? <ProfileFiles /> : null}

      {tab === "tasks" ? (
        <FolderObjectEmptyState
          icon={<ListChecks />}
          title="No tasks in this folder yet"
          description="Add tasks to keep follow-ups and next steps in one place."
        />
      ) : null}

      {tab === "deals" ? (
        <FolderObjectEmptyState
          icon={<Handshake />}
          title="No deals in this folder yet"
          description="Add deals to track opportunities connected to this folder."
        />
      ) : null}
    </ProfileFrame>
  );
}

export function FolderActions({
  folderId,
  name,
  href = `/spaces/${folderId}`,
  favoriteId = `folder:${folderId}`,
  itemLabel = "folder",
  editorProperties,
  parentOptions = [],
  teamScoped = false,
  onSaveProperties,
}: {
  folderId: string;
  name: string;
  href?: string;
  favoriteId?: string;
  itemLabel?: "folder" | "list";
  editorProperties?: FolderProperties;
  parentOptions?: string[];
  teamScoped?: boolean;
  onSaveProperties?: (properties: FolderProperties) => void;
}) {
  const { isPinned, pinProfile, unpinProfile } = usePinnedProfiles();
  const favorite = isPinned(href);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  function toggleFavorite() {
    if (favorite) {
      unpinProfile(href);
      return;
    }
    pinProfile({
      id: favoriteId,
      name,
      href,
      kind: "folder",
    });
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setOpen(false);
    window.setTimeout(() => setCopied(false), 1_500);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: name, url });
      } else {
        await copyLink();
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
    }
    setOpen(false);
  }

  return (
    <>
      <div ref={ref} className="fixed right-4 top-4 z-30 flex items-center gap-1">
        <button
          type="button"
          aria-label={`More ${itemLabel} actions`}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
        >
          <DotsThree className="h-5 w-5" weight="bold" />
        </button>
        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={toggleFavorite}
          className={`flex h-9 w-9 items-center justify-center rounded-full hover:bg-hover ${
            favorite ? "text-[#b6cf3a]" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-5 w-5" weight={favorite ? "fill" : "regular"} />
        </button>
        <div className="flex gap-[2px]">
          <button
            type="button"
            onClick={() => void share()}
            className="flex h-9 items-center rounded-l-full rounded-r-[6px] bg-foreground px-4 text-[14px] font-medium text-background hover:opacity-90"
          >
            Share
          </button>
          <button
            type="button"
            aria-label={`Copy ${itemLabel} link`}
            title={`Copy ${itemLabel} link`}
            onClick={() => void copyLink()}
            className="flex h-9 w-9 items-center justify-center rounded-l-[6px] rounded-r-full bg-foreground text-background hover:opacity-90"
          >
            <LinkSimple className="h-[18px] w-[18px]" />
          </button>
        </div>

        {open ? (
          <div className="absolute right-0 top-full mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
            {editorProperties && onSaveProperties ? (
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setEditing(true);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-hover"
              >
                <PencilSimple className="h-4 w-4" />
                Edit folder
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void copyLink()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-hover"
            >
              <LinkSimple className="h-4 w-4" />
              Copy link
            </button>
            <button
              type="button"
              onClick={() => void share()}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-hover"
            >
              <ShareNetwork className="h-4 w-4" />
              Share {itemLabel}
            </button>
          </div>
        ) : null}
      </div>
      {copied ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground shadow-xl"
        >
          {itemLabel === "list" ? "List link copied" : "Folder link copied"}
        </div>
      ) : null}
      {editing && editorProperties && onSaveProperties ? (
        <FolderEditorDialog
          properties={editorProperties}
          parentOptions={parentOptions}
          teamScoped={teamScoped}
          onSave={onSaveProperties}
          onClose={() => setEditing(false)}
        />
      ) : null}
    </>
  );
}

export function FolderAddMenu({ onSelect }: { onSelect: (tab: FolderTab) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const options: Array<{
    tab: Exclude<FolderTab, "activity">;
    label: string;
    icon: React.ReactNode;
  }> = [
    { tab: "people", label: "Person", icon: <Users /> },
    { tab: "companies", label: "Company", icon: <Buildings /> },
    { tab: "notes", label: "Note", icon: <NoteIcon /> },
    { tab: "files", label: "File", icon: <File /> },
    { tab: "tasks", label: "Task", icon: <ListChecks /> },
    { tab: "deals", label: "Deal", icon: <Handshake /> },
  ];

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 items-center gap-1.5 rounded-full bg-[#b6cf3a] px-3.5 text-[13px] font-medium text-[#151515] hover:bg-[#c7df4a]"
      >
        Add
        <CaretDown className="h-3 w-3" weight="bold" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-44 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-2xl"
        >
          {options.map((option) => (
            <button
              key={option.tab}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(option.tab);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-foreground hover:bg-hover"
            >
              <span className="text-muted-foreground [&>svg]:h-4 [&>svg]:w-4">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FolderMoreMenu({
  active,
  onSelect,
}: {
  active: FolderTab;
  onSelect: (tab: FolderTab) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const moreActive = active === "files" || active === "deals";

  useEffect(() => {
    if (!open) return;
    function close(event: PointerEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const options = [
    { tab: "files" as const, label: "Files", icon: <FilesIcon /> },
    { tab: "deals" as const, label: "Deals", icon: <Handshake /> },
  ];

  return (
    <div ref={ref} className="relative shrink-0">
      <FilterChip active={moreActive} quiet onClick={() => setOpen((current) => !current)}>
        <DotsThree className="h-3.5 w-3.5" weight="bold" />
        More
      </FilterChip>
      {open ? (
        <div
          role="menu"
          className="absolute left-0 top-full z-30 mt-2 w-36 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-2xl"
        >
          {options.map((option) => (
            <button
              key={option.tab}
              type="button"
              role="menuitem"
              onClick={() => {
                onSelect(option.tab);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] ${
                active === option.tab
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-hover hover:text-foreground"
              }`}
            >
              <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function FolderTabChip({
  tab,
  active,
  onChange,
  icon,
  children,
}: {
  tab: FolderTab;
  active: FolderTab;
  onChange: (tab: FolderTab) => void;
  icon: React.ReactElement<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <FilterChip active={active === tab} quiet onClick={() => onChange(tab)}>
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {children}
    </FilterChip>
  );
}

function EmptyTab({ children }: { children: React.ReactNode }) {
  return <div className="py-10 text-[13px] text-muted-foreground">{children}</div>;
}

export function FolderObjectEmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className="mt-6 flex min-h-[26rem] items-center justify-center rounded-xl border border-dashed border-foreground/20 bg-surface/20 px-6 py-12 text-center">
      <div className="flex max-w-md flex-col items-center">
        <span className="mb-8 text-placeholder [&>svg]:h-16 [&>svg]:w-16 [&>svg]:stroke-[1]">
          {icon}
        </span>
        <h2 className="text-[15px] font-medium text-muted-foreground">{title}</h2>
        <p className="mt-1 text-[13px] text-placeholder">{description}</p>
      </div>
    </section>
  );
}
