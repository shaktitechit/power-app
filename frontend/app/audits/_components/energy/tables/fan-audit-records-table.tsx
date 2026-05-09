"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeFanAuditRecordsKpis } from "./kpis/fan-audit-records-kpis";

export function FanAuditRecordsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeFanAuditRecordsKpis}
    />
  );
}
