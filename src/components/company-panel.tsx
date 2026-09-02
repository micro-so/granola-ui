"use client";

import { Globe, MapPin } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/avatar";
import { CompanyProfile } from "@/components/company-profile";
import { ProfilePageSkeleton } from "@/components/loading-state";
import { NotesFeed, type ProfileTab } from "@/components/notes-feed";
import { ProfileActionsMenu } from "@/components/profile-actions-menu";
import { ProfileFolderMenu } from "@/components/profile-folder-menu";
import { ProfileFrame, ProfileHeader, ProfileMeta } from "@/components/profile-frame";
import { isVerifiedEntity, VerifiedBadge } from "@/components/verified-badge";
import { includePersonId, meId } from "@/lib/data";
import { useActivity } from "@/lib/use-activity";
import { useCompany } from "@/lib/use-companies";
import { useComments } from "@/lib/use-comments";
import { useDeals } from "@/lib/use-deals";
import { useProfileFolderMemberships } from "@/lib/use-micro-lists";
import { useNotes } from "@/lib/use-notes";
import { useCompanyConnections } from "@/lib/use-people";
import { socialLinks } from "@/lib/social";
import { useTasks } from "@/lib/use-tasks";

export function CompanyPanel({ companyId }: { companyId: string }) {
  const { company, status, message } = useCompany(companyId);
  const [tab, setTab] = useState<ProfileTab>("profile");
  const { items: connections, connectionCount, status: connectionsStatus } = useCompanyConnections({
    companyId,
    domain: company?.domain,
    domains: company?.domains,
    name: company?.name,
    enabled: Boolean(company),
  });
  const { items: documents, status: documentsStatus } = useNotes({
    companyId,
    q: company?.name,
    all: true,
    enabled: tab === "notes",
  });
  const { items: tasks, status: tasksStatus } = useTasks({
    companyId,
    q: company?.name,
    enabled: tab === "tasks",
  });
  const { items: deals, status: dealsStatus } = useDeals({
    companyId,
    enabled: tab === "deals",
  });
  const { items: folders, status: foldersStatus } =
    useProfileFolderMemberships({
      companyId,
      enabled: Boolean(company),
    });
  const { items: activity, upcoming: activityUpcoming, status: activityStatus } = useActivity({
    companyId,
    q: company?.name,
    domain: company?.domain,
    domains: company?.domains,
    company,
    enabled: Boolean(company) && tab === "activity",
  });
  const {
    items: comments,
    status: commentsStatus,
    posting: commentsPosting,
    addComment,
  } = useComments({
    companyId,
    enabled: tab === "activity",
  });
  const mineId = meId;

  const upcoming = useMemo(() => includePersonId(activityUpcoming, mineId), [activityUpcoming, mineId]);
  const notes = useMemo(() => includePersonId(activity, mineId), [activity, mineId]);
  const profileDeals = useMemo(() => {
    const isAndreessen = [company?.domain, ...(company?.domains ?? [])].some(
      (domain) => domain?.toLowerCase() === "a16z.com",
    );
    if (!isAndreessen) return deals;

    return [
      {
        id: "demo-attio-andreessen-series-a",
        name: "Andreessen Horowitz",
        subtitle: "Attio - Series A pipeline",
        photoUrl: company?.logoUrl,
        avatarName: "Andreessen Horowitz",
        sourceLogoUrl:
          "https://brandbadge.clearbit.com/580adb44-80f2-49ca-95c2-0aea3539f30d",
        color: company?.logoColor ?? "#f4f4f5",
        status: "",
      },
      ...deals,
    ];
  }, [
    company?.domain,
    company?.domains,
    company?.logoColor,
    company?.logoUrl,
    deals,
  ]);

  if (status === "loading" && !company) {
    return (
      <ProfileFrame backHref="/companies" backLabel="Back to companies">
        <ProfilePageSkeleton />
      </ProfileFrame>
    );
  }

  if (!company) {
    return (
      <ProfileFrame backHref="/companies" backLabel="Back to companies">
        <div className="pt-6 text-[13px] text-muted-foreground">{message ?? "Company not found."}</div>
      </ProfileFrame>
    );
  }

  return (
    <ProfileFrame backHref="/companies" backLabel="Back to companies">
      <ProfileHeader
        name={company.name}
        avatar={
          <Avatar name={company.name} color={company.logoColor} photoUrl={company.logoUrl} size={36} rounded="md" />
        }
        nameAdornment={
          isVerifiedEntity(company.id, company.name) ? <VerifiedBadge entityId={company.id} /> : null
        }
        actions={
          <ProfileActionsMenu
            profileType="company"
            profile={company}
          />
        }
        socials={socialLinks(company)}
        contact={
          company.domain ? (
            <ProfileMeta href={`https://${company.domain}`} external>
              <Globe className="h-3.5 w-3.5" />
              {company.domain}
            </ProfileMeta>
          ) : null
        }
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {company.location ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {company.location}
            </span>
          ) : null}
          {connectionCount > 0 ? (
            <ProfileMeta
              onClick={() => {
                setTab("profile");
                window.requestAnimationFrame(() =>
                  document.getElementById("company-people")?.scrollIntoView({ behavior: "smooth" }),
                );
              }}
            >
              <div className="flex items-center -space-x-1.5">
                {connections.slice(0, 3).map((person) => (
                  <span key={person.id} className="rounded-full ring-2 ring-background">
                    <Avatar
                      name={person.name}
                      color={person.avatarColor}
                      photoUrl={person.photoUrl}
                      size={16}
                    />
                  </span>
                ))}
              </div>
              {connectionCount} {connectionCount === 1 ? "connection" : "connections"}
            </ProfileMeta>
          ) : null}
          <ProfileFolderMenu
            folders={folders}
            loading={foldersStatus === "loading"}
          />
        </div>
      </ProfileHeader>
      <NotesFeed
        profile={
          <CompanyProfile
            relationship={company.summary}
            about={company.about}
            people={connections}
            peopleLoading={connectionsStatus === "loading"}
          />
        }
        notes={notes}
        documents={documents}
        upcoming={upcoming}
        tasks={tasks}
        deals={profileDeals}
        comments={comments}
        documentsLoading={documentsStatus === "loading"}
        mineId={mineId}
        loading={activityStatus === "loading"}
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
