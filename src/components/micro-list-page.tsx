"use client";

import {
  Buildings,
  Files as FilesIcon,
  Handshake,
  ListChecks,
  Note as NoteIcon,
  Pulse,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { FeedRowsSkeleton } from "@/components/loading-state";
import { ProfileFiles } from "@/components/profile-files";
import { ProfileFrame, ProfileHeader } from "@/components/profile-frame";
import {
  FolderActions,
  FolderAddMenu,
  FolderMoreMenu,
  FolderObjectEmptyState,
  FolderTabChip,
  type FolderTab,
} from "@/components/space-page";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import type { MicroListRecord, MicroListTab } from "@/lib/micro-lists";
import { useFolderProperties } from "@/lib/use-folder-properties";
import { useMicroListRecords, useMicroLists } from "@/lib/use-micro-lists";

const TAB_LABELS: Record<MicroListTab, string> = {
  people: "people",
  companies: "companies",
  notes: "notes",
  tasks: "tasks",
  deals: "deals",
};

export function MicroListPage({ listId }: { listId: string }) {
  const { list, items, status, message } = useMicroListRecords(listId);
  const { items: lists } = useMicroLists();
  const [selectedTab, setSelectedTab] = useState<FolderTab | null>(null);
  const tab = selectedTab ?? list?.tab ?? "activity";
  const relevant = list?.tab === tab;
  const { properties: folderProperties, saveProperties } = useFolderProperties(
    `list:${listId}`,
    {
      name: list?.name || "CRM",
      description: list?.description || "Micro CRM",
      parentFolder: "Micro team",
      subfolders: [],
      sharing: "team",
      folderType: "automatic",
      includeConnectedObjects: true,
    },
  );

  return (
    <ProfileFrame backHref="/" backLabel="Back to home">
      <ProfileHeader
        name={status === "loading" && !list ? "Loading…" : folderProperties.name}
        actions={
          <div className="ml-auto">
            <FolderAddMenu onSelect={setSelectedTab} />
          </div>
        }
        avatar={
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-[19px]">
            {list?.icon || "▦"}
          </span>
        }
      >
        <span>{folderProperties.description || "Micro CRM"}</span>
      </ProfileHeader>
      <FolderActions
        folderId={listId}
        name={folderProperties.name}
        href={`/lists/${listId}`}
        favoriteId={`list:${listId}`}
        itemLabel="list"
        editorProperties={folderProperties}
        parentOptions={[
          "Micro team",
          ...lists.filter((item) => item.id !== listId).map((item) => item.name),
        ]}
        teamScoped
        onSaveProperties={saveProperties}
      />

      <div className="mt-8 flex items-center gap-3">
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto scrollbar-thin">
          <FolderTabChip tab="activity" active={tab} onChange={setSelectedTab} icon={<Pulse />}>
            Activity
          </FolderTabChip>
          <FolderTabChip tab="people" active={tab} onChange={setSelectedTab} icon={<Users />}>
            People
          </FolderTabChip>
          <FolderTabChip tab="companies" active={tab} onChange={setSelectedTab} icon={<Buildings />}>
            Companies
          </FolderTabChip>
          <FolderTabChip tab="notes" active={tab} onChange={setSelectedTab} icon={<NoteIcon />}>
            Notes
          </FolderTabChip>
          <FolderTabChip tab="tasks" active={tab} onChange={setSelectedTab} icon={<ListChecks />}>
            Tasks
          </FolderTabChip>
        </div>
        <FolderMoreMenu active={tab} onSelect={setSelectedTab} />
      </div>

      {message ? <div className="mt-3 text-[12px] text-muted-foreground">{message}</div> : null}

      {status === "loading" ? (
        <FeedRowsSkeleton rows={6} />
      ) : relevant ? (
        items.length > 0 ? (
          <MicroListRows tab={list.tab} items={items} />
        ) : (
          <FolderObjectEmptyState
            icon={<TabIcon tab={list.tab} />}
            title={`No ${TAB_LABELS[list.tab]} in this CRM yet`}
            description={`Add ${TAB_LABELS[list.tab]} to start building this CRM.`}
          />
        )
      ) : tab === "files" ? (
        <ProfileFiles />
      ) : (
        <FolderObjectEmptyState
          icon={<TabIcon tab={tab} />}
          title={`No ${tab} in this CRM`}
          description={`This CRM is built from ${list ? TAB_LABELS[list.tab] : "records"}.`}
        />
      )}
    </ProfileFrame>
  );
}

function TabIcon({ tab }: { tab: FolderTab }) {
  if (tab === "people") return <Users />;
  if (tab === "companies") return <Buildings />;
  if (tab === "notes") return <NoteIcon />;
  if (tab === "tasks") return <ListChecks />;
  if (tab === "deals") return <Handshake />;
  if (tab === "files") return <FilesIcon />;
  return <Pulse />;
}

function MicroListRows({ tab, items }: { tab: MicroListTab; items: MicroListRecord[] }) {
  if (tab === "deals") return <DealGroups items={items} />;
  if (tab === "tasks") return <TaskListRows items={items} />;

  return (
    <div className="mt-6 flex flex-col">
      {items.map((item) => (
        <MicroListRecordRow key={item.id} tab={tab} item={item} />
      ))}
    </div>
  );
}

function TaskListRows({ items }: { items: MicroListRecord[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 5);

  return (
    <section className="mt-6">
      <div className="flex flex-col">
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="group flex items-center gap-3 rounded-lg px-1 py-2 text-[14px] leading-5 text-foreground hover:bg-hover"
          >
            <span className="h-4 w-4 shrink-0 rounded-full border border-muted-foreground/80" />
            <span className="min-w-0 flex-1">{item.name}</span>
          </div>
        ))}
      </div>
      {items.length > 5 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 rounded-full px-1 py-1.5 text-[13px] text-placeholder hover:text-muted-foreground"
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </section>
  );
}

