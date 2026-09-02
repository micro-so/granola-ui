"use client";

import { CopySimple, DotsThree, PencilSimple, ShareNetwork, Star, Trash } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ProfileEditorDialog } from "@/components/profile-editor-dialog";
import type { Company, Person } from "@/lib/data";
import { usePinnedProfiles } from "@/lib/use-pinned-profiles";

type ProfileActionsMenuProps =
  | { profileType: "person"; profile: Person }
  | { profileType: "company"; profile: Company };

export function ProfileActionsMenu(props: ProfileActionsMenuProps) {
  const { profileType, profile } = props;
  const profileId = profile.id;
  const name = profile.name;
  const photoUrl = profileType === "person" ? profile.photoUrl : profile.logoUrl;
  const avatarColor = profileType === "person" ? profile.avatarColor : profile.logoColor;
  const { isPinned, pinProfile, unpinProfile } = usePinnedProfiles();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileHref = `/${profileType === "person" ? "people" : "companies"}/${profileId}`;
  const favorite = isPinned(profileHref);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const profileUrl = () => window.location.href;

  async function copyProfileLink() {
    await navigator.clipboard.writeText(profileUrl());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function shareProfile() {
    try {
      const url = profileUrl();
      if (navigator.share) {
        await navigator.share({ title: name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      throw error;
    }
  }

  return (
    <>
      <div ref={menuRef} className="fixed right-4 top-4 z-30 flex items-center gap-1">
        <button
          type="button"
          aria-label="Profile actions"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-hover hover:text-foreground"
        >
          <DotsThree className="h-5 w-5" weight="bold" />
        </button>
        <button
          type="button"
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          title={favorite ? "Remove from favorites" : "Add to favorites"}
          onClick={() => {
            if (favorite) {
              unpinProfile(profileHref);
            } else {
              pinProfile({
                id: `${profileType}:${profileId}`,
                name,
                href: profileHref,
                photoUrl,
                color: avatarColor,
                kind: profileType,
              });
            }
          }}
          className={`flex h-8 w-8 items-center justify-center rounded-full hover:bg-hover ${
            favorite ? "text-[#b6cf3a]" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star className="h-5 w-5" weight={favorite ? "fill" : "regular"} />
        </button>

        {open ? (
          <div
            role="menu"
            className="absolute right-0 top-full z-40 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-2xl"
          >
            <MenuButton
              icon={<CopySimple className="h-4 w-4" />}
              onClick={() => {
                void copyProfileLink();
                setOpen(false);
              }}
            >
              {copied ? "Link copied" : "Copy profile link"}
            </MenuButton>
            <MenuButton
              icon={<PencilSimple className="h-4 w-4" />}
              onClick={() => {
                setEditing(true);
                setOpen(false);
              }}
            >
              Edit
            </MenuButton>
            <MenuButton
              icon={<ShareNetwork className="h-4 w-4" />}
              onClick={() => {
                void shareProfile();
                setOpen(false);
              }}
            >
              Share
            </MenuButton>
            {profileType === "person" ? (
              <>
                <div className="my-1 border-t border-border" />
                <MenuButton
                  destructive
                  icon={<Trash className="h-4 w-4" />}
                  onClick={() => {
                    setConfirmingRemove(true);
                    setOpen(false);
                  }}
                >
                  Remove
                </MenuButton>
              </>
            ) : null}
          </div>
        ) : null}
      </div>

      {editing ? (
        <ProfileEditorDialog
          profileType={profileType}
          profile={profile}
          onClose={() => setEditing(false)}
        />
      ) : null}
      {confirmingRemove && profileType === "person" ? (
        <RemoveProfileDialog
          personId={profileId}
          name={name}
          onRemoved={() => unpinProfile(profileHref)}
          onClose={() => setConfirmingRemove(false)}
        />
      ) : null}
      {copied ? (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-foreground shadow-xl"
        >
          Profile link copied
        </div>
      ) : null}
    </>
  );
}

function MenuButton({
  children,
  icon,
  onClick,
  destructive = false,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] ${
        destructive
          ? "text-[#ff9180] hover:bg-[#ff9180]/10"
          : "text-foreground hover:bg-hover"
      }`}
    >
      <span className="text-current">{icon}</span>
      {children}
    </button>
  );
}

function RemoveProfileDialog({
  personId,
  name,
  onRemoved,
  onClose,
}: {
  personId: string;
  name: string;
  onRemoved: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState("");

  async function remove() {
    setRemoving(true);
    setError("");
    try {
      const response = await fetch(`/api/people?id=${encodeURIComponent(personId)}`, { method: "DELETE" });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message || "Could not remove profile.");
      onRemoved();
      router.push("/people");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not remove profile.");
      setRemoving(false);
    }
  }

  return (
    <Dialog title="Remove profile?" onClose={onClose}>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        This will remove {name} from Micro. This action cannot be undone.
      </p>
      {error ? <p className="mt-3 text-[12px] text-[#ff9180]">{error}</p> : null}
      <div className="mt-5 flex justify-end gap-2">
        <DialogButton onClick={onClose}>Cancel</DialogButton>
        <DialogButton destructive disabled={removing} onClick={() => void remove()}>
          {removing ? "Removing…" : "Remove"}
        </DialogButton>
      </div>
    </Dialog>
  );
}

function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-[16px] font-medium text-foreground">{title}</h2>
        {children}
      </div>
    </div>
  );
}

function DialogButton({
  children,
  onClick,
  disabled = false,
  primary = false,
  destructive = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-[13px] disabled:opacity-50 ${
        destructive
          ? "bg-[#ff9180] text-[#24110d]"
          : primary
            ? "bg-foreground text-background"
            : "bg-hover text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
