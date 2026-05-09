"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeMiscLoadAuditsKpis } from "./kpis/misc-load-audits-kpis";

export function MiscLoadAuditsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeMiscLoadAuditsKpis}
    />
  );
}
