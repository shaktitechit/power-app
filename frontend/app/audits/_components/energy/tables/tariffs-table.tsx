"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeTariffsKpis } from "./kpis/tariffs-kpis";

export function TariffsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeTariffsKpis}
    />
  );
}
