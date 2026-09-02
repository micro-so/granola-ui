"use client";

import {
  Buildings,
  CaretDown,
  CaretRight,
  ChatCircle,
  Check,
  FolderSimple,
  House,
  LockSimple,
  MagnifyingGlass,
  SidebarSimple,
  Users,
  User,
  X,
} from "@phosphor-icons/react";
import { ChevronsUpDown, SquareSlash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { siClaude, siCursor } from "simple-icons/icons";
import { Avatar } from "@/components/avatar";
import { fetchJsonCached, prefetchJson } from "@/lib/client-query-cache";
import { useDataSource, type DataSource } from "@/lib/data-source";
import { usePinnedProfiles } from "@/lib/use-pinned-profiles";
import { useMicroLists } from "@/lib/use-micro-lists";
import { useSpaces } from "@/lib/use-spaces";
import { useStoredString } from "@/lib/use-stored-string";

function MicroMark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[5px] bg-black"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-full border-[2px] border-heading"
        style={{ width: size - 5, height: size - 5 }}
      />
    </span>
  );
}

const chatGptPath =
  "M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654 2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z";
const grokPath =
  "M9.27 15.29l7.978-5.897c.391-.29.95-.177 1.137.272.98 2.369.542 5.215-1.41 7.169-1.951 1.954-4.667 2.382-7.149 1.406l-2.711 1.257c3.889 2.661 8.611 2.003 11.562-.953 2.341-2.344 3.066-5.539 2.388-8.42l.006.007c-.983-4.232.242-5.924 2.75-9.383.06-.082.12-.164.179-.248l-3.301 3.305v-.01L9.267 15.292M7.623 16.723c-2.792-2.67-2.31-6.801.071-9.184 1.761-1.763 4.647-2.483 7.166-1.425l2.705-1.25a7.808 7.808 0 00-1.829-1A8.975 8.975 0 005.984 5.83c-2.533 2.536-3.33 6.436-1.962 9.764 1.022 2.487-.653 4.246-2.34 6.022-.599.63-1.199 1.259-1.682 1.925l7.62-6.815";

