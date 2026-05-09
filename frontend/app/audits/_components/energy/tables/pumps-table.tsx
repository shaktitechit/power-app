"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computePumpsKpis } from "./kpis/pumps-kpis";

export function PumpsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computePumpsKpis}
    />
  );
}
