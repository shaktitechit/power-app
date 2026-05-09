"use client";

import { useMemo } from "react";
import { BaseEnergyTable, type BaseEnergyTableProps } from "./base-energy-table";
import { computeUtilityAccountsKpis } from "./kpis/utility-accounts-kpis";
import { inferColumns } from "../../shared/audit-snapshot-table-utils";

const EXCLUDED_COLUMNS = new Set([
  "utility_account_number",
  "is_solar_connected",
  "is_dg_connected",
  "is_transformer_connected",
  "is_pump_connected",
  "is_transformer_maintained_by_facility",
  "is_active",
  "provider",
  "audit_step_no_data",
  "audit_step_submissions",
]);

export function UtilityAccountsTable(props: BaseEnergyTableProps) {
  const overrideColumns = useMemo(() => {
    if (props.overrideColumns && props.overrideColumns.length > 0) return props.overrideColumns;
    const allCols = inferColumns(props.rows, { omitNestedAuditArrays: true });
    return allCols.filter(c => !EXCLUDED_COLUMNS.has(c));
  }, [props.rows, props.overrideColumns]);

  return (
    <BaseEnergyTable
      {...props}
      overrideColumns={overrideColumns}
      computeKpiSections={computeUtilityAccountsKpis}
    />
  );
}
