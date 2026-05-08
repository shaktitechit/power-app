"use client";

import {
  NestedDatasetEmptyMessage,
  NestedDatasetExpectedArrayMessage,
  NestedDatasetRawJsonPanel,
} from "../audit-snapshot-nested-panel-shared";
import type { NestedDatasetSpec } from "../audit-snapshot-nested-sidebar";
import {
  isAuditSnapshotPlainObject,
  SafetyAuditSectionRecordsView,
} from "./audit-snapshot-safety-record-box";

type AuditSnapshotSafetyNestedPanelProps = {
  title: string;
  data: unknown;
};

/** Electrical Safety snapshot: document-style box per record; nested arrays of objects as tables. */
export function AuditSnapshotSafetyNestedPanel({
  title,
  data,
}: AuditSnapshotSafetyNestedPanelProps) {
  if (!Array.isArray(data)) {
    return <NestedDatasetExpectedArrayMessage title={title} />;
  }

  if (data.length === 0) {
    return <NestedDatasetEmptyMessage title={title} />;
  }

  const allPlainObjects = data.every(
    (row) => row === null || isAuditSnapshotPlainObject(row),
  );
  if (!allPlainObjects) {
    return <NestedDatasetRawJsonPanel data={data} />;
  }

  return (
    <SafetyAuditSectionRecordsView sectionTitle={title} records={data} />
  );
}

type AuditSnapshotSafetyNestedDatasetBodyProps = {
  items: NestedDatasetSpec[];
  selectedKey: string;
};

/** Active Electrical Safety dataset — sidebar selection resolved here. */
export function AuditSnapshotSafetyNestedDatasetBody({
  items,
  selectedKey,
}: AuditSnapshotSafetyNestedDatasetBodyProps) {
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
      <AuditSnapshotSafetyNestedPanel
        title={tab.label ?? tab.key}
        data={tab.data}
      />
    </div>
  );
}
