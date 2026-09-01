"use client";

import {
  Buildings,
  ChatCircle,
  House,
  LockSimple,
  MagnifyingGlass,
  SidebarSimple,
  Users,
  User,
} from "@phosphor-icons/react";
import { ChevronsUpDown, SquareSlash } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

function MicroMark({ size = 18 }: { size?: number }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-[5px] bg-black"
      style={{ width: size, height: size }}
    >
      <span
        className="rounded-full border-[2px] border-[#f3f3f3]"
        style={{ width: size - 5, height: size - 5 }}
      />
    </span>
  );
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

export function GranolaShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const onPeople = pathname.startsWith("/people");
  const onCompanies = pathname.startsWith("/companies");

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

        <nav className="flex flex-col gap-0.5">
          <NavRow href="/" icon={House} label="Home" active={onHome} />
          <NavRow href="/" icon={Users} label="Shared with me" />
          <NavRow href="/" icon={ChatCircle} label="Chat" />
        </nav>

        <div className="mt-5 px-2 text-[11px] font-medium tracking-[0.01em] text-muted-foreground">Spaces</div>
        <div className="mt-1.5 flex flex-col gap-0.5">
          <Link
            href="/"
            className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] text-nav hover:bg-hover hover:text-foreground"
          >
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-[5px] bg-muted">
              <LockSimple className="h-3 w-3 text-foreground" weight="fill" />
            </span>
            My notes
          </Link>
          <Link
            href="/"
            className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] text-nav hover:bg-hover hover:text-foreground"
          >
            <MicroMark />
            Micro team
          </Link>
        </div>

        <div className="flex-1" />

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

        <button
          type="button"
          className="flex h-9 items-center gap-2 rounded-lg px-2 text-left hover:bg-hover"
        >
          <MicroMark size={20} />
          <span className="flex-1 text-[13px] font-medium text-foreground">Micro</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
