"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeLuxMeasurementsKpis } from "./kpis/lux-measurements-kpis";

export function LuxMeasurementsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeLuxMeasurementsKpis}
    />
  );
}
