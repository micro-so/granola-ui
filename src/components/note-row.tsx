import { ChatCircle, Check, EnvelopeSimple, File, FolderSimple, Users, X } from "@phosphor-icons/react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { NoteTime } from "@/components/note-time";
import {
  companyById,
  formatActivityTimestampDate,
  formatClockTime,
  formatDateLabel,
  groupNotesByDate,
  isoDate,
  noteLeadId,
  noteOtherNames,
  personById,
  type Note,
} from "@/lib/data";

export function NoteRow({
  note,
  href,
  showAddTo = false,
  names = "full",
  peopleCircles = false,
  connectToNext = false,
  hideMeetingNotesBadge = false,
}: {
  note: Note;
  href?: string;
  showAddTo?: boolean;
  names?: "full" | "first";
  peopleCircles?: boolean;
  connectToNext?: boolean;
  hideMeetingNotesBadge?: boolean;
}) {
  const leadId = noteLeadId(note);
  const lead = personById(leadId);
  const company = companyById(note.companyId);
  const others = noteOtherNames(note, names);
  const personName = note.leadName || lead?.name || others[0] || "";
  const companyName = note.companyName || company?.name || "";
  const markName = personName || companyName || "Note";
  const useCircle = Boolean(personName) || (peopleCircles && !companyName);
  const markColor = personName
    ? note.leadColor || lead?.avatarColor
    : note.companyColor || company?.logoColor;
  const markPhoto = personName
    ? note.leadPhotoUrl || lead?.photoUrl
    : note.companyLogoUrl || company?.logoUrl;
  const isEmail = note.kind === "email";
  const isChat = note.kind === "chat";
  const isMeeting =
    note.kind === "meet" ||
    note.badge === "Meeting notes" ||
    note.badge === "Meeting summary" ||
    note.badge === "Transcript";
  const isDocument = !isEmail && !isChat && !isMeeting;
  const visibleBadge =
    hideMeetingNotesBadge && note.badge === "Meeting notes"
      ? undefined
      : note.badge;
  const displayTime = note.occurredAt ? formatClockTime(note.occurredAt) : note.time;
  const displayDate = formatActivityTimestampDate(note.occurredAt || note.date);

  const body = (
    <>
      <span className="relative flex w-7 shrink-0 self-stretch items-center justify-center">
        {connectToNext ? (
          <span
            aria-hidden="true"
            className="absolute -bottom-[21px] left-1/2 top-[calc(50%+13px)] w-px -translate-x-1/2 bg-border"
          />
        ) : null}
        {isEmail ? (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-hover text-muted-foreground">
            <EnvelopeSimple className="h-4 w-4" />
          </span>
        ) : isChat ? (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-hover text-muted-foreground">
            <ChatCircle className="h-4 w-4" />
          </span>
        ) : isDocument ? (
          <span className="relative flex h-7 w-7 items-center justify-center rounded-[6px] border border-border bg-hover text-muted-foreground">
            <File className="h-4 w-4" />
          </span>
        ) : (
          <Avatar
            name={markName}
            color={markColor}
            photoUrl={markPhoto}
            rounded={isMeeting ? "md" : useCircle ? "full" : "md"}
            size={28}
          />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <div className="truncate text-[14px] text-foreground">{note.title}</div>
          {visibleBadge ? (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] leading-none text-muted-foreground">
              {visibleBadge}
            </span>
          ) : null}
        </div>
        <div className="truncate text-[12.5px] text-muted-foreground">
          {isEmail ? (
            <>
              <span className={note.emailSnippet ? "group-hover/message:hidden" : ""}>
                {note.preview || "No preview available"}
              </span>
              {note.emailSnippet ? (
                <span className="hidden text-placeholder group-hover/message:inline">
                  {note.emailSnippet}
                </span>
              ) : null}
            </>
          ) : isChat ? (
            <>
              <span className={note.chatSnippet ? "group-hover/message:hidden" : ""}>
                {note.preview || others.join(", ") || "You"}
              </span>
              {note.chatSnippet ? (
                <span className="hidden text-placeholder group-hover/message:inline">
                  {note.chatSnippet}
                </span>
              ) : null}
            </>
          ) : (
            others.join(", ") || "You"
          )}
        </div>
      </div>
      {showAddTo && note.addTo ? (
        <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[12px] text-muted-foreground ring-1 ring-inset ring-foreground/[0.08]">
          Add to
          {note.addTo === "Standups" ? <Users className="h-3.5 w-3.5" /> : <FolderSimple className="h-3.5 w-3.5" />}
          {note.addTo}
          <Check className="h-3 w-3 text-muted-foreground" weight="bold" />
          <X className="h-3 w-3" />
        </span>
      ) : null}
      <div className="w-[8.5rem] shrink-0 whitespace-nowrap text-right text-[12.5px] text-muted-foreground">
        {displayDate || <NoteTime time={displayTime} />}
      </div>
    </>
  );

  const className = "group/message flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-hover";

  if (href) {
    if (/^https?:\/\//i.test(href)) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {body}
        </a>
      );
    }
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}

export function NoteGroups({
  notes,
  hrefForNote,
  showAddTo = false,
  names = "full",
  peopleCircles = false,
  sectionClassName = "mt-6",
  showSectionTitles = true,
  connectIcons = false,
  hideMeetingNotesBadge = false,
}: {
  notes: Note[];
  hrefForNote?: (note: Note) => string;
  showAddTo?: boolean;
  names?: "full" | "first";
  peopleCircles?: boolean;
  sectionClassName?: string;
  showSectionTitles?: boolean;
  connectIcons?: boolean;
  hideMeetingNotesBadge?: boolean;
}) {
  const displayNotes = notes.map((note) =>
    note.occurredAt
      ? {
          ...note,
          date: isoDate(note.occurredAt),
          dateLabel: formatDateLabel(note.occurredAt),
          time: formatClockTime(note.occurredAt),
        }
      : note,
  );

  if (!showSectionTitles) {
    return (
      <div className={`${sectionClassName} flex flex-col`}>
        {displayNotes.map((note, index) => (
          <NoteRow
            key={note.id}
            note={note}
            href={hrefForNote?.(note) ?? note.href}
            showAddTo={showAddTo}
            names={names}
            peopleCircles={peopleCircles}
            connectToNext={connectIcons && index < displayNotes.length - 1}
            hideMeetingNotesBadge={hideMeetingNotesBadge}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      {groupNotesByDate(displayNotes).map((group) => (
        <section key={group.label} className={sectionClassName}>
          <h2 className="mb-1 text-[13px] text-muted-foreground">{group.label}</h2>
          <div className="flex flex-col">
            {group.notes.map((note, index) => (
              <NoteRow
                key={note.id}
                note={note}
                href={hrefForNote?.(note) ?? note.href}
                showAddTo={showAddTo}
                names={names}
                peopleCircles={peopleCircles}
                connectToNext={connectIcons && index < group.notes.length - 1}
                hideMeetingNotesBadge={hideMeetingNotesBadge}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
