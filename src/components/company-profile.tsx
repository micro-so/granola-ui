"use client";

import Link from "next/link";
import { useState } from "react";
import { Avatar } from "@/components/avatar";
import { Skeleton } from "@/components/loading-state";
import { ProfileTextSection } from "@/components/person-profile";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import type { Person } from "@/lib/data";

export function CompanyProfile({
  relationship,
  about,
  people,
  peopleLoading = false,
}: {
  relationship?: string;
  about?: string;
  people: Person[];
  peopleLoading?: boolean;
}) {
  return (
    <div>
      <ProfileTextSection
        title="Relationship"
        text={relationship}
        emptyText="No relationship summary yet."
      />
      <ProfileTextSection title="About" text={about} emptyText="No about information yet." />
      <CompanyPeople people={people} loading={peopleLoading} />
    </div>
  );
}

function CompanyPeople({ people, loading }: { people: Person[]; loading: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const visiblePeople = expanded ? people : people.slice(0, 3);
  const canExpand = people.length > 3;

  return (
    <section id="company-people" className="mt-6 scroll-mt-6">
      <h2 className="mb-1 text-[13px] text-muted-foreground">People</h2>
      {loading && people.length === 0 ? (
        <div role="status" aria-label="Loading people" className="flex flex-col">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center gap-3 px-1 py-2.5">
              <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className={`h-3.5 ${index === 1 ? "w-32" : "w-40"}`} />
                <Skeleton className="mt-2 h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : people.length > 0 ? (
        <>
          <div className="flex flex-col">
            {visiblePeople.map((person) => (
              <Link
                key={person.id}
                href={`/people/${person.id}`}
                className="flex items-center gap-3 rounded-lg px-1 py-2.5 hover:bg-hover"
              >
                <Avatar
                  name={person.name}
                  color={person.avatarColor}
                  photoUrl={person.photoUrl}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <div className="truncate text-[14px] text-foreground">{person.name}</div>
                    {isVerifiedEntity(person.id, person.name) ? (
                      <VerifiedBadge entityId={person.id} />
                    ) : null}
                  </div>
                  {person.email ? (
                    <div className="truncate text-[12.5px] text-muted-foreground">{person.email}</div>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
          {canExpand ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-1 px-1 py-1.5 text-[13px] text-placeholder hover:text-muted-foreground"
            >
              {expanded ? "Less" : "More"}
            </button>
          ) : null}
        </>
      ) : (
        <div className="px-1 py-2 text-[13px] text-muted-foreground">No people yet.</div>
      )}
    </section>
  );
}
