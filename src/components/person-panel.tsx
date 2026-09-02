"use client";

import { EnvelopeSimple, MapPin, Phone } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ProfilePageSkeleton } from "@/components/loading-state";
import { NotesFeed, type ProfileTab } from "@/components/notes-feed";
import { PersonProfile } from "@/components/person-profile";
import { ProfileActionsMenu } from "@/components/profile-actions-menu";
import { ProfileFolderMenu } from "@/components/profile-folder-menu";
import { ProfileFrame, ProfileHeader, ProfileMeta } from "@/components/profile-frame";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import { includePersonId, meId } from "@/lib/data";
import { useActivity } from "@/lib/use-activity";
import { useCompanies, useCompany } from "@/lib/use-companies";
import { useComments } from "@/lib/use-comments";
import { useDeals } from "@/lib/use-deals";
import { useProfileFolderMemberships } from "@/lib/use-micro-lists";
import { useNotes } from "@/lib/use-notes";
import { usePerson } from "@/lib/use-people";
import { socialLinks } from "@/lib/social";
import { useTasks } from "@/lib/use-tasks";

function companyNameFromEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const personalDomains = new Set(["gmail.com", "icloud.com", "outlook.com", "yahoo.com"]);
  if (!domain || personalDomains.has(domain)) return "";

  const name = domain.split(".")[0]?.replace(/[-_]+/g, " ").trim() ?? "";
  return name.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function PersonPanel({ personId }: { personId: string }) {
  const { person, status, message } = usePerson(personId);
  const [tab, setTab] = useState<ProfileTab>("profile");
  const { items: documents, status: documentsStatus } = useNotes({
    personId,
    q: person?.name,
    all: true,
    enabled: tab === "notes",
  });
  const { items: tasks, status: tasksStatus } = useTasks({
    personId,
    q: person?.name,
    enabled: tab === "tasks",
  });
  const { items: deals, status: dealsStatus } = useDeals({
    personId,
    enabled: tab === "deals",
  });
  const { items: folders, status: foldersStatus } =
    useProfileFolderMemberships({
      personId,
      enabled: Boolean(person),
    });
  const { items: activity, upcoming: activityUpcoming, status: activityStatus } = useActivity({
    personId,
    q: person?.name,
    email: person?.email,
    person,
    enabled: Boolean(person) && tab === "activity",
  });
  const {
    items: comments,
    status: commentsStatus,
    posting: commentsPosting,
    addComment,
  } = useComments({
    personId,
    enabled: tab === "activity",
  });
  const { company } = useCompany(person?.companyId ?? "");
  const inferredCompanyName = person?.companyName || companyNameFromEmail(person?.email ?? "");
  const { items: inferredCompanies } = useCompanies({
    search: inferredCompanyName,
    enabled: !person?.companyId && Boolean(inferredCompanyName),
  });
  const inferredCompany = inferredCompanies.find(
    (item) => item.name.toLowerCase() === inferredCompanyName.toLowerCase(),
  );
  const profileCompany = company || inferredCompany;
  const companyName = profileCompany?.name || inferredCompanyName;
  const companyHref = profileCompany?.id ? `/companies/${profileCompany.id}` : "";
  const mineId = meId;

  const upcoming = useMemo(() => includePersonId(activityUpcoming, mineId), [activityUpcoming, mineId]);
  const notes = useMemo(() => includePersonId(activity, mineId), [activity, mineId]);

  if (status === "loading" && !person) {
    return (
      <ProfileFrame backHref="/people" backLabel="Back to people">
        <ProfilePageSkeleton />
      </ProfileFrame>
    );
  }

  if (!person) {
    return (
      <ProfileFrame backHref="/people" backLabel="Back to people">
        <div className="pt-6 text-[13px] text-muted-foreground">{message ?? "Person not found."}</div>
      </ProfileFrame>
    );
  }

  return (
    <ProfileFrame backHref="/people" backLabel="Back to people">
      <ProfileHeader
        name={person.name}
        avatar={<Avatar name={person.name} color={person.avatarColor} photoUrl={person.photoUrl} size={36} />}
        nameAdornment={
          isVerifiedEntity(person.id, person.name) ? <VerifiedBadge entityId={person.id} /> : null
        }
        actions={
          <ProfileActionsMenu
            profileType="person"
            profile={person}
          />
        }
        socials={socialLinks(person)}
        contact={
          <>
            {person.email ? (
              <ProfileMeta href={`mailto:${person.email}`} external>
                <EnvelopeSimple className="h-3.5 w-3.5" />
                {person.email}
              </ProfileMeta>
            ) : null}
            {person.phone ? (
              <ProfileMeta href={`tel:${person.phone.replace(/\D/g, "")}`}>
                <Phone className="h-3.5 w-3.5" />
                {person.phone}
              </ProfileMeta>
            ) : null}
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {companyName ? (
            <ProfileMeta href={companyHref || undefined}>
              <Avatar
                name={companyName}
                color={profileCompany?.logoColor}
                photoUrl={profileCompany?.logoUrl}
                size={16}
                rounded="md"
              />
              <span>{companyName}</span>
            </ProfileMeta>
          ) : null}
          {person.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {person.location}
            </span>
          ) : null}
          <ProfileFolderMenu
            folders={folders}
            loading={foldersStatus === "loading"}
          />
        </div>
      </ProfileHeader>
      <NotesFeed
        profile={
          <PersonProfile
            relationship={person.summary}
            about={person.about}
            work={person.workHistory ?? []}
            education={person.educationHistory ?? []}
            skillsAndInterests={person.skillsAndInterests ?? []}
          />
        }
        notes={notes}
        documents={documents}
        upcoming={upcoming}
        tasks={tasks}
        deals={deals}
        comments={comments}
        peopleCircles
        mineId={mineId}
        loading={activityStatus === "loading"}
        documentsLoading={documentsStatus === "loading"}
        tasksLoading={tasksStatus === "loading"}
        dealsLoading={dealsStatus === "loading"}
        commentsLoading={commentsStatus === "loading"}
        commentsPosting={commentsPosting}
        onSubmitComment={addComment}
        tab={tab}
        onTabChange={setTab}
      />
    </ProfileFrame>
  );
}
