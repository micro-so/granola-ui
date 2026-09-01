import { House } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { BackPill, ContentColumn } from "@/components/chrome";
import { GranolaShell } from "@/components/granola-shell";

export function ProfileFrame({
  backHref,
  backLabel,
  children,
}: {
  backHref: string;
  backLabel: string;
  children: ReactNode;
}) {
  return (
    <GranolaShell>
      <div className="relative flex h-full min-h-0 flex-col">
        <BackPill
          href={backHref}
          label={backLabel}
          className="absolute left-4 top-4 z-10"
        >
          <House className="h-3.5 w-3.5" />
        </BackPill>
        <ContentColumn className="flex h-full min-h-0 flex-col pt-16">{children}</ContentColumn>
      </div>
    </GranolaShell>
  );
}

export function ProfileHeader({
  name,
  children,
  avatar,
}: {
  name: string;
  children: ReactNode;
  avatar: ReactNode;
}) {
  return (
    <>
      <div className="flex items-center gap-3">
        {avatar}
        <h1 className="font-serif text-[28px] font-normal leading-none tracking-[-0.02em] text-heading">{name}</h1>
      </div>
      <div className="mt-2.5 flex flex-col gap-1 text-[13px] text-muted-foreground">{children}</div>
    </>
  );
}
