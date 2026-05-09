"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeLightingAuditsKpis } from "./kpis/lighting-audits-kpis";

export function LightingAuditsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeLightingAuditsKpis}
    />
  );
}
