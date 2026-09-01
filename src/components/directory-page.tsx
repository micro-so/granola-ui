"use client";

import { FileText, MagnifyingGlass } from "@phosphor-icons/react";
import { ArrowDown } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { BackPill, FilterChip, directoryGridClass } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";
import { formatNoteCount } from "@/lib/data";

export type DirectoryRow = {
  id: string;
  href: string;
  name: string;
  subtitle: string;
  lastNoteLabel: string;
  noteCount: number;
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
}: {
  title: string;
  entityLabel: string;
  searchPlaceholder: string;
  empty: string;
  filters: { id: string; label: string; active: boolean; onClick: () => void }[];
  rows: DirectoryRow[];
}) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.name} ${row.subtitle} ${row.searchText ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, rows]);

  return (
    <GranolaShell>
      <div className="flex h-full min-h-0 flex-col px-8 pt-4">
        <BackPill href="/" label="Back">
          <FileText className="h-3.5 w-3.5" />
        </BackPill>

        <div className="mt-4 flex items-center justify-between">
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-heading">{title}</h1>

          <div className="flex items-center gap-1.5">
            {searchOpen ? (
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onBlur={() => {
                  if (!query) setSearchOpen(false);
                }}
                placeholder={searchPlaceholder}
                className="h-8 w-52 rounded-full border border-border bg-transparent px-3 text-[13px] text-foreground outline-none placeholder:text-placeholder"
              />
            ) : (
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/55 text-foreground hover:bg-hover"
              >
                <MagnifyingGlass className="h-4 w-4" weight="regular" />
              </button>
            )}

            {filters.map((item) => (
              <FilterChip key={item.id} active={item.active} onClick={item.onClick}>
                {item.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col">
          <div className={`${directoryGridClass} border-y border-border py-2 text-[12px] text-muted-foreground`}>
            <div>{entityLabel}</div>
            <div className="flex items-center justify-end gap-0.5 pr-2">
              Last note
              <ArrowDown className="h-3 w-3" strokeWidth={2} />
            </div>
            <div className="pr-1 text-right">Notes</div>
          </div>

          <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
            {visible.length === 0 ? (
              <div className="px-1 py-10 text-[13px] text-muted-foreground">{empty}</div>
            ) : (
              visible.map((row) => (
                <Link
                  key={row.id}
                  href={row.href}
                  className={`${directoryGridClass} rounded-lg py-3 hover:bg-hover`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar
                      name={row.name}
                      color={row.color}
                      photoUrl={row.photoUrl}
                      rounded={row.rounded}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium text-foreground">
                        {row.name}
                        {row.nameExtra ? (
                          <span className="font-normal text-muted-foreground">{row.nameExtra}</span>
                        ) : null}
                      </div>
                      <div className="truncate text-[12.5px] text-muted-foreground">{row.subtitle}</div>
                    </div>
                  </div>
                  <div className="pr-2 text-right text-[13px] text-muted-foreground">{row.lastNoteLabel}</div>
                  <div className="pr-1 text-right text-[13px] text-muted-foreground">
                    {formatNoteCount(row.noteCount)}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </GranolaShell>
  );
}
