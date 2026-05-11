"use client";

import type { FacilityAuditSafetyUtilityNest, FacilityAuditSnapshotSafetyData } from "@/store/slices/auditApiSlice";

import {
  NestedDatasetEmptyMessage,
  NestedDatasetExpectedArrayMessage,
  NestedDatasetRawJsonPanel,
} from "./audit-snapshot-nested-panel-shared";
import type { NestedDatasetSpec } from "./audit-snapshot-nested-sidebar";
import {
  isAuditSnapshotPlainObject,
  SafetyAuditSectionRecordsView,
} from "./audit-snapshot-safety-record-box";

import { AuditSnapshotDocumentsGallery } from "../shared/audit-snapshot-documents-gallery";

type AuditSnapshotSafetyNestedPanelProps = {
  title: string;
  datasetKey: string;
  data: unknown;
  utilityAccountFullExport?: {
    snapshot: FacilityAuditSnapshotSafetyData;
    utilityNest: FacilityAuditSafetyUtilityNest;
  } | null;
};

/** Electrical Safety snapshot: document-style box per record; nested arrays of objects as tables. */
export function AuditSnapshotSafetyNestedPanel({
  title,
  datasetKey,
  data,
  utilityAccountFullExport = null,
}: AuditSnapshotSafetyNestedPanelProps) {
  if (!Array.isArray(data)) {
    return <NestedDatasetExpectedArrayMessage title={title} />;
  }

  if (data.length === 0) {
    return <NestedDatasetEmptyMessage title={title} />;
  }

  if (datasetKey === "documents") {
    return <AuditSnapshotDocumentsGallery documents={data as any[]} />;
  }

  const allPlainObjects = data.every(
    (row) => row === null || isAuditSnapshotPlainObject(row),
  );
  if (!allPlainObjects) {
    return <NestedDatasetRawJsonPanel data={data} />;
  }

  return (
    <SafetyAuditSectionRecordsView
      sectionTitle={title}
      records={data}
      utilityAccountFullExport={utilityAccountFullExport}
    />
  );
}

type AuditSnapshotSafetyNestedDatasetBodyProps = {
  items: NestedDatasetSpec[];
  selectedKey: string;
  utilityAccountFullExport?: {
    snapshot: FacilityAuditSnapshotSafetyData;
    utilityNest: FacilityAuditSafetyUtilityNest;
  } | null;
};

/** Active Electrical Safety dataset — sidebar selection resolved here. */
export function AuditSnapshotSafetyNestedDatasetBody({
  items,
  selectedKey,
  utilityAccountFullExport = null,
}: AuditSnapshotSafetyNestedDatasetBodyProps) {
  if (!items.length) {
    return (
      <div className="flex min-h-[min(50vh,24rem)] flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground sm:px-4">
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
    <div className="min-h-0 min-w-0 flex-1 flex flex-col h-full">
      <AuditSnapshotSafetyNestedPanel
        title={tab.label ?? tab.key}
        datasetKey={tab.key}
        data={tab.data}
        utilityAccountFullExport={utilityAccountFullExport}
      />
    </div>
  );
}
