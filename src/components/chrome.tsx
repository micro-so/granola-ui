"use client";

import { CaretLeft } from "@phosphor-icons/react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

export const contentColumnClass = "mx-auto w-full max-w-[680px] px-6";
export const directoryGridClass =
  "grid grid-cols-[minmax(0,1fr)_140px_80px] items-center px-1 pr-12";

export const peopleDirectoryGridClass =
  "grid grid-cols-[minmax(176px,0.85fr)_minmax(200px,1.6fr)_120px_120px_72px] items-start gap-x-2 px-1 pr-8";

export function ContentColumn({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`${contentColumnClass} ${className}`}>{children}</div>;
}

export function BackPill({
  fallbackHref = "/",
  label = "Back",
  className = "",
}: {
  fallbackHref?: string;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }
        router.push(fallbackHref);
      }}
      className={`flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-hover hover:text-foreground ${className}`}
    >
      <CaretLeft className="h-4 w-4" weight="bold" />
    </button>
  );
}

export function FilterChip({
  active,
  onClick,
  children,
  quiet = false,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  quiet?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border border-border text-[13px] ${
        quiet ? "px-2.5 py-0.75" : "px-3 py-1.5"
      } ${
        active
          ? "bg-muted text-foreground"
          : quiet
            ? "text-muted-foreground hover:bg-hover hover:text-foreground"
            : "text-muted-foreground hover:bg-hover hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] text-foreground hover:bg-hover ${className}`}
    >
      {children}
    </button>
  );
}

export function MutedAction({
  children,
  className = "",
  label,
}: {
  children: ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`flex items-center justify-center rounded-full bg-muted ${className}`}
    >
      {children}
    </button>
  );
}
