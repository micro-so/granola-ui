"use client";

import { FolderSimple } from "@phosphor-icons/react";
import Link from "next/link";
import type { ProfileFolderMembership } from "@/lib/micro-lists";

export function ProfileFolderMenu({
  folders,
  loading = false,
}: {
  folders: ProfileFolderMembership[];
  loading?: boolean;
}) {
  return (
    <div className="group relative inline-flex">
      <button
        type="button"
        className="inline-flex items-center gap-1.5 hover:text-foreground"
        aria-label={`${folders.length} ${folders.length === 1 ? "folder" : "folders"}`}
      >
        <FolderSimple className="h-3.5 w-3.5" />
        {loading
          ? "…"
          : folders.length === 0
            ? "Add to folder"
            : `${folders.length} ${folders.length === 1 ? "folder" : "folders"}`}
      </button>
      <div className="pointer-events-none invisible absolute left-0 top-full z-40 w-56 pt-2 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:visible group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:opacity-100">
        <div className="overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-2xl">
          {folders.length > 0 ? (
            folders.map((folder) => (
              <Link
                key={folder.id}
                href={folder.href}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-foreground hover:bg-hover"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-muted-foreground">
                  {folder.icon || <FolderSimple />}
                </span>
                <span className="truncate">{folder.name}</span>
              </Link>
            ))
          ) : (
            <div className="px-2.5 py-2 text-[13px] text-foreground">
              Add to folder
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
