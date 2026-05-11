"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  FacilityAuditEnergyUtilityNest,
  FacilityAuditSnapshotEnergyData,
} from "@/store/slices/auditApiSlice";

import {
  ALL_UTILITY_ACCOUNTS_VALUE,
  AuditSnapshotExplorerChrome,
} from "./audit-snapshot-explorer-chrome";
import { AuditSnapshotEnergyNestedDatasetBody } from "./audit-snapshot-energy-nested-dataset";
import {
  filterNestedDatasetsWithData,
} from "./audit-snapshot-nested-sidebar";
import { useSyncNestedDatasetKey } from "./use-sync-nested-dataset-key";
import {
  getUtilityAccountId,
  getUtilityAccountNumber,
} from "./audit-snapshot-utility-sidebar";
import { humanizeNestedKey, extractAllDocuments } from "../shared/audit-snapshot-table-utils";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

const ENERGY_NEST_KEYS: (keyof Omit<
  FacilityAuditEnergyUtilityNest,
  "utility_account"
>)[] = [
  "tariffs",
  "billing_records",
  "solar_plants",
  "dg_sets",
  "transformers",
  "pumps",
  "hvac_audits",
  "lighting_audits",
  "lux_measurements",
  "misc_load_audits",
  "ac_audit_records",
  "fan_audit_records",
];

function countNestedEnergyEquipmentAuditRecords(
  e: FacilityAuditEnergyUtilityNest,
): number {
  let n = 0;
  for (const plant of e.solar_plants || []) {
    const recs = (plant as { solar_generation_records?: unknown[] })
      .solar_generation_records;
    if (Array.isArray(recs)) n += recs.length;
  }
  for (const dg of e.dg_sets || []) {
    const recs = (dg as { dg_audit_records?: unknown[] }).dg_audit_records;
    if (Array.isArray(recs)) n += recs.length;
  }
  for (const t of e.transformers || []) {
    const recs = (t as { transformer_audit_records?: unknown[] })
      .transformer_audit_records;
    if (Array.isArray(recs)) n += recs.length;
  }
  for (const p of e.pumps || []) {
    const recs = (p as { pump_audit_records?: unknown[] }).pump_audit_records;
    if (Array.isArray(recs)) n += recs.length;
  }
  return n;
}

function mergeEnergyNestField(
  accounts: FacilityAuditEnergyUtilityNest[],
  key: (typeof ENERGY_NEST_KEYS)[number],
): unknown[] {
  return accounts.flatMap((row) => {
    const v = row[key];
    if (!Array.isArray(v)) return [];
    const utilityAccountNumber = getUtilityAccountNumber(row.utility_account);
    return v.map((item) => {
      if (!isPlainObject(item)) return item;
      const cur = item.utility_account_number;
      if (typeof cur === "string" && cur.trim()) return item;
      return { ...item, utility_account_number: utilityAccountNumber };
    });
  });
}

export type AuditSnapshotEnergyExplorerProps = {
  snapshot: FacilityAuditSnapshotEnergyData;
};

/** Electrical Energy Audit snapshot browser (datasets + nested equipment grids). */
export function AuditSnapshotEnergyExplorer({
  snapshot,
}: AuditSnapshotEnergyExplorerProps) {
  const [selectedUtilityAccountId, setSelectedUtilityAccountId] =
    useState("");
  const [activeNestedKey, setActiveNestedKey] = useState("");

  useEffect(() => {
    const rows = snapshot.utility_accounts;
    if (!rows.length) {
      setSelectedUtilityAccountId("");
      return;
    }
    setSelectedUtilityAccountId(getUtilityAccountId(rows[0].utility_account));
  }, [snapshot]);

  const recordTotals = useMemo(() => {
    const out: Record<string, number> = {};
    for (const row of snapshot.utility_accounts) {
      const id = getUtilityAccountId(row.utility_account);
      if (!id) continue;
      const e = row as FacilityAuditEnergyUtilityNest;
      let sum = countNestedEnergyEquipmentAuditRecords(e);
      for (const k of ENERGY_NEST_KEYS) {
        sum += Array.isArray(e[k]) ? e[k].length : 0;
      }
      out[id] = sum;
    }
    return out;
  }, [snapshot]);

  const selectedRow = useMemo(() => {
    if (selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE)
      return undefined;
    return snapshot.utility_accounts.find(
      (r) => getUtilityAccountId(r.utility_account) === selectedUtilityAccountId,
    );
  }, [snapshot.utility_accounts, selectedUtilityAccountId]);

  const nestedDatasets = useMemo(() => {
    const accounts = snapshot.utility_accounts as FacilityAuditEnergyUtilityNest[];
    let raw: { key: string; data: unknown }[];

    if (selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE) {
      const allDocs = accounts.flatMap((a) => {
        const uan = (a.utility_account as any)?.account_number || "";
        return extractAllDocuments(a, uan);
      });
      raw = [
        { key: "utility_accounts", label: "Utility Accounts", data: accounts.map(a => a.utility_account) },
        ...ENERGY_NEST_KEYS.map((key) => ({
          key,
          data: mergeEnergyNestField(accounts, key),
        })),
        { key: "documents", label: "Documents", data: allDocs },
      ];
    } else if (selectedRow) {
      const e = selectedRow as FacilityAuditEnergyUtilityNest;
      const uan = (e.utility_account as any)?.account_number || "";
      const docs = extractAllDocuments(e, uan);
      raw = [
        { key: "utility_accounts", label: "Utility Account Details", data: [e.utility_account] },
        ...ENERGY_NEST_KEYS.map((key) => ({
          key,
          data: e[key],
        })),
        { key: "documents", label: "Documents", data: docs },
      ];
    } else {
      raw = [];
    }

    return filterNestedDatasetsWithData(raw);
  }, [
    selectedRow,
    snapshot.utility_accounts,
    selectedUtilityAccountId,
  ]);

  useSyncNestedDatasetKey(nestedDatasets, setActiveNestedKey);

  const grandRecordTotal = useMemo(() => {
    return Object.values(recordTotals).reduce((sum, n) => sum + n, 0);
  }, [recordTotals]);

  return (
    <AuditSnapshotExplorerChrome
      utilityAccounts={snapshot.utility_accounts}
      recordTotals={recordTotals}
      grandRecordTotal={grandRecordTotal}
      selectedUtilityAccountId={selectedUtilityAccountId}
      onSelectedUtilityAccountId={setSelectedUtilityAccountId}
      nestedDatasets={nestedDatasets}
      activeNestedKey={activeNestedKey}
      onActiveNestedKey={setActiveNestedKey}
      datasetBody={
        <AuditSnapshotEnergyNestedDatasetBody
          items={nestedDatasets}
          selectedKey={activeNestedKey}
          includeUtilityAccountNumberColumn={
            selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE
          }
        />
      }
    />
  );
}
