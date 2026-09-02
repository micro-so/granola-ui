"use client";

import type { ReactNode } from "react";
import { DataSourceProvider } from "@/lib/data-source";

export function Providers({ children }: { children: ReactNode }) {
  return <DataSourceProvider>{children}</DataSourceProvider>;
}
