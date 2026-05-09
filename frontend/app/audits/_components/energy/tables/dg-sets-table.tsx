"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeDgSetsKpis } from "./kpis/dg-sets-kpis";

export function DgSetsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeDgSetsKpis}
    />
  );
}
