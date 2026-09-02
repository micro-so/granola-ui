"use client";

import { notes as placeholderNotes, notesForCompany, notesForPerson, type Note } from "@/lib/data";
import { useMicroList } from "@/lib/use-micro-list";

export function useNotes(
  options: {
    personId?: string;
    companyId?: string;
    q?: string;
    all?: boolean;
    enabled?: boolean;
  } = {},
) {
  const placeholder = options.personId
    ? notesForPerson(options.personId)
    : options.companyId
      ? notesForCompany(options.companyId)
      : placeholderNotes;

  return useMicroList<Note>({
    path: "/api/notes",
    params: {
      personId: options.personId,
      companyId: options.companyId,
      q: options.q,
      all: options.all ? "1" : undefined,
      v: "4",
    },
    placeholder,
    enabled: options.enabled,
  });
}