function DealGroups({ items }: { items: MicroListRecord[] }) {
  const groups = new Map<string, MicroListRecord[]>();
  for (const item of items) {
    const status = item.status?.trim() || "No status";
    groups.set(status, [...(groups.get(status) ?? []), item]);
  }

  return (
    <div className="mt-6 flex flex-col gap-6">
      {[...groups.entries()].map(([status, deals]) => (
        <DealStatusGroup key={status} status={status} deals={deals} />
      ))}
    </div>
  );
}

function DealStatusGroup({ status, deals }: { status: string; deals: MicroListRecord[] }) {
  const [expanded, setExpanded] = useState(false);
  const visibleDeals = expanded ? deals : deals.slice(0, 3);

  return (
    <section>
      <h2 className="mb-1 text-[13px] text-muted-foreground">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </h2>
      <div className="flex flex-col">
        {visibleDeals.map((deal) => (
          <MicroListRecordRow key={deal.id} tab="deals" item={deal} />
        ))}
      </div>
      {deals.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 px-1 py-1.5 text-[13px] text-placeholder hover:text-muted-foreground"
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </section>
  );
}

function MicroListRecordRow({
  tab,
  item,
}: {
  tab: MicroListTab;
  item: MicroListRecord;
}) {
  const hasRelatedDealEntity =
    tab === "deals" && Boolean(item.avatarName || item.photoUrl);
  const content = (
    <>
      {tab === "people" || tab === "companies" || hasRelatedDealEntity ? (
        <Avatar
          name={item.avatarName || item.name}
          color={item.color}
          photoUrl={item.photoUrl}
          rounded={tab === "people" ? "full" : "md"}
          size={28}
        />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-hover text-muted-foreground">
          <TabIcon tab={tab} />
        </span>
      )}
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="truncate text-[14px] font-medium text-foreground">{item.name}</div>
          {(tab === "people" || tab === "companies") &&
          isVerifiedEntity(item.id, item.name) ? (
            <VerifiedBadge entityId={item.id} />
          ) : null}
        </div>
        {item.subtitle ? (
          <div className="truncate text-[12.5px] text-muted-foreground">{item.subtitle}</div>
        ) : null}
      </div>
    </>
  );
  const className = "flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-hover";

  return item.href ? (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
