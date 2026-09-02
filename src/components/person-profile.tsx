"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { colorFromId, type ProfileHistoryItem } from "@/lib/data";

export function PersonProfile({
  relationship,
  about,
  work,
  education,
  skillsAndInterests,
}: {
  relationship?: string;
  about?: string;
  work: ProfileHistoryItem[];
  education: ProfileHistoryItem[];
  skillsAndInterests: string[];
}) {
  return (
    <div>
      <ProfileTextSection title="Relationship" text={relationship} emptyText="No relationship summary yet." />
      <ProfileTextSection title="About" text={about} emptyText="No about information yet." />
      <HistorySection title="Work" items={work} emptyText="No work history yet." linkOrganizations />
      <HistorySection title="Education" items={education} emptyText="No education history yet." />
      <SkillsSection items={skillsAndInterests} />
    </div>
  );
}

export function ProfileTextSection({
  title,
  text,
  emptyText,
}: {
  title: string;
  text?: string;
  emptyText: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = textRef.current;
    if (!node || expanded || !text) return;
    setCanExpand(node.scrollHeight > node.clientHeight + 1);
  }, [expanded, text]);

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-[13px] text-muted-foreground">{title}</h2>
      <div className="py-2">
        <p
          ref={textRef}
          className={`whitespace-pre-wrap text-[13px] leading-relaxed text-foreground ${
            text && !expanded ? "line-clamp-4" : ""
          }`}
        >
          {text || <span className="text-muted-foreground">{emptyText}</span>}
        </p>
        {text && (canExpand || expanded) ? (
          <button
            type="button"
            onClick={() => setExpanded((open) => !open)}
            className="mt-1 text-[13px] text-placeholder hover:text-muted-foreground"
          >
            {expanded ? "Less" : "More"}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function HistorySection({
  title,
  items,
  emptyText,
  linkOrganizations = false,
}: {
  title: string;
  items: ProfileHistoryItem[];
  emptyText: string;
  linkOrganizations?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, 3);
  const canExpand = items.length > 3;

  return (
    <section className="mt-6">
      <h2 className="mb-1 text-[13px] text-muted-foreground">{title}</h2>
      {items.length > 0 ? (
        <>
          <div className="flex flex-col">
            {visibleItems.map((item) => (
              <HistoryRow
                key={item.id}
                item={item}
                href={linkOrganizations && item.organizationId ? `/companies/${item.organizationId}` : undefined}
              />
            ))}
          </div>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((open) => !open)}
              className="mt-1 px-1 py-1.5 text-[13px] text-placeholder hover:text-muted-foreground"
            >
              {expanded ? "Less" : "More"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="px-1 py-2 text-[13px] text-muted-foreground">{emptyText}</div>
      )}
    </section>
  );
}

function HistoryRow({ item, href }: { item: ProfileHistoryItem; href?: string }) {
  const body = (
    <>
      <Avatar
        name={item.organization || item.title}
        color={colorFromId(item.organizationId || item.id)}
        photoUrl={item.logoUrl}
        size={28}
        rounded="md"
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-foreground">{item.organization || item.title}</div>
        {item.title ? <div className="truncate text-[12.5px] text-muted-foreground">{item.title}</div> : null}
      </div>
      {formatDateRange(item) ? (
        <div className="shrink-0 text-right text-[12.5px] text-muted-foreground">{formatDateRange(item)}</div>
      ) : null}
    </>
  );
  const className = "flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-hover";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

function SkillsSection({ items }: { items: string[] }) {
  return (
    <section className="mt-6">
      <h2 className="mb-1 text-[13px] text-muted-foreground">Skills &amp; Interests</h2>
      {items.length > 0 ? (
        <div className="flex flex-wrap gap-2 py-2">
          {items.map((item) => (
            <span
              key={item}
              className="rounded-full border border-border bg-hover px-2.5 py-1 text-[12.5px] text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <div className="py-2 text-[13px] text-muted-foreground">No skills or interests yet.</div>
      )}
    </section>
  );
}

function formatDateRange(item: ProfileHistoryItem) {
  const start = formatMonthYear(item.startDate);
  const end = formatMonthYear(item.endDate);
  if (!start && !end) return "";
  return `${start || "—"} – ${end || "Present"}`;
}

function formatMonthYear(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
