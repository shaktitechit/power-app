"use client";

import {
  AuditSnapshotNestedRecordsTable,
  type AuditSnapshotNestedRecordsTableProps,
} from "./audit-snapshot-nested-records-table";

export type AuditSnapshotSafetyNestedRecordsTableProps = Omit<
  AuditSnapshotNestedRecordsTableProps,
  "snapshotProgram"
>;

/** Electrical Safety snapshot datasets — uses amber/caution chrome in `AuditSnapshotNestedRecordsTable`. Pass `className` to extend the outer shell. */
export function AuditSnapshotSafetyNestedRecordsTable(
  props: AuditSnapshotSafetyNestedRecordsTableProps,
) {
  return (
    <AuditSnapshotNestedRecordsTable
      {...props}
      snapshotProgram="electrical_safety"
    />
  );
}

