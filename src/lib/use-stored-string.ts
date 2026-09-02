"use client";

import { useCallback, useSyncExternalStore } from "react";

export function useStoredString(key: string, fallback = "") {
  const eventName = `stored-string:${key}`;
  const subscribe = useCallback(
    (notify: () => void) => {
      window.addEventListener("storage", notify);
      window.addEventListener(eventName, notify);
      return () => {
        window.removeEventListener("storage", notify);
        window.removeEventListener(eventName, notify);
      };
    },
    [eventName],
  );
  const getSnapshot = useCallback(() => window.localStorage.getItem(key) ?? fallback, [fallback, key]);
  const getServerSnapshot = useCallback(() => fallback, [fallback]);
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const setValue = useCallback(
    (next: string) => {
      window.localStorage.setItem(key, next);
      window.dispatchEvent(new Event(eventName));
    },
    [eventName, key],
  );

  return [value, setValue] as const;
}
