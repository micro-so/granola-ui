"use client";

import {
  createContext,
  useCallback,
  useContext,
  type ReactNode,
} from "react";
import { useStoredString } from "@/lib/use-stored-string";

export type DataSource = "placeholder" | "micro";

const STORAGE_KEY = "granola-ui:data-source";

type DataSourceContextValue = {
  source: DataSource;
  setSource: (source: DataSource) => void;
};

const DataSourceContext = createContext<DataSourceContextValue | null>(null);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [storedSource, setStoredSource] = useStoredString(STORAGE_KEY, "placeholder");
  const source: DataSource = storedSource === "micro" ? "micro" : "placeholder";

  const setSource = useCallback((next: DataSource) => {
    setStoredSource(next);
  }, [setStoredSource]);

  return (
    <DataSourceContext.Provider value={{ source, setSource }}>
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const value = useContext(DataSourceContext);
  if (!value) {
    throw new Error("useDataSource must be used within DataSourceProvider");
  }
  return value;
}
