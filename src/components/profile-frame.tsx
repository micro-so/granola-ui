"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DockedAsk } from "@/components/ask-bar";
import { BackPill, ContentColumn } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";
import { SocialIcons } from "@/components/social-icons";
import type { SocialLink } from "@/lib/data";

export function ProfileMeta({
  href,
  children,
  external = false,
  onClick,
}: {
  href?: string;
  children: ReactNode;
  external?: boolean;
  onClick?: () => void;
}) {
  const className = "inline-flex w-fit items-center gap-1.5 hover:text-foreground";

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  if (href && external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    );
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return <span className={className}>{children}</span>;
}

export function ProfileFrame({
  backHref = "/",
  backLabel = "Back",
  children,
}: {
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  return (
    <GranolaShell>
      <div className="relative flex h-full min-h-0 flex-col">
        <BackPill fallbackHref={backHref} label={backLabel} className="absolute left-4 top-4 z-10" />
        <div className="min-h-0 flex-1 overflow-auto pb-28 pt-16 scrollbar-thin">
          <ContentColumn>{children}</ContentColumn>
        </div>
        <DockedAsk />
      </div>
    </GranolaShell>
  );
}

export function ProfileHeader({
  name,
  children,
  avatar,
  contact,
  socials = [],
  summary,
  nameAdornment,
  actions,
}: {
  name: string;
  children?: ReactNode;
  avatar: ReactNode;
  contact?: ReactNode;
  socials?: SocialLink[];
  summary?: string;
  nameAdornment?: ReactNode;
  actions?: ReactNode;
}) {
  const showContactRow = Boolean(contact) || socials.length > 0;

  return (
    <>
      <div className="flex items-center gap-3">
        {avatar}
        <div className="flex min-w-0 items-center gap-1.5">
          <h1 className="truncate font-serif text-[28px] font-normal leading-none tracking-[-0.02em] text-heading">
            {name}
          </h1>
          {nameAdornment}
        </div>
        {actions}
      </div>
      <div className="mt-2.5 flex flex-col gap-1 text-[13px] text-muted-foreground">
        {showContactRow ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {contact}
            <SocialIcons links={socials} />
          </div>
        ) : null}
        {children}
      </div>
      {summary ? <SummaryText summary={summary} /> : null}
    </>
  );
}

function SummaryText({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || expanded) return;
    setCanExpand(node.scrollHeight > node.clientHeight + 1);
  }, [expanded, summary]);

  return (
    <div className="mt-4 w-full">
      <p
        ref={ref}
        className={`text-[13px] leading-relaxed text-muted-foreground whitespace-pre-wrap ${
          expanded ? "" : "line-clamp-4"
        }`}
      >
        {summary}
      </p>
      {canExpand || expanded ? (
        <button
          type="button"
          onClick={() => setExpanded((open) => !open)}
          className="mt-1 text-[13px] text-placeholder hover:text-muted-foreground"
        >
          {expanded ? "Less" : "More"}
        </button>
      ) : null}
    </div>
  );
}