function AgentLogos() {
  const logos = [
    { name: "Claude", path: siClaude.path, background: "#d97757" },
    { name: "ChatGPT", path: chatGptPath, background: "#10a37f" },
    { name: "Grok", path: grokPath, background: "#050505" },
    { name: "Cursor", path: siCursor.path, background: "#171717" },
  ];

  return (
    <div className="flex -space-x-2" aria-label="Claude, ChatGPT, Grok, and Cursor">
      {logos.map((logo, index) => (
        <span
          key={logo.name}
          title={logo.name}
          className="flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-surface text-heading"
          style={{
            backgroundColor: logo.background,
            borderColor: "hsl(var(--surface))",
            zIndex: index + 1,
          }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5 fill-current">
            <path d={logo.path} />
          </svg>
        </span>
      ))}
    </div>
  );
}

type WarmProfile = {
  id: string;
  name: string;
  email?: string;
  domain?: string;
};

function prewarmProfileTabs(collection: "people" | "companies", profile: WarmProfile) {
  const idKey = collection === "people" ? "personId" : "companyId";
  const scope = new URLSearchParams({ [idKey]: profile.id, q: profile.name });
  prefetchJson(`/api/comments?${idKey}=${encodeURIComponent(profile.id)}`);

  const notes = new URLSearchParams(scope);
  notes.set("all", "1");
  prefetchJson(`/api/notes?${notes.toString()}`);
  prefetchJson(`/api/tasks?${scope.toString()}`);

  const activity = new URLSearchParams(scope);
  if (collection === "people" && profile.email) activity.set("email", profile.email);
  if (collection === "companies" && profile.domain) activity.set("domain", profile.domain);
  activity.set("v", "2");
  prefetchJson(`/api/activity?${activity.toString()}`);
}

function NavRow({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: typeof House;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] ${
        active ? "bg-hover text-foreground" : "text-nav hover:bg-hover"
      }`}
    >
      <Icon className="h-[16px] w-[16px]" weight={active ? "fill" : "regular"} />
      <span>{label}</span>
    </Link>
  );
}

const sources: Array<{ id: DataSource; label: string }> = [
  { id: "placeholder", label: "Placeholder" },
  { id: "micro", label: "Micro" },
];

export function GranolaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { source, setSource } = useDataSource();
  const { profiles: pinnedProfiles } = usePinnedProfiles();
  const { items: spaces, status: spacesStatus } = useSpaces();
  const { items: microLists, status: microListsStatus } = useMicroLists();
  const [agentPromptDismissed, setAgentPromptDismissed] = useStoredString(
    "granola-ui:agent-prompt-dismissed",
  );
  const [myNotesExpanded, setMyNotesExpanded] = useStoredString(
    "granola-ui:my-notes-expanded",
    "1",
  );
  const [teamExpanded, setTeamExpanded] = useStoredString(
    "granola-ui:team-expanded",
    "0",
  );
  const [sourceOpen, setSourceOpen] = useState(false);
  const sourceRef = useRef<HTMLDivElement>(null);
  const onHome = pathname === "/";
  const onPeople = pathname.startsWith("/people");
  const onCompanies = pathname.startsWith("/companies");
  const sourceLabel = sources.find((item) => item.id === source)?.label ?? "Placeholder";

  useEffect(() => {
    if (!sourceOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (!sourceRef.current?.contains(event.target as Node)) {
        setSourceOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [sourceOpen]);

  useEffect(() => {
    if (pathname !== "/" || source !== "micro") return;
    const timer = window.setTimeout(() => {
      prefetchJson("/api/people?");
      prefetchJson("/api/companies?");

      void Promise.all([
        fetchJsonCached<{ items?: Array<{ id: string }> }>("/api/people/views?"),
        fetchJsonCached<{ items?: Array<{ id: string }> }>("/api/companies/views?"),
      ]).then(([peopleViews, companyViews]) => {
        const peopleView =
          window.localStorage.getItem("granola-ui:people-view") || peopleViews.items?.[0]?.id;
        const companyView =
          window.localStorage.getItem("granola-ui:companies-view") || companyViews.items?.[0]?.id;
        if (peopleView) prefetchJson(`/api/people?view=${encodeURIComponent(peopleView)}`);
        if (companyView) prefetchJson(`/api/companies?view=${encodeURIComponent(companyView)}`);
      }).catch(() => undefined);

      for (const pinned of pinnedProfiles) {
        const match = pinned.href.match(/^\/(people|companies)\/([^/]+)$/);
        if (!match) continue;
        const collection = match[1] === "people" ? "people" : "companies";
        const id = match[2];
        const endpoint = `/api/${collection}?id=${encodeURIComponent(id)}`;
        void fetchJsonCached<{
          items?: WarmProfile[];
        }>(endpoint).then((data) => {
          const profile = data.items?.[0];
          if (!profile) return;
          prewarmProfileTabs(collection, profile);
          if (collection === "people") return;

          const query = new URLSearchParams({
            companyId: profile.id,
            identityType: "human",
          });
          if (profile.domain) query.set("domain", profile.domain);
          if (profile.name) query.set("name", profile.name);
          prefetchJson(`/api/people?${query.toString()}`);
        }).catch(() => undefined);
      }
    }, 3_000);

    return () => window.clearTimeout(timer);
  }, [pathname, pinnedProfiles, source]);

  return (
    <div className="flex h-full min-h-0 bg-background">
      <aside className="flex w-[232px] shrink-0 flex-col border-r border-border/70 bg-sidebar px-2.5 pb-2.5 pt-3">
        <div className="mb-3 flex h-7 items-center gap-1 px-1.5">
          <button
            type="button"
            aria-label="Toggle sidebar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-nav hover:bg-hover hover:text-foreground"
          >
            <SidebarSimple className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Search"
            className="flex h-7 w-7 items-center justify-center rounded-md text-nav hover:bg-hover hover:text-foreground"
          >
            <MagnifyingGlass className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
          <nav className="flex flex-col gap-0.5">
            <NavRow href="/" icon={House} label="Home" active={onHome} />
            <NavRow href="/" icon={Users} label="Shared with me" />
            <NavRow href="/" icon={ChatCircle} label="Chat" />
          </nav>

          <div className="mt-5 px-2 text-[11px] font-medium tracking-[0.01em] text-muted-foreground">Favorites</div>
          <div className="mt-1.5">
          {pinnedProfiles.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {pinnedProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={profile.href}
                  className={`flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] ${
                    pathname === profile.href
                      ? "bg-hover text-foreground"
                      : "text-nav hover:bg-hover hover:text-foreground"
                  }`}
                >
                  {profile.kind === "folder" ? (
                    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-muted text-muted-foreground">
                      <FolderSimple className="h-3.5 w-3.5" weight="fill" />
                    </span>
                  ) : (
                    <Avatar
                      name={profile.name}
                      color={profile.color}
                      photoUrl={profile.photoUrl}
                      size={18}
                    />
                  )}
                  <span className="truncate">{profile.name}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="px-2 py-1 text-[12px] text-placeholder">Favorite profiles and folders</div>
          )}
        </div>

          <div className="mt-5 px-2 text-[11px] font-medium tracking-[0.01em] text-muted-foreground">Spaces</div>
          <div className="mb-3 mt-1.5">
          <div
            className={`group flex h-8 items-center rounded-lg px-2 ${
              pathname === "/spaces/my-notes" ? "bg-hover text-foreground" : "text-nav hover:bg-hover"
            }`}
          >
            <button
              type="button"
              aria-label={myNotesExpanded === "1" ? "Collapse My space" : "Expand My space"}
              aria-expanded={myNotesExpanded === "1"}
              onClick={() => setMyNotesExpanded(myNotesExpanded === "1" ? "0" : "1")}
              className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] bg-muted text-muted-foreground"
            >
              <LockSimple className="h-3.5 w-3.5 transition-opacity group-hover:opacity-0" weight="fill" />
              {myNotesExpanded === "1" ? (
                <CaretDown className="absolute h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" weight="bold" />
              ) : (
                <CaretRight className="absolute h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" weight="bold" />
              )}
            </button>
            <Link href="/spaces/my-notes" className="ml-2.5 min-w-0 flex-1 pr-2 text-[13px]">
              <span className="truncate">My space</span>
            </Link>
          </div>

          {myNotesExpanded === "1" ? (
            spacesStatus === "loading" && spaces.length === 0 ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="ml-7 mr-2 my-1 h-6 animate-pulse rounded-md bg-muted/60" />
              ))
            ) : (
              spaces.map((space) => {
                const href = `/spaces/${space.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={space.id}
                    href={href}
                    title={space.name}
                    className={`flex h-8 items-center gap-2.5 rounded-lg pr-2 text-[13px] ${
                      space.parentFolderId ? "pl-12" : "pl-7"
                    } ${
                      active
                        ? "bg-hover text-foreground"
                        : "text-nav hover:bg-hover hover:text-foreground"
                    }`}
                  >
                    <FolderSimple className="h-[18px] w-[18px] shrink-0 text-muted-foreground" weight="fill" />
                    <span className="truncate">{space.name}</span>
                  </Link>
                );
              })
            )
          ) : null}

          <button
            type="button"
            aria-expanded={teamExpanded === "1"}
            onClick={() => setTeamExpanded(teamExpanded === "1" ? "0" : "1")}
            className="group flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-nav hover:bg-hover hover:text-foreground"
          >
            <span className="relative flex h-[18px] w-[18px] shrink-0 items-center justify-center">
              <span className="transition-opacity group-hover:opacity-0">
                <MicroMark />
              </span>
              {teamExpanded === "1" ? (
                <CaretDown className="absolute h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" weight="bold" />
              ) : (
                <CaretRight className="absolute h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" weight="bold" />
              )}
            </span>
            <span className="min-w-0 flex-1 truncate pr-2 text-left text-[13px]">Micro team</span>
          </button>
          {teamExpanded === "1" ? (
            microListsStatus === "loading" && microLists.length === 0 ? (
              Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="ml-7 mr-2 my-1 h-6 animate-pulse rounded-md bg-muted/60" />
              ))
            ) : (
              microLists.map((list) => {
                const href = `/lists/${list.id}`;
                const active = pathname === href;
                return (
                  <Link
                    key={list.id}
                    href={href}
                    title={list.name}
                    className={`flex h-8 items-center gap-2.5 rounded-lg pl-7 pr-2 text-[13px] ${
                      active
                        ? "bg-hover text-foreground"
                        : "text-nav hover:bg-hover hover:text-foreground"
                    }`}
                  >
                    <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center text-[14px]">
                      {list.icon}
                    </span>
                    <span className="truncate">{list.name}</span>
                  </Link>
                );
              })
            )
          ) : null}
          </div>
        </div>

        {agentPromptDismissed !== "1" ? (
          <aside
            aria-label="Connect your agent"
            className="relative mx-0.5 mb-3 rounded-xl border border-border bg-surface p-3"
          >
            <button
              type="button"
              onClick={() => setAgentPromptDismissed("1")}
              aria-label="Dismiss connect your agent"
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-placeholder hover:bg-hover hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <AgentLogos />
            <div className="mt-2 pr-4 text-[13px] font-medium text-foreground">
              Connect your agent
            </div>
            <p className="mt-1 text-[11.5px] leading-[1.45] text-muted-foreground">
              Give any agent access to your meetings &amp; relationships.
            </p>
            <a
              href="https://docs.granola.ai/help-center/sharing/integrations/mcp"
              target="_blank"
              rel="noreferrer"
              className="mt-3 flex h-9 w-full items-center justify-center rounded-full border border-foreground/10 bg-foreground/[0.08] px-3 text-[12.5px] font-medium text-foreground hover:bg-foreground/[0.12]"
            >
              Connect
            </a>
          </aside>
        ) : null}

        <div className="mb-2 flex items-center gap-1 px-1">
          <Link
            href="/"
            aria-label="Explore"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-nav hover:bg-hover hover:text-foreground"
          >
            <SquareSlash className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </Link>
          <Link
            href="/people"
            aria-label="People"
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              onPeople ? "bg-hover text-foreground" : "text-nav hover:bg-hover hover:text-foreground"
            }`}
          >
            <User className="h-[18px] w-[18px]" weight={onPeople ? "fill" : "regular"} />
          </Link>
          <Link
            href="/companies"
            aria-label="Companies"
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              onCompanies ? "bg-hover text-foreground" : "text-nav hover:bg-hover hover:text-foreground"
            }`}
          >
            <Buildings className="h-[18px] w-[18px]" weight={onCompanies ? "fill" : "regular"} />
          </Link>
        </div>

        <div ref={sourceRef} className="relative">
          {sourceOpen ? (
            <div className="absolute inset-x-0 bottom-full mb-1 overflow-hidden rounded-lg border border-border bg-sidebar py-1 shadow-lg">
              {sources.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSource(item.id);
                    setSourceOpen(false);
                  }}
                  className="flex h-8 w-full items-center gap-2 px-2 text-left text-[13px] text-foreground hover:bg-hover"
                >
                  <span className="flex-1">{item.label}</span>
                  {source === item.id ? <Check className="h-3.5 w-3.5 text-muted-foreground" weight="bold" /> : null}
                </button>
              ))}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setSourceOpen((open) => !open)}
            className="flex h-9 w-full items-center gap-2 rounded-lg px-2 text-left hover:bg-hover"
          >
            <MicroMark size={20} />
            <span className="flex-1 text-[13px] font-medium text-foreground">{sourceLabel}</span>
            <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
          </button>
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
