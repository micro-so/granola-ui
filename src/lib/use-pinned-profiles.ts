"use client";

import { useCallback, useMemo } from "react";
import { useStoredString } from "@/lib/use-stored-string";

const STORAGE_KEY = "granola-ui:pinned-profiles";

export type PinnedProfile = {
  id: string;
  name: string;
  href: string;
  photoUrl?: string;
  color?: string;
  kind?: "person" | "company" | "folder";
};

function parseProfiles(value: string): PinnedProfile[] {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PinnedProfile =>
        Boolean(
          item &&
            typeof item === "object" &&
            "id" in item &&
            typeof item.id === "string" &&
            "name" in item &&
            typeof item.name === "string" &&
            "href" in item &&
            typeof item.href === "string",
        ),
    );
  } catch {
    return [];
  }
}

export function usePinnedProfiles() {
  const [stored, setStored] = useStoredString(STORAGE_KEY, "[]");
  const profiles = useMemo(() => parseProfiles(stored), [stored]);

  const pinProfile = useCallback(
    (profile: PinnedProfile) => {
      const next = [profile, ...profiles.filter((item) => item.href !== profile.href)];
      setStored(JSON.stringify(next));
    },
    [profiles, setStored],
  );

  const unpinProfile = useCallback(
    (href: string) => {
      setStored(JSON.stringify(profiles.filter((profile) => profile.href !== href)));
    },
    [profiles, setStored],
  );

  return {
    profiles,
    pinProfile,
    unpinProfile,
    isPinned: (href: string) => profiles.some((profile) => profile.href === href),
  };
}
