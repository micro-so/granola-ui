"use client";

import { CircleNotch, MagnifyingGlass } from "@phosphor-icons/react";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { BackPill, FilterChip, directoryGridClass, peopleDirectoryGridClass } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";
import { Skeleton } from "@/components/loading-state";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import { formatNoteCount } from "@/lib/data";

export type DirectoryRow = {
  id: string;
  href: string;
  name: string;
  subtitle: string;
  lastNoteLabel: string;
  noteCount: number;
  summary?: string;
  lastInteractionLabel?: string;
  lastMeetingLabel?: string;
  extraEmailCount?: number;
  extraDomainCount?: number;
  relationshipStrength?: string;
  color: string;
  photoUrl?: string;
  rounded?: "full" | "md";
  nameExtra?: string;
  searchText?: string;
};

export function DirectoryPage({
  title,
  entityLabel,
  searchPlaceholder,
  empty,
  filters,
  rows,
  message,
  loading,
  serverSearch = false,
  onQueryChange,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
  layout = "directory",
  metricLabel = "Notes",
  summaryLabel = "Summary",
}: {
  title: string;
  entityLabel: string;
  searchPlaceholder: string;
  empty: string;
  filters: { id: string; label: string; active: boolean; onClick: () => void }[];
  rows: DirectoryRow[];
  message?: string | null;
  loading?: boolean;
  serverSearch?: boolean;
  onQueryChange?: (query: string) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
  layout?: "default" | "people" | "directory";
  metricLabel?: "Notes" | "Strength";
  summaryLabel?: string;
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const wide = layout === "people" || layout === "directory";

  const visible = useMemo(() => {
    if (serverSearch) return rows;
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.name} ${row.subtitle} ${row.summary ?? ""} ${row.searchText ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, rows, serverSearch]);

  return (
    <GranolaShell>
      <div className="flex h-full min-h-0 flex-col px-8 pt-4">
        <BackPill fallbackHref="/" label="Back" />

        <div className="mt-4">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-heading">{title}</h1>
          {message ? <div className="mt-1 text-[12px] text-muted-foreground">{message}</div> : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto scrollbar-thin">
            {filters.map((item) => (
              <FilterChip key={item.id} active={item.active} onClick={item.onClick}>
                <span className="whitespace-nowrap">{item.label}</span>
              </FilterChip>
            ))}
          </div>

          {searchOpen ? (
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                onQueryChange?.(event.target.value);
              }}
              onBlur={() => {
                if (!query) setSearchOpen(false);
              }}
              placeholder={searchPlaceholder}
              className="h-8 w-52 shrink-0 rounded-full border border-border bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-placeholder"
            />
          ) : (
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/55 text-foreground hover:bg-hover"
            >
              <MagnifyingGlass className="h-4 w-4" weight="regular" />
            </button>
          )}
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <div
            className={`${wide ? peopleDirectoryGridClass : directoryGridClass} items-center border-y border-border py-2 text-[12px] text-muted-foreground`}
          >
            <div>{entityLabel}</div>
            {wide ? (
              <>
                <div>{summaryLabel}</div>
                <div>Last interaction</div>
              </>
            ) : null}
            <div className="flex items-center justify-end gap-0.5 pr-2">
              Last meeting
              <ArrowDown className="h-3 w-3" strokeWidth={2} />
            </div>
            <div className="pr-1 text-right">{metricLabel}</div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
            {loading ? (
              <DirectoryLoadingRows wide={wide} />
            ) : visible.length === 0 ? (
              <div className="px-1 py-10 text-[13px] text-muted-foreground">{empty}</div>
            ) : (
              <>
              {visible.map((row) => {
                const extraCount = row.extraEmailCount ?? row.extraDomainCount ?? 0;
                const meetingLabel = row.lastMeetingLabel ?? row.lastNoteLabel;
                const metricValue =
                  metricLabel === "Strength"
                    ? row.relationshipStrength || "—"
                    : formatNoteCount(row.noteCount);

                return (
                  <Link
                    key={row.id}
                    href={row.href}
                    className={`${wide ? peopleDirectoryGridClass : directoryGridClass} rounded-lg py-3 hover:bg-hover`}
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar
                        name={row.name}
                        color={row.color}
                        photoUrl={row.photoUrl}
                        rounded={row.rounded}
                      />
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1">
                          <div className="truncate text-[14px] font-medium text-foreground">
                            {row.name}
                            {row.nameExtra ? (
                              <span className="font-normal text-muted-foreground">{row.nameExtra}</span>
                            ) : null}
                          </div>
                          {isVerifiedEntity(row.id, row.name) ? <VerifiedBadge entityId={row.id} /> : null}
                        </div>
                        <div className="truncate text-[12.5px] text-muted-foreground">
                          {row.subtitle}
                          {extraCount > 0 ? (
                            <span className="text-muted-foreground/70">{` +${extraCount}`}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                    {wide ? (
                      <>
                        <div className="min-w-0 pr-1 text-[13px] text-muted-foreground">
                          <span className="line-clamp-2">{row.summary || "—"}</span>
                        </div>
                        <div className="text-[13px] text-muted-foreground">
                          {row.lastInteractionLabel || "—"}
                        </div>
                      </>
                    ) : null}
                    <div className="pr-2 text-right text-[13px] text-muted-foreground">{meetingLabel}</div>
                    <div className="pr-1 text-right text-[13px] text-muted-foreground">{metricValue}</div>
                  </Link>
                );
              })}
              {hasMore && onLoadMore ? (
                <div className="flex justify-center py-4">
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="rounded-full px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-hover hover:text-foreground disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <span className="flex items-center gap-1.5">
                        <CircleNotch className="h-3.5 w-3.5 animate-spin" />
                        Loading
                      </span>
                    ) : (
                      "Show more"
                    )}
                  </button>
                </div>
              ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </GranolaShell>
  );
}

function DirectoryLoadingRows({ wide }: { wide: boolean }) {
  const gridClass = wide ? peopleDirectoryGridClass : directoryGridClass;

  return (
    <div role="status" aria-label="Loading directory">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className={`${gridClass} items-center py-3`}>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <Skeleton className={`h-3.5 ${index % 2 === 0 ? "w-28" : "w-36"}`} />
              <Skeleton className="mt-2 h-2.5 w-24" />
            </div>
          </div>
          {wide ? (
            <>
              <div className="pr-4">
                <Skeleton className="h-3 w-full max-w-48" />
                <Skeleton className="mt-2 h-3 w-2/3" />
              </div>
              <Skeleton className="h-3 w-16" />
            </>
          ) : null}
          <Skeleton className="ml-auto mr-2 h-3 w-14" />
          <Skeleton className="ml-auto mr-1 h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
