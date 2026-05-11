"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  FacilityAuditSafetyUtilityNest,
  FacilityAuditSnapshotSafetyData,
} from "@/store/slices/auditApiSlice";

import {
  ALL_UTILITY_ACCOUNTS_VALUE,
  AuditSnapshotExplorerChrome,
} from "./audit-snapshot-explorer-chrome";
import { AuditSnapshotSafetyNestedDatasetBody } from "./audit-snapshot-safety-nested-dataset";
import {
  filterNestedDatasetsWithData,
} from "./audit-snapshot-nested-sidebar";
import { useSyncNestedDatasetKey } from "./use-sync-nested-dataset-key";
import {
  getUtilityAccountId,
  getUtilityAccountNumber,
} from "./audit-snapshot-utility-sidebar";
import { extractAllDocuments } from "../shared/audit-snapshot-table-utils";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function mergeSafetyNestedDatasets(
  accounts: FacilityAuditSafetyUtilityNest[],
): { key: string; data: unknown[] }[] {
  const keys = new Set<string>();
  for (const row of accounts) {
    Object.keys(row.safety_sections || {}).forEach((k) => keys.add(k));
  }
  return [...keys]
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({
      key,
      data: accounts.flatMap((row) => {
        const arr = row.safety_sections?.[key];
        if (!Array.isArray(arr)) return [];
        const utilityAccountNumber = getUtilityAccountNumber(row.utility_account);
        return arr.map((rec) => {
          if (!isPlainObject(rec)) return rec;
          const cur = rec.utility_account_number;
          if (typeof cur === "string" && cur.trim()) return rec;
          return { ...rec, utility_account_number: utilityAccountNumber };
        });
      }),
    }));
}

export type AuditSnapshotSafetyExplorerProps = {
  snapshot: FacilityAuditSnapshotSafetyData;
};

/** Electrical Safety Audit snapshot browser (`safety_sections` datasets). */
export function AuditSnapshotSafetyExplorer({
  snapshot,
}: AuditSnapshotSafetyExplorerProps) {
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
      const s = row as FacilityAuditSafetyUtilityNest;
      let sum = 0;
      for (const arr of Object.values(s.safety_sections || {})) {
        sum += Array.isArray(arr) ? arr.length : 0;
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
    const accounts =
      snapshot.utility_accounts as FacilityAuditSafetyUtilityNest[];
    let raw: { key: string; data: unknown }[];

    if (selectedUtilityAccountId === ALL_UTILITY_ACCOUNTS_VALUE) {
      const allDocs = accounts.flatMap((a) => {
        const uan = (a.utility_account as any)?.account_number || "";
        return extractAllDocuments(a, uan);
      });
      raw = [
        ...mergeSafetyNestedDatasets(accounts),
        { key: "documents", label: "Documents", data: allDocs },
      ];
    } else if (selectedRow) {
      const s = selectedRow as FacilityAuditSafetyUtilityNest;
      const uan = (s.utility_account as any)?.account_number || "";
      const docs = extractAllDocuments(s, uan);
      raw = [
        ...Object.entries(s.safety_sections || {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, data]) => ({ key, data })),
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
        <AuditSnapshotSafetyNestedDatasetBody
          items={nestedDatasets}
          selectedKey={activeNestedKey}
          utilityAccountFullExport={
            selectedUtilityAccountId !== ALL_UTILITY_ACCOUNTS_VALUE &&
            selectedRow
              ? {
                  snapshot,
                  utilityNest: selectedRow as FacilityAuditSafetyUtilityNest,
                }
              : null
          }
        />
      }
    />
  );
}
