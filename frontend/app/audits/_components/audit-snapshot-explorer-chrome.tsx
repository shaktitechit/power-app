"use client";

import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const showAllAccountsOption = utilityAccounts.length > 1;

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

  return (
    <div className="flex min-h-[min(72vh,42rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-col gap-3 border-b border-border bg-muted/15 px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
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
              className="w-full sm:max-w-md"
            >
              <SelectValue placeholder="Select utility account" />
            </SelectTrigger>
            <SelectContent>
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
        {typeof selectedTotal === "number" ? (
          <p className="shrink-0 text-xs tabular-nums text-muted-foreground sm:pb-2">
            {selectedTotal} nested record{selectedTotal === 1 ? "" : "s"}
            {selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE
              ? " · merged across accounts"
              : ""}
          </p>
        ) : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:min-h-[min(60vh,36rem)]">
        <AuditSnapshotNestedDataSidebar
          items={nestedDatasets}
          selectedKey={activeNestedKey}
          onSelectKey={onActiveNestedKey}
        />
        <div className="flex min-h-[min(40vh,24rem)] min-w-0 flex-1 flex-col p-4 lg:min-h-0">
          {datasetBody}
        </div>
      </div>
    </div>
  );
}
