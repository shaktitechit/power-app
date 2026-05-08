"use client";

import { AuditSnapshotEnergyNestedRecordsTable } from "../audit-snapshot-energy-nested-records-table";
import {
  NestedDatasetEmptyMessage,
  NestedDatasetExpectedArrayMessage,
  NestedDatasetRawJsonPanel,
} from "../audit-snapshot-nested-panel-shared";
import type { NestedDatasetSpec } from "../audit-snapshot-nested-sidebar";
import {
  shouldUseNestedRecordsTable,
} from "../audit-snapshot-nested-records-table";

type AuditSnapshotEnergyNestedPanelProps = {
  title: string;
  data: unknown;
};

/** Electrical Energy snapshot: tabular panel + emerald-themed nested grid when applicable. */
export function AuditSnapshotEnergyNestedPanel({
  title,
  data,
}: AuditSnapshotEnergyNestedPanelProps) {
  if (!Array.isArray(data)) {
    return <NestedDatasetExpectedArrayMessage title={title} />;
  }

  if (data.length === 0) {
    return <NestedDatasetEmptyMessage title={title} />;
  }

  const useTable = shouldUseNestedRecordsTable(data);

  if (!useTable) {
    return <NestedDatasetRawJsonPanel data={data} />;
  }

  return <AuditSnapshotEnergyNestedRecordsTable rows={data} />;
}

type AuditSnapshotEnergyNestedDatasetBodyProps = {
  items: NestedDatasetSpec[];
  selectedKey: string;
};

/** Active Electrical Energy dataset — sidebar selection resolved here. */
export function AuditSnapshotEnergyNestedDatasetBody({
  items,
  selectedKey,
}: AuditSnapshotEnergyNestedDatasetBodyProps) {
  if (!items.length) {
    return (
      <div className="flex min-h-[min(50vh,24rem)] flex-1 items-center justify-center rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        No nested sections in this snapshot.
      </div>
    );
  }

  const resolvedKey =
    selectedKey && items.some((t) => t.key === selectedKey)
      ? selectedKey
      : items[0].key;
  const tab = items.find((t) => t.key === resolvedKey) ?? items[0];

  return (
    <div className="min-h-0 min-w-0 flex-1">
      <AuditSnapshotEnergyNestedPanel
        title={tab.label ?? tab.key}
        data={tab.data}
      />
    </div>
  );
}
