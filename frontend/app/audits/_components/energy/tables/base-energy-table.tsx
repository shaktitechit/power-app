"use client";

import { useMemo } from "react";
import {
  AuditSnapshotNestedRecordsTable,
  type AuditSnapshotNestedRecordsTableProps,
} from "../../shared/audit-snapshot-base-table";
import {
  ConsolidatedEnergyKpiSummaryModal,
  computeConsolidatedEnergyKpiSections,
} from "../audit-snapshot-kpi-summary";
import {
  inferColumns,
  rollupNestedAuditArrays,
} from "../../shared/audit-snapshot-table-utils";

export type BaseEnergyTableProps = Omit<
  AuditSnapshotNestedRecordsTableProps,
  "snapshotProgram" | "exportKpiSections" | "footer"
> & {
  computeKpiSections?: (
    rows: unknown[],
    columns: string[],
  ) => import("../audit-snapshot-kpi-summary").EnergyKpiSection[];
};

export function BaseEnergyTable({
  rows,
  nestedDepth = 0,
  includeUtilityAccountNumberColumn,
  overrideColumns,
  computeKpiSections,
  ...props
}: BaseEnergyTableProps) {
  const inferredColumns = useMemo(() => {
    if (overrideColumns && overrideColumns.length > 0) return overrideColumns;
    return inferColumns(rows, { omitNestedAuditArrays: true });
  }, [rows, overrideColumns]);

  const consolidatedKpiSections = useMemo(() => {
    if (nestedDepth !== 0) return [];
    if (computeKpiSections) return computeKpiSections(rows, inferredColumns);
    return computeConsolidatedEnergyKpiSections(rows, inferredColumns);
  }, [nestedDepth, rows, inferredColumns, computeKpiSections]);

  const nestedAuditRollup = useMemo(() => rollupNestedAuditArrays(rows), [rows]);

  const footer =
    nestedDepth === 0 ? (
      <ConsolidatedEnergyKpiSummaryModal
        sections={consolidatedKpiSections}
        rowCount={rows.length}
        totalColumnCount={inferredColumns.length}
        nestedAuditRollup={nestedAuditRollup}
      />
    ) : null;

  return (
    <AuditSnapshotNestedRecordsTable
      {...props}
      rows={rows}
      nestedDepth={nestedDepth}
      includeUtilityAccountNumberColumn={includeUtilityAccountNumberColumn}
      overrideColumns={overrideColumns}
      snapshotProgram="electrical_energy"
      exportKpiSections={nestedDepth === 0 ? consolidatedKpiSections : undefined}
      footer={footer}
    />
  );
}
