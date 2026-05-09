"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeSolarPlantsKpis } from "./kpis/solar-plants-kpis";

export function SolarPlantsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeSolarPlantsKpis}
    />
  );
}
