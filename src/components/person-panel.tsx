"use client";

import { EnvelopeSimple, Globe } from "@phosphor-icons/react";
import Link from "next/link";
import { AskBar } from "@/components/ask-bar";
import { Avatar } from "@/components/avatar";
import { NotesFeed } from "@/components/notes-feed";
import { ProfileFrame, ProfileHeader } from "@/components/profile-frame";
import { companyById, notesForPerson, type Person } from "@/lib/data";

export function PersonPanel({ person }: { person: Person }) {
  const company = companyById(person.companyId);
  const notes = notesForPerson(person.id);

  return (
    <ProfileFrame backHref="/people" backLabel="Back to people">
      <ProfileHeader
        name={person.name}
        avatar={<Avatar name={person.name} color={person.avatarColor} photoUrl={person.photoUrl} size={36} />}
      >
        <div className="flex items-center gap-2">
          <EnvelopeSimple className="h-3.5 w-3.5" />
          {person.email}
        </div>
        {company ? (
          <Link href={`/companies/${company.id}`} className="flex items-center gap-2 hover:text-foreground">
            <Globe className="h-3.5 w-3.5" />
            {company.domain}
          </Link>
        ) : null}
      </ProfileHeader>
      <AskBar placeholder="Ask anything" />
      <NotesFeed notes={notes} peopleCircles />
    </ProfileFrame>
  );
}
