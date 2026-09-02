"use client";

import { ArrowUp } from "@phosphor-icons/react";
import { useState, type KeyboardEvent } from "react";
import { Avatar } from "@/components/avatar";
import { NoteTime } from "@/components/note-time";
import {
  formatActivityTimestampDate,
  formatClockTime,
  type ProfileComment,
} from "@/lib/data";

export function ActivityCommentComposer({
  posting,
  onSubmit,
}: {
  posting: boolean;
  onSubmit: (body: string) => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const canSubmit = Boolean(body.trim()) && !posting;

  async function submit() {
    if (!canSubmit) return;
    setError(null);
    try {
      await onSubmit(body.trim());
      setBody("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Could not post comment.");
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void submit();
    }
  }

  return (
    <div className="mt-6">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-surface/40 px-3 py-2 focus-within:border-foreground/20">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          maxLength={10_000}
          placeholder="Leave a comment…"
          aria-label="Leave a comment"
          className="block min-h-6 max-h-32 flex-1 resize-none bg-transparent py-0.5 text-[13.5px] leading-5 text-foreground outline-none [field-sizing:content] placeholder:text-placeholder"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          aria-label="Post comment"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#b6cf3a] text-[#151515] transition-colors hover:bg-[#c7df4a] disabled:bg-foreground disabled:text-background disabled:opacity-20"
        >
          <ArrowUp className="h-3.5 w-3.5" weight="bold" />
        </button>
      </div>
      {error ? <div className="mt-1.5 text-[12px] text-red-400">{error}</div> : null}
    </div>
  );
}

export function ActivityCommentRow({
  comment,
  connectToNext,
}: {
  comment: ProfileComment;
  connectToNext: boolean;
}) {
  const displayDate = formatActivityTimestampDate(comment.occurredAt);
  const displayTime = formatClockTime(comment.occurredAt);

  return (
    <div className="flex gap-3 px-1 py-2.5">
      <span className="relative flex w-7 shrink-0 self-stretch justify-center">
        {connectToNext ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-[21px] left-1/2 top-5 w-px -translate-x-1/2 bg-border"
          />
        ) : null}
        <span className="relative mt-4 h-2 w-2 rounded-full bg-border ring-4 ring-background" />
      </span>
      <div className="min-w-0 flex-1 rounded-xl border border-border bg-surface/35 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-1.5">
            <Avatar
              name={comment.author}
              color={comment.authorColor}
              photoUrl={comment.authorPhotoUrl}
              size={16}
            />
            <span className="truncate text-[14px] leading-4 text-foreground">{comment.author}</span>
          </span>
          <span className="shrink-0 whitespace-nowrap text-[12.5px] text-muted-foreground">
            {displayDate ? `${displayDate}, ` : ""}
            <NoteTime time={displayTime} />
          </span>
        </div>
        <div className="mt-2 whitespace-pre-wrap break-words text-[13.5px] leading-5 text-foreground/90">
          {comment.body}
        </div>
      </div>
    </div>
  );
}
