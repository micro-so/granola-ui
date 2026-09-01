import { Check, FolderSimple, Users, X } from "@phosphor-icons/react";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { NoteTime } from "@/components/note-time";
import { companyById, groupNotesByDate, noteLeadId, noteOtherNames, personById, type Note } from "@/lib/data";

export function NoteRow({
  note,
  href,
  showAddTo = false,
  names = "full",
  peopleCircles = false,
}: {
  note: Note;
  href?: string;
  showAddTo?: boolean;
  names?: "full" | "first";
  peopleCircles?: boolean;
}) {
  const leadId = noteLeadId(note);
  const lead = personById(leadId);
  const company = companyById(note.companyId);
  const others = noteOtherNames(note, names);
  const isEvent = note.kind === "meet";
  const useCircle = peopleCircles && !isEvent;

  const body = (
    <>
      <Avatar
        name={isEvent ? (company?.name ?? "Event") : (lead?.name ?? "Note")}
        color={isEvent ? company?.logoColor : lead?.avatarColor}
        photoUrl={isEvent ? company?.logoUrl : lead?.photoUrl}
        rounded={useCircle ? "full" : "md"}
        size={28}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] text-foreground">{note.title}</div>
        <div className="truncate text-[12.5px] text-muted-foreground">{others.join(", ") || "You"}</div>
      </div>
      {showAddTo && note.addTo ? (
        <span className="flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1.5 text-[12px] text-muted-foreground ring-1 ring-inset ring-white/[0.08]">
          Add to
          {note.addTo === "Standups" ? <Users className="h-3.5 w-3.5" /> : <FolderSimple className="h-3.5 w-3.5" />}
          {note.addTo}
          <Check className="h-3 w-3 text-muted-foreground" weight="bold" />
          <X className="h-3 w-3" />
        </span>
      ) : null}
      <div className="w-[4.25rem] shrink-0 text-right text-[12.5px] text-muted-foreground">
        <NoteTime time={note.time} />
      </div>
    </>
  );

  const className = "flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-hover";

  if (href) {
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
}: {
  notes: Note[];
  hrefForNote?: (note: Note) => string;
  showAddTo?: boolean;
  names?: "full" | "first";
  peopleCircles?: boolean;
  sectionClassName?: string;
}) {
  return (
    <>
      {groupNotesByDate(notes).map((group) => (
        <section key={group.label} className={sectionClassName}>
          <h2 className="mb-1 text-[13px] text-muted-foreground">{group.label}</h2>
          <div className="flex flex-col">
            {group.notes.map((note) => (
              <NoteRow
                key={note.id}
                note={note}
                href={hrefForNote?.(note)}
                showAddTo={showAddTo}
                names={names}
                peopleCircles={peopleCircles}
              />
            ))}
          </div>
        </section>
      ))}
    </>
  );
}
