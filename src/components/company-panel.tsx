"use client";

import { Globe } from "@phosphor-icons/react";
import { AskBar } from "@/components/ask-bar";
import { Avatar } from "@/components/avatar";
import { NotesFeed } from "@/components/notes-feed";
import { ProfileFrame, ProfileHeader } from "@/components/profile-frame";
import { notesForCompany, people, type Company } from "@/lib/data";

export function CompanyPanel({ company }: { company: Company }) {
  const notes = notesForCompany(company.id);
  const members = people.filter((person) => person.companyId === company.id);

  return (
    <ProfileFrame backHref="/companies" backLabel="Back to companies">
      <ProfileHeader
        name={company.name}
        avatar={
          <Avatar name={company.name} color={company.logoColor} photoUrl={company.logoUrl} size={36} rounded="md" />
        }
      >
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5" />
          {company.domain}
        </div>
        <div>
          {members.length} {members.length === 1 ? "person" : "people"}
        </div>
      </ProfileHeader>
      <AskBar placeholder="Ask anything" />
      <NotesFeed notes={notes} />
    </ProfileFrame>
  );
}
