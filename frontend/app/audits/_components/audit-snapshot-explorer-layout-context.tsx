"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

/** True while the audit snapshot explorer is in full-screen (expand) mode. */
const AuditExplorerExpandedContext = createContext(false);

export function AuditExplorerExpandedProvider({
  value,
  children,
}: {
  value: boolean;
  children: ReactNode;
}) {
  return (
    <AuditExplorerExpandedContext.Provider value={value}>
      {children}
    </AuditExplorerExpandedContext.Provider>
  );
}

export function useAuditExplorerExpanded(): boolean {
  return useContext(AuditExplorerExpandedContext);
}
