"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeAcAuditRecordsKpis } from "./kpis/ac-audit-records-kpis";

export function AcAuditRecordsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeAcAuditRecordsKpis}
    />
  );
}
