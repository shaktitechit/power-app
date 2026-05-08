"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Maximize2, Minimize2 } from "lucide-react";

import { AuditExplorerExpandedProvider } from "../audit-snapshot-explorer-layout-context";
import type { NestedDatasetSpec } from "./audit-snapshot-nested-sidebar";
import { AuditSnapshotNestedDataSidebar } from "./audit-snapshot-nested-sidebar";
import {
  getUtilityAccountId,
  getUtilityAccountNumber,
} from "./audit-snapshot-utility-sidebar";

/** Sentinel Select value: merge every utility account’s datasets. */
export const ALL_UTILITY_ACCOUNTS_VALUE = "__all_utility_accounts__";

export type AuditSnapshotExplorerChromeProps = {
  utilityAccounts: Array<{ utility_account: unknown }>;
  recordTotals: Record<string, number>;
  grandRecordTotal: number;
  selectedUtilityAccountId: string;
  onSelectedUtilityAccountId: (id: string) => void;
  nestedDatasets: NestedDatasetSpec[];
  activeNestedKey: string;
  onActiveNestedKey: (key: string) => void;
  datasetBody: ReactNode;
  emptyAccountsMessage?: string;
};

/** Shared shell: utility account header, dataset sidebar, and program-specific body slot. */
export function AuditSnapshotExplorerChrome({
  utilityAccounts,
  recordTotals,
  grandRecordTotal,
  selectedUtilityAccountId,
  onSelectedUtilityAccountId,
  nestedDatasets,
  activeNestedKey,
  onActiveNestedKey,
  datasetBody,
  emptyAccountsMessage = "This snapshot has no utility accounts.",
}: AuditSnapshotExplorerChromeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const showAllAccountsOption = utilityAccounts.length > 1;

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isExpanded]);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const selectedTotal =
    selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE
      ? grandRecordTotal
      : selectedUtilityAccountId &&
          typeof recordTotals[selectedUtilityAccountId] === "number"
        ? recordTotals[selectedUtilityAccountId]
        : undefined;

  if (!utilityAccounts.length) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        {emptyAccountsMessage}
      </div>
    );
  }

  const shell = (
    <div
      className={cn(
        "flex min-w-0 max-w-full flex-col overflow-hidden border border-border bg-card shadow-sm",
        isExpanded
          ? "h-full max-h-full min-h-0 flex-1 rounded-none sm:rounded-xl"
          : "min-h-[min(72vh,42rem)] rounded-xl",
      )}
    >
      <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-muted/15 px-3 py-3 sm:flex-row sm:items-end sm:justify-between sm:px-4">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="audit-snapshot-utility-account">
            Utility account
          </Label>
          <Select
            value={selectedUtilityAccountId || undefined}
            onValueChange={onSelectedUtilityAccountId}
          >
            <SelectTrigger
              id="audit-snapshot-utility-account"
              className="h-auto min-h-10 w-full min-w-0 max-w-full py-2"
            >
              <SelectValue placeholder="Select utility account" />
            </SelectTrigger>
            <SelectContent
              className={cn(isExpanded && "z-[110]")}
            >
              {showAllAccountsOption ? (
                <SelectItem value={ALL_UTILITY_ACCOUNTS_VALUE}>
                  All utility accounts · {grandRecordTotal} records
                </SelectItem>
              ) : null}
              {utilityAccounts.map((row) => {
                const id = getUtilityAccountId(row.utility_account);
                if (!id) return null;
                const label = getUtilityAccountNumber(row.utility_account);
                const total = recordTotals[id];
                return (
                  <SelectItem key={id} value={id}>
                    {label}
                    {typeof total === "number" ? ` · ${total} records` : ""}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-end sm:gap-3">
          {typeof selectedTotal === "number" ? (
            <p className="break-words text-xs tabular-nums text-muted-foreground sm:max-w-[min(100%,20rem)] sm:pb-2 sm:text-right">
              {selectedTotal} nested record{selectedTotal === 1 ? "" : "s"}
              {selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE
                ? " · merged across accounts"
                : ""}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 w-full shrink-0 gap-1.5 sm:w-auto"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? "Exit full screen audit view"
                : "Expand audit view to full screen"
            }
            onClick={() => setIsExpanded((v) => !v)}
          >
            {isExpanded ? (
              <Minimize2 className="size-4 shrink-0" aria-hidden />
            ) : (
              <Maximize2 className="size-4 shrink-0" aria-hidden />
            )}
            <span className="hidden sm:inline">
              {isExpanded ? "Minimize" : "Expand"}
            </span>
            <span className="sm:hidden">
              {isExpanded ? "Exit" : "Full screen"}
            </span>
          </Button>
        </div>
      </header>

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:flex-row",
          isExpanded
            ? "min-h-0 flex-1"
            : "lg:min-h-[min(60vh,36rem)]",
        )}
      >
        <AuditSnapshotNestedDataSidebar
          items={nestedDatasets}
          selectedKey={activeNestedKey}
          onSelectKey={onActiveNestedKey}
        />
        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col p-3 sm:p-4 lg:min-h-0",
            isExpanded
              ? "min-h-0 overflow-auto overscroll-contain [-webkit-overflow-scrolling:touch]"
              : "min-h-[min(40vh,24rem)]",
          )}
        >
          {datasetBody}
        </div>
      </div>
    </div>
  );

  return (
    <AuditExplorerExpandedProvider value={isExpanded}>
      {isExpanded ? (
        <div
          className="fixed inset-0 z-[100] flex max-h-dvh min-h-0 flex-col overflow-hidden bg-background p-0 sm:p-3 md:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Audit data — full screen"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {shell}
          </div>
        </div>
      ) : (
        shell
      )}
    </AuditExplorerExpandedProvider>
  );
}
