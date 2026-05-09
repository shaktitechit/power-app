"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeHvacAuditsKpis } from "./kpis/hvac-audits-kpis";

export function HvacAuditsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeHvacAuditsKpis}
    />
  );
}
