"use client";

import { useMemo } from "react";
import { useStoredString } from "@/lib/use-stored-string";

export type FolderProperties = {
  name: string;
  description: string;
  parentFolder: string;
  subfolders: string[];
  sharing: "private" | "selected" | "team";
  folderType: "manual" | "automatic";
  includeConnectedObjects: boolean;
};

export function useFolderProperties(
  id: string,
  defaults: FolderProperties,
) {
  const [stored, setStored] = useStoredString(
    `granola-ui:folder-properties:${id}`,
  );
  const properties = useMemo(() => {
    if (!stored) return defaults;
    try {
      const parsed = JSON.parse(stored) as Partial<FolderProperties>;
      return {
        ...defaults,
        ...parsed,
        subfolders: Array.isArray(parsed.subfolders)
          ? parsed.subfolders.filter(
              (item): item is string => typeof item === "string",
            )
          : defaults.subfolders,
      };
    } catch {
      return defaults;
    }
  }, [defaults, stored]);

  return {
    properties,
    saveProperties: (next: FolderProperties) =>
      setStored(JSON.stringify(next)),
  };
}
