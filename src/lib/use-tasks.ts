"use client";

import { placeholderTasks, tasksForCompany, tasksForPerson, type ProfileTask } from "@/lib/data";
import { useMicroList } from "@/lib/use-micro-list";

export function useTasks(
  options: { personId?: string; companyId?: string; q?: string; enabled?: boolean } = {},
) {
  const placeholder = options.personId
    ? tasksForPerson(options.personId)
    : options.companyId
      ? tasksForCompany(options.companyId)
      : placeholderTasks;

  return useMicroList<ProfileTask>({
    path: "/api/tasks",
    params: { personId: options.personId, companyId: options.companyId, q: options.q },
    placeholder,
    enabled: options.enabled,
  });
}
