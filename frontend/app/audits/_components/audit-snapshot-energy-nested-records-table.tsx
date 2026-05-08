"use client";

import {
  AuditSnapshotNestedRecordsTable,
  type AuditSnapshotNestedRecordsTableProps,
} from "./audit-snapshot-nested-records-table";

export type AuditSnapshotEnergyNestedRecordsTableProps = Omit<
  AuditSnapshotNestedRecordsTableProps,
  "snapshotProgram"
>;

/** Electrical Energy snapshot datasets — uses emerald chrome in `AuditSnapshotNestedRecordsTable`. Pass `className` to extend the outer shell. */
export function AuditSnapshotEnergyNestedRecordsTable(
  props: AuditSnapshotEnergyNestedRecordsTableProps,
) {
  return (
    <AuditSnapshotNestedRecordsTable
      {...props}
      snapshotProgram="electrical_energy"
    />
  );
}
