"use client";

import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeBillingRecordsKpis } from "./kpis/billing-records-kpis";

export function BillingRecordsTable(props: BaseEnergyTableProps) {
  return (
    <BaseEnergyTable
      {...props}
      computeKpiSections={computeBillingRecordsKpis}
    />
  );
}
