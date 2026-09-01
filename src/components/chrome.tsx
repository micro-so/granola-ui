import Link from "next/link";
import type { ReactNode } from "react";

export const contentColumnClass = "mx-auto w-full max-w-[680px] px-6";
export const directoryGridClass =
  "grid grid-cols-[minmax(0,1fr)_140px_80px] items-center px-1 pr-12";

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
  href,
  label,
  children,
  className = "",
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`flex h-7 w-fit items-center gap-1 rounded-full border border-border px-2 text-nav hover:bg-hover hover:text-foreground ${className}`}
    >
      <span className="text-[15px] leading-none">‹</span>
      {children}
    </Link>
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
      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] ${
        active
          ? "bg-muted text-foreground"
          : quiet
            ? "text-muted-foreground hover:bg-hover hover:text-foreground"
            : "text-foreground hover:bg-hover"
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
