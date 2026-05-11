"use client";

import {
  NestedDatasetEmptyMessage,
  NestedDatasetExpectedArrayMessage,
  NestedDatasetRawJsonPanel,
} from "./audit-snapshot-nested-panel-shared";
import type { NestedDatasetSpec } from "./audit-snapshot-nested-sidebar";
import { shouldUseNestedRecordsTable } from "../shared/audit-snapshot-table-utils";
import { AuditSnapshotDocumentsGallery } from "../shared/audit-snapshot-documents-gallery";

import { TariffsTable } from "./tables/tariffs-table";
import { BillingRecordsTable } from "./tables/billing-records-table";
import { SolarPlantsTable } from "./tables/solar-plants-table";
import { DgSetsTable } from "./tables/dg-sets-table";
import { TransformersTable } from "./tables/transformers-table";
import { PumpsTable } from "./tables/pumps-table";
import { HvacAuditsTable } from "./tables/hvac-audits-table";
import { LightingAuditsTable } from "./tables/lighting-audits-table";
import { LuxMeasurementsTable } from "./tables/lux-measurements-table";
import { MiscLoadAuditsTable } from "./tables/misc-load-audits-table";
import { AcAuditRecordsTable } from "./tables/ac-audit-records-table";
import { FanAuditRecordsTable } from "./tables/fan-audit-records-table";
import { UtilityAccountsTable } from "./tables/utility-accounts-table";
import { BaseEnergyTable } from "./tables/base-energy-table";

type AuditSnapshotEnergyNestedPanelProps = {
  title: string;
  datasetKey: string;
  data: unknown;
  includeUtilityAccountNumberColumn?: boolean;
};

/** Electrical Energy snapshot: tabular panel + emerald-themed nested grid when applicable. */
export function AuditSnapshotEnergyNestedPanel({
  title,
  datasetKey,
  data,
  includeUtilityAccountNumberColumn = false,
}: AuditSnapshotEnergyNestedPanelProps) {
  if (!Array.isArray(data)) {
    return <NestedDatasetExpectedArrayMessage title={title} />;
  }

  if (data.length === 0) {
    return <NestedDatasetEmptyMessage title={title} />;
  }

  if (datasetKey === "documents") {
    return <AuditSnapshotDocumentsGallery documents={data as any[]} />;
  }

  const useTable = shouldUseNestedRecordsTable(data);

  if (!useTable) {
    return <NestedDatasetRawJsonPanel data={data} />;
  }

  const props = {
    rows: data,
    includeUtilityAccountNumberColumn,
  };

  switch (datasetKey) {
    case "tariffs":
      return <TariffsTable {...props} />;
    case "billing_records":
      return <BillingRecordsTable {...props} />;
    case "solar_plants":
      return <SolarPlantsTable {...props} />;
    case "dg_sets":
      return <DgSetsTable {...props} />;
    case "transformers":
      return <TransformersTable {...props} />;
    case "pumps":
      return <PumpsTable {...props} />;
    case "hvac_audits":
      return <HvacAuditsTable {...props} />;
    case "lighting_audits":
      return <LightingAuditsTable {...props} />;
    case "lux_measurements":
      return <LuxMeasurementsTable {...props} />;
    case "misc_load_audits":
      return <MiscLoadAuditsTable {...props} />;
    case "ac_audit_records":
      return <AcAuditRecordsTable {...props} />;
    case "fan_audit_records":
      return <FanAuditRecordsTable {...props} />;
    case "utility_accounts":
      return <UtilityAccountsTable {...props} />;
    default:
      return <BaseEnergyTable {...props} />;
  }
}

type AuditSnapshotEnergyNestedDatasetBodyProps = {
  items: NestedDatasetSpec[];
  selectedKey: string;
  includeUtilityAccountNumberColumn?: boolean;
};

/** Active Electrical Energy dataset — sidebar selection resolved here. */
export function AuditSnapshotEnergyNestedDatasetBody({
  items,
  selectedKey,
  includeUtilityAccountNumberColumn = false,
}: AuditSnapshotEnergyNestedDatasetBodyProps) {
  if (!items.length) {
    return (
      <div className="flex min-h-[min(50vh,24rem)] flex-1 items-center justify-center rounded-lg border border-dashed border-border px-3 py-10 text-center text-sm text-muted-foreground sm:px-4">
        No nested sections in this snapshot.
      </div>
    );
  }

  const resolvedKey =
    selectedKey && items.some((t) => t.key === selectedKey)
      ? selectedKey
      : items[0].key;
  const tab = items.find((t) => t.key === resolvedKey) ?? items[0];

  return (
    <div className="min-h-0 min-w-0 flex-1 flex flex-col h-full">
      <AuditSnapshotEnergyNestedPanel
        title={tab.label ?? tab.key}
        datasetKey={tab.key}
        data={tab.data}
        includeUtilityAccountNumberColumn={includeUtilityAccountNumberColumn}
      />
    </div>
  );
}
