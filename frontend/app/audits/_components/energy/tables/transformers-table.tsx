"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeTransformersKpis } from "./kpis/transformers-kpis";

export function TransformersTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeTransformersKpis}
    />
  );
}
