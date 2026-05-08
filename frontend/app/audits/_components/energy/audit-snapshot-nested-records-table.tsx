"use client";

import { BarChart3, ChevronDown, ChevronRight, Columns3 } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useAuditExplorerExpanded } from "../audit-snapshot-explorer-layout-context";
import { humanizeNestedKey } from "./audit-snapshot-utility-sidebar";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function buildExportFileBaseName(args: {
  snapshotProgram: AuditSnapshotNestedTableProgram;
  nestedDepth: number;
  variantLabel?: string;
}): string {
  const programToken =
    args.snapshotProgram === "electrical_safety" ? "safety" : "energy";
  const depthToken = `depth-${args.nestedDepth + 1}`;
  const variantToken = args.variantLabel
    ? args.variantLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
    : null;
  const dateToken = new Date().toISOString().slice(0, 10);
  return ["audit-snapshot", programToken, depthToken, variantToken, dateToken]
    .filter(Boolean)
    .join("_");
}

function buildTabularExportAoa(args: {
  rows: unknown[];
  visibleColumns: string[];
}): (string | number)[][] {
  const head: (string | number)[] = [
    "#",
    ...args.visibleColumns.map((c) => humanizeNestedKey(c)),
  ];

  const body: (string | number)[][] = args.rows.map((row, idx) => {
    const r = isPlainObject(row) ? row : null;
    return [
      idx + 1,
      ...args.visibleColumns.map((col) => cellPreview(r ? r[col] : undefined)),
    ];
  });

  return [head, ...body];
}

function mergeNestedAuditRecordsForExport(args: {
  parentRows: unknown[];
  nestedKey: (typeof NESTED_AUDIT_RECORD_KEYS_ORDER)[number];
  parentVisibleColumns: string[];
  nestedVisibleColumns?: string[];
}): { columns: string[]; rows: unknown[] } {
  const merged: unknown[] = [];

  for (let parentIdx = 0; parentIdx < args.parentRows.length; parentIdx += 1) {
    const parent = args.parentRows[parentIdx];
    if (!isPlainObject(parent)) continue;
    const arr = parent[args.nestedKey];
    if (!Array.isArray(arr) || arr.length === 0) continue;

    for (const rec of arr) {
      if (!isPlainObject(rec)) {
        merged.push({
          __parent_row__: parentIdx + 1,
          __nested_record__: cellPreview(rec),
        });
        continue;
      }

      const parentPrefix: Record<string, unknown> = {
        __parent_row__: parentIdx + 1,
      };

      for (const c of args.parentVisibleColumns) {
        parentPrefix[`parent.${c}`] = parent[c];
      }

      merged.push({ ...parentPrefix, ...rec });
    }
  }

  const nestedCols =
    args.nestedVisibleColumns?.length
      ? args.nestedVisibleColumns
      : inferColumns(merged, { omitNestedAuditArrays: true });
  const parentCols = args.parentVisibleColumns.map((c) => `parent.${c}`);
  const columns = ["__parent_row__", ...parentCols, ...nestedCols].slice(
    0,
    MAX_TABLE_COLUMNS + 1 + Math.min(parentCols.length, 24),
  );

  return { columns, rows: merged };
}

function buildObjectExportAoa(args: {
  rows: unknown[];
  columns: string[];
  startIndexAt?: number;
}): (string | number)[][] {
  const head: (string | number)[] = args.columns.map((c) => {
    if (c === "__parent_row__") return "Parent #";
    if (c === "__nested_record__") return "Nested record";
    if (c.startsWith("parent.")) {
      return `Parent · ${humanizeNestedKey(c.slice(7))}`;
    }
    return humanizeNestedKey(c);
  });

  const body: (string | number)[][] = args.rows.map((row, idx) => {
    const r = isPlainObject(row) ? row : null;
    const indexValue = (args.startIndexAt ?? 1) + idx;
    return args.columns.map((col) => {
      if (col === "__index__") return indexValue;
      return cellPreview(r ? r[col] : undefined);
    });
  });

  return [head, ...body];
}

function buildKpiSummaryExportAoa(
  sections: EnergyKpiSection[],
): (string | number)[][] {
  const aoa: (string | number)[][] = [
    ["Section", "Metric", "Mode", "Total (Σ)", "Average (µ)", "Count"],
  ];

  for (const section of sections) {
    if (!section.kpis.length) continue;
    for (const kpi of section.kpis) {
      aoa.push([
        section.title,
        kpi.label,
        kpi.mode,
        kpi.mode === "avg" ? "" : formatKpiNumber(kpi.sum),
        kpi.mode === "sum" ? "" : formatKpiNumber(kpi.average),
        kpi.count,
      ]);
    }
  }

  return aoa;
}

async function downloadVisibleTableAsExcel(args: {
  rows: unknown[];
  visibleColumns: string[];
  snapshotProgram: AuditSnapshotNestedTableProgram;
  nestedDepth: number;
  variantLabel?: string;
  kpiSections?: EnergyKpiSection[];
  nestedVisibleColumnsByKey?: Record<string, string[]>;
}) {
  try {
    const { utils, writeFile } = await import("xlsx");
    const aoa = buildTabularExportAoa({
      rows: args.rows,
      visibleColumns: args.visibleColumns,
    });
    const ws = utils.aoa_to_sheet(aoa);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Visible data");

    if (args.kpiSections?.length) {
      const kpiAoa = buildKpiSummaryExportAoa(args.kpiSections);
      const kpiWs = utils.aoa_to_sheet(kpiAoa);
      utils.book_append_sheet(wb, kpiWs, "KPI summary");
    }

    if (args.nestedDepth === 0) {
      for (const nk of NESTED_AUDIT_RECORD_KEYS_ORDER) {
        const merged = mergeNestedAuditRecordsForExport({
          parentRows: args.rows,
          nestedKey: nk,
          parentVisibleColumns: args.visibleColumns,
          nestedVisibleColumns: args.nestedVisibleColumnsByKey?.[nk],
        });
        if (merged.rows.length === 0) continue;
        const nestedAoa = buildObjectExportAoa({
          rows: merged.rows,
          columns: merged.columns,
        });
        const nestedWs = utils.aoa_to_sheet(nestedAoa);
        utils.book_append_sheet(
          wb,
          nestedWs,
          humanizeNestedKey(nk).slice(0, 31),
        );
      }
    }

    writeFile(wb, `${buildExportFileBaseName(args)}.xlsx`, { compression: true });
    toast.success("Excel downloaded");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Excel export failed", e);
    toast.error("Excel export failed");
  }
}

async function downloadVisibleTableAsPdf(args: {
  rows: unknown[];
  visibleColumns: string[];
  snapshotProgram: AuditSnapshotNestedTableProgram;
  nestedDepth: number;
  variantLabel?: string;
  kpiSections?: EnergyKpiSection[];
  nestedVisibleColumnsByKey?: Record<string, string[]>;
}) {
  try {
    const [{ jsPDF }, autoTableMod] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const autoTable = autoTableMod.default;
    const aoa = buildTabularExportAoa({
      rows: args.rows,
      visibleColumns: args.visibleColumns,
    });

    const head = aoa.length ? [aoa[0].map(String)] : [["#"]];
    const body = aoa.slice(1).map((r) => r.map(String));

    const landscape = args.visibleColumns.length >= 7;
    const doc = new jsPDF({
      orientation: landscape ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });

    autoTable(doc, {
      head,
      body,
      theme: "striped",
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [20, 20, 20] },
      margin: { top: 36, left: 24, right: 24, bottom: 24 },
    });

    if (args.kpiSections?.length) {
      const kpiRows = buildKpiSummaryExportAoa(args.kpiSections);
      const kpiHead = kpiRows.length ? [kpiRows[0].map(String)] : [["KPI"]];
      const kpiBody = kpiRows.slice(1).map((r) => r.map(String));
      doc.addPage();
      autoTable(doc, {
        head: kpiHead,
        body: kpiBody,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [20, 20, 20] },
        margin: { top: 36, left: 24, right: 24, bottom: 24 },
      });
    }

    if (args.nestedDepth === 0) {
      for (const nk of NESTED_AUDIT_RECORD_KEYS_ORDER) {
        const merged = mergeNestedAuditRecordsForExport({
          parentRows: args.rows,
          nestedKey: nk,
          parentVisibleColumns: args.visibleColumns,
          nestedVisibleColumns: args.nestedVisibleColumnsByKey?.[nk],
        });
        if (merged.rows.length === 0) continue;

        const nestedAoa = buildObjectExportAoa({
          rows: merged.rows,
          columns: merged.columns,
        });
        const nestedHead = nestedAoa.length
          ? [nestedAoa[0].map(String)]
          : [[humanizeNestedKey(nk)]];
        const nestedBody = nestedAoa.slice(1).map((r) => r.map(String));
        doc.addPage();
        autoTable(doc, {
          head: nestedHead,
          body: nestedBody,
          theme: "striped",
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [20, 20, 20] },
          margin: { top: 36, left: 24, right: 24, bottom: 24 },
        });
      }
    }

    doc.save(`${buildExportFileBaseName(args)}.pdf`);
    toast.success("PDF downloaded");
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("PDF export failed", e);
    toast.error("PDF export failed");
  }
}

/** Hide Mongo/ObjectId-style keys from tables and JSON previews. */
function isIdLikeFieldKey(key: string): boolean {
  if (key.startsWith("__")) return true;
  if (key === "_id" || key === "id") return true;
  if (/_id$/i.test(key)) return true;
  return false;
}

/** Nested audit arrays on equipment docs (energy snapshot aggregate). */
const NESTED_AUDIT_RECORD_KEYS_ORDER = [
  "solar_generation_records",
  "dg_audit_records",
  "transformer_audit_records",
  "pump_audit_records",
] as const;

const NESTED_AUDIT_RECORD_KEYS = new Set<string>(
  NESTED_AUDIT_RECORD_KEYS_ORDER,
);

function rollupNestedAuditArrays(rows: unknown[]): {
  totalNestedRecords: number;
  rowsWithNestedData: number;
} {
  let totalNestedRecords = 0;
  let rowsWithNestedData = 0;
  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    let rowSum = 0;
    for (const k of NESTED_AUDIT_RECORD_KEYS_ORDER) {
      const v = row[k];
      if (Array.isArray(v)) rowSum += v.length;
    }
    totalNestedRecords += rowSum;
    if (rowSum > 0) rowsWithNestedData += 1;
  }
  return { totalNestedRecords, rowsWithNestedData };
}

function getNestedAuditRecords(
  row: unknown,
): { key: string; records: unknown[] } | null {
  if (!isPlainObject(row)) return null;
  for (const k of NESTED_AUDIT_RECORD_KEYS_ORDER) {
    const v = row[k];
    if (Array.isArray(v) && v.length > 0) {
      return { key: k, records: v };
    }
  }
  return null;
}

function nestedAuditTypeSortIndex(key: string): number {
  const i = NESTED_AUDIT_RECORD_KEYS_ORDER.indexOf(
    key as (typeof NESTED_AUDIT_RECORD_KEYS_ORDER)[number],
  );
  return i === -1 ? 999 : i;
}

/** Union inferred columns for each nested audit type currently expanded on equipment rows. */
function computeExpandedNestedAuditColumnUnions(
  rows: unknown[],
  expandedRows: Set<number>,
): { expandedKeys: string[]; unionByKey: Record<string, string[]> } {
  const keySeen = new Set<string>();
  const orderedKeys: string[] = [];
  for (const idx of expandedRows) {
    const row = rows[idx];
    const nest = isPlainObject(row) ? getNestedAuditRecords(row) : null;
    if (!nest) continue;
    if (!keySeen.has(nest.key)) {
      keySeen.add(nest.key);
      orderedKeys.push(nest.key);
    }
  }
  orderedKeys.sort(
    (a, b) => nestedAuditTypeSortIndex(a) - nestedAuditTypeSortIndex(b),
  );

  const unionSets: Record<string, Set<string>> = {};
  for (const nk of orderedKeys) {
    unionSets[nk] = new Set();
  }

  for (const idx of expandedRows) {
    const row = rows[idx];
    const nest = isPlainObject(row) ? getNestedAuditRecords(row) : null;
    if (!nest) continue;
    inferColumns(nest.records, { omitNestedAuditArrays: true }).forEach((c) =>
      unionSets[nest.key]?.add(c),
    );
  }

  const unionByKey: Record<string, string[]> = {};
  for (const nk of orderedKeys) {
    unionByKey[nk] = [...(unionSets[nk] || [])].slice(0, MAX_TABLE_COLUMNS);
  }

  return { expandedKeys: orderedKeys, unionByKey };
}

/** Strip id-like keys recursively for display (cells + fallback JSON). */
function sanitizeForDisplay(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeForDisplay);
  if (value instanceof Date) return value;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (isIdLikeFieldKey(k)) continue;
    out[k] = sanitizeForDisplay(v);
  }
  return out;
}

const ISO_DATE_LIKE_RE = /^\d{4}-\d{2}-\d{2}/;

function tryParseDisplayDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (s.length < 10 || !ISO_DATE_LIKE_RE.test(s)) return null;
    const t = Date.parse(s);
    if (Number.isNaN(t)) return null;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }
  return null;
}

function formatDateOnly(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format ISO / date strings and Date leaves as locale date-only (no time). */
function formatDatesForDisplay(value: unknown): unknown {
  const parsed = tryParseDisplayDate(value);
  if (parsed) return formatDateOnly(parsed);
  if (Array.isArray(value)) return value.map(formatDatesForDisplay);
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = formatDatesForDisplay(v);
  }
  return out;
}

const MAX_TABLE_COLUMNS = 24;

/** Column keys never shown in nested audit tables (attachments / large blobs). */
const TABLE_OMIT_COLUMN_KEYS = new Set<string>([
  "documents",
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
]);

function inferColumns(
  rows: unknown[],
  options?: { omitNestedAuditArrays?: boolean },
): string[] {
  const omitNested = options?.omitNestedAuditArrays !== false;
  const keys = new Set<string>();
  for (const row of rows.slice(0, 80)) {
    if (!isPlainObject(row)) continue;
    Object.keys(row).forEach((k) => {
      if (TABLE_OMIT_COLUMN_KEYS.has(k)) return;
      if (!isIdLikeFieldKey(k)) {
        if (omitNested && NESTED_AUDIT_RECORD_KEYS.has(k)) return;
        keys.add(k);
      }
    });
  }
  return [...keys].slice(0, MAX_TABLE_COLUMNS);
}

/** Infer column keys for a tabular block (e.g. nested object arrays on safety audit docs). */
export function inferAuditSnapshotTabularColumns(rows: unknown[]): string[] {
  return inferColumns(rows, { omitNestedAuditArrays: true });
}

const MAX_KPI_METRICS = 14;

/** Explicit overrides for electrical audit semantics (field_name_lowercase → mode). */
const KPI_AGG_MODE_OVERRIDE: Record<string, "sum" | "avg" | "both" | null> = {
  billing_days: "avg",
};

/** Never aggregate these keys even if numeric (identifiers / dates / booleans-as-metadata). */
const KPI_SKIP_COLUMN_RE =
  /(^_|latitude|longitude|\blat\b|\blng\b|\blon\b|zip|postal|pincode|phone|account_number|^bill_no$|^bill\s*no|serial|version|__v|created_at|updated_at|uploadedAt|fileUrl|url\b|email|coordinates)/i;

/** Prefer average across rows (indices, ratios, efficiencies). */
const KPI_AVG_HINT_RE =
  /percent|_pct|pct_|_percent|factor|efficiency|loading|thd|harmonic|power_factor|\bpf\b|sfc|deviation|cost_per|per_kwh|per_unit|per_hour|per_year|daily_average|avg_|average_|density|ratio|motor_loading|load_factor/i;

/** Prefer additive totals across rows (energy, masses, costs, hours where summed periods matter). */
const KPI_SUM_HINT_RE =
  /kwh|kvah|\bkva\b|\bkw\b|mw\b|energy|consumption|generated|generation|export|import|net_|fuel|liter|litre|annual_|total_|losses|demand|sanctioned|charges|amount|cost_rs|_cost\b|fee\b|tariff|billing|units?_generated|operating_hours|working_hours|hours_per|flow\b|capacity|head_|volume|liters_per/i;

/** Spot readings & hydraulic envelopes — average across assets / audits (Σ rarely meaningful). */
const KPI_NEUTRAL_ENGINEERING_RE =
  /(measured|reading|line_voltage|phase_voltage|line_current|input_power|output_power|hydraulic|dynamic_head|suction|discharge|voltage_v|current_a|pressure|temperature|resistance|ohm)/i;

function tryParseNumericForAggregation(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const s = value.trim().replace(/,/g, "");
    if (!s || ISO_DATE_LIKE_RE.test(s)) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function classifyAggregationMode(
  columnKey: string,
): "sum" | "avg" | "both" | null {
  const lower = columnKey.toLowerCase();
  const override = KPI_AGG_MODE_OVERRIDE[lower];
  if (override !== undefined) return override;
  if (KPI_SKIP_COLUMN_RE.test(columnKey)) return null;

  const wantsAvg = KPI_AVG_HINT_RE.test(columnKey);
  const wantsSum = KPI_SUM_HINT_RE.test(columnKey);
  const neutral = KPI_NEUTRAL_ENGINEERING_RE.test(columnKey);

  if (wantsAvg && !wantsSum) return "avg";
  if (wantsSum && !wantsAvg) return "sum";
  if (wantsSum && wantsAvg) return "both";
  if (neutral) return "avg";
  return null;
}

type EnergyAuditColumnKpi = {
  columnKey: string;
  label: string;
  mode: "sum" | "avg" | "both";
  count: number;
  sum: number;
  average: number;
};

function computeEnergyAuditColumnKpis(
  rows: unknown[],
  columnKeys: string[],
): EnergyAuditColumnKpi[] {
  const out: EnergyAuditColumnKpi[] = [];

  for (const key of columnKeys) {
    const mode = classifyAggregationMode(key);
    if (!mode) continue;

    const nums: number[] = [];
    for (const row of rows) {
      if (!isPlainObject(row)) continue;
      const n = tryParseNumericForAggregation(row[key]);
      if (n !== null) nums.push(n);
    }

    if (nums.length === 0) continue;
    if (nums.every((v) => v === 0 || v === 1)) continue;

    const sum = nums.reduce((a, b) => a + b, 0);
    const average = sum / nums.length;

    out.push({
      columnKey: key,
      label: humanizeNestedKey(key),
      mode,
      count: nums.length,
      sum,
      average,
    });
  }

  const priority = (m: EnergyAuditColumnKpi): number => {
    if (m.mode === "sum") return 0;
    if (m.mode === "both") return 1;
    return 2;
  };

  out.sort((a, b) => {
    const dp = priority(a) - priority(b);
    if (dp !== 0) return dp;
    return a.label.localeCompare(b.label);
  });

  return out.slice(0, MAX_KPI_METRICS);
}

type EnergyKpiSection = {
  id: string;
  title: string;
  subtitle: string;
  kpis: EnergyAuditColumnKpi[];
};

/** Merge nested audit arrays from all equipment rows (flatten for facility-wide KPIs). */
function mergeNestedAuditRecordsFromRows(
  rootRows: unknown[],
  nestedKey: string,
): unknown[] {
  const merged: unknown[] = [];
  for (const row of rootRows) {
    if (!isPlainObject(row)) continue;
    const arr = row[nestedKey];
    if (Array.isArray(arr)) merged.push(...arr);
  }
  return merged;
}

function computeConsolidatedEnergyKpiSections(
  rootRows: unknown[],
  rootSummaryColumns: string[],
): EnergyKpiSection[] {
  const sections: EnergyKpiSection[] = [];

  const mainKpis = computeEnergyAuditColumnKpis(rootRows, rootSummaryColumns);
  sections.push({
    id: "main_dataset",
    title: "This dataset",
    subtitle: `${rootRows.length} row${rootRows.length === 1 ? "" : "s"} in the table above`,
    kpis: mainKpis,
  });

  for (const key of NESTED_AUDIT_RECORD_KEYS_ORDER) {
    const merged = mergeNestedAuditRecordsFromRows(rootRows, key);
    if (merged.length === 0) continue;
    const cols = inferColumns(merged, { omitNestedAuditArrays: true });
    const kpis = computeEnergyAuditColumnKpis(merged, cols);
    sections.push({
      id: key,
      title: humanizeNestedKey(key),
      subtitle: `${merged.length} record${merged.length === 1 ? "" : "s"} merged across equipment (not tied to expand state)`,
      kpis,
    });
  }

  return sections;
}

function formatKpiNumber(n: number): string {
  const abs = Math.abs(n);
  const digits =
    abs === 0 ? 2 : abs < 1 ? 4 : abs < 100 ? 3 : abs < 1e6 ? 2 : 2;
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(n);
}

function cellPreview(value: unknown): string {
  if (value === null || value === undefined) return "—";
  const cleaned = sanitizeForDisplay(value);
  const asDate = tryParseDisplayDate(cleaned);
  if (asDate) return formatDateOnly(asDate);
  if (typeof cleaned === "object") {
    try {
      return JSON.stringify(formatDatesForDisplay(cleaned));
    } catch {
      return String(cleaned);
    }
  }
  return String(cleaned);
}

/** Single-cell string used by safety document boxes and tables. */
export function formatAuditSnapshotCellPreview(value: unknown): string {
  return cellPreview(value);
}

export function nestedRecordsJsonPreview(data: unknown[]): string {
  const displayPayload = formatDatesForDisplay(sanitizeForDisplay(data));
  return JSON.stringify(displayPayload, null, 2);
}

export function shouldUseNestedRecordsTable(rows: unknown[]): boolean {
  if (!rows.length || !rows.every((row) => row === null || isPlainObject(row))) {
    return false;
  }
  const columns = inferColumns(rows, { omitNestedAuditArrays: true });
  if (columns.length > 0) return true;
  return rows.some((row) => getNestedAuditRecords(row) != null);
}

type ColumnPickerToolbarProps = {
  allColumns: string[];
  visibleKeys: Set<string>;
  onToggleColumn: (col: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAllButOne: () => void;
  /** Short suffix for nested datasets, e.g. " · Dg Audit Records". */
  variantLabel?: string;
  toolbarClassName?: string;
};

function ColumnPickerToolbar({
  allColumns,
  visibleKeys,
  onToggleColumn,
  onSelectAll,
  onDeselectAllButOne,
  variantLabel,
  toolbarClassName,
}: ColumnPickerToolbarProps) {
  const auditExplorerExpanded = useAuditExplorerExpanded();
  const visibleCount = useMemo(() => {
    return allColumns.filter((c) => visibleKeys.has(c)).length;
  }, [allColumns, visibleKeys]);

  const allColumnsSelected =
    allColumns.length > 1 &&
    visibleCount === allColumns.length &&
    allColumns.every((c) => visibleKeys.has(c));

  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap items-center justify-end gap-2 px-2 py-1.5",
        toolbarClassName,
      )}
    >
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <Columns3 className="size-3.5 shrink-0 opacity-70" />
            Columns
            {variantLabel ? (
              <span className="max-w-[10rem] truncate font-normal text-muted-foreground">
                {variantLabel}
              </span>
            ) : null}
            <span className="tabular-nums text-muted-foreground">
              ({visibleCount}/{allColumns.length})
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn(
            "flex w-[min(calc(100vw-1rem),20rem)] max-h-[min(70vh,22rem)] flex-col overflow-hidden p-0",
            auditExplorerExpanded && "z-[110]",
          )}
          align="end"
        >
          <div className="shrink-0 border-b border-border px-3 py-2">
            <p className="text-xs font-medium text-foreground">Visible columns</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              At least one column must stay selected. Deselect all collapses to
              the first column only.
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col gap-0.5 p-2">
              {allColumns.map((col) => {
                const checked = visibleKeys.has(col);
                const onlyOne = checked && visibleCount <= 1;

                return (
                  <label
                    key={col}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/80",
                      onlyOne && "opacity-90",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={onlyOne}
                      onCheckedChange={(v) => onToggleColumn(col, v === true)}
                      aria-label={humanizeNestedKey(col)}
                    />
                    <span className="min-w-0 flex-1 text-sm leading-snug">
                      {humanizeNestedKey(col)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border p-2">
            {allColumnsSelected ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mr-auto h-8 text-xs"
                onClick={onDeselectAllButOne}
                aria-label="Deselect all columns except the first"
              >
                Deselect all
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onSelectAll}
            >
              Select all
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function EnergyKpiTileGrid({ kpis }: { kpis: EnergyAuditColumnKpi[] }) {
  if (kpis.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border/70 bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
        No matching electrical quantities for totals/averages (identifiers,
        dates, and flags are excluded).
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {kpis.map((kpi) => (
        <div
          key={kpi.columnKey}
          className="min-w-0 rounded-lg border border-border/60 bg-card/90 px-3 py-2.5 shadow-xs"
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {kpi.label}
          </p>
          <div className="mt-2 space-y-1.5">
            {kpi.mode !== "avg" ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                <span className="text-[11px] text-muted-foreground">Total Σ</span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatKpiNumber(kpi.sum)}
                </span>
              </div>
            ) : null}
            {kpi.mode !== "sum" ? (
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
                <span className="text-[11px] text-muted-foreground">
                  Average µ
                </span>
                <span className="font-semibold tabular-nums text-foreground">
                  {formatKpiNumber(kpi.average)}
                </span>
              </div>
            ) : null}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground">
            Based on {kpi.count} numeric row{kpi.count === 1 ? "" : "s"}
          </p>
        </div>
      ))}
    </div>
  );
}

type ConsolidatedEnergyKpiPanelProps = {
  sections: EnergyKpiSection[];
  rowCount: number;
  visibleColumnCount: number;
  totalColumnCount: number;
  nestedAuditRollup: {
    totalNestedRecords: number;
    rowsWithNestedData: number;
  };
};

function ConsolidatedEnergyKpiSummaryModal({
  sections,
  rowCount,
  visibleColumnCount,
  totalColumnCount,
  nestedAuditRollup,
}: ConsolidatedEnergyKpiPanelProps) {
  const auditExplorerExpanded = useAuditExplorerExpanded();
  const { totalNestedRecords, rowsWithNestedData } = nestedAuditRollup;
  const showNestedRollup = totalNestedRecords > 0;
  const zBoost = auditExplorerExpanded ? "z-[110]" : undefined;

  const metaLine = (
    <span className="inline-flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
      <span>
        <span className="font-medium text-foreground">{rowCount}</span> table
        row{rowCount === 1 ? "" : "s"}
      </span>
      {totalColumnCount > 0 ? (
        <span className="tabular-nums">
          Columns{" "}
          <span className="font-medium text-foreground">
            {visibleColumnCount}/{totalColumnCount}
          </span>{" "}
          visible
        </span>
      ) : null}
      {showNestedRollup ? (
        <span className="tabular-nums">
          Nested audit rows{" "}
          <span className="font-medium text-foreground">
            {totalNestedRecords}
          </span>
          {rowsWithNestedData > 0 ? (
            <span className="text-muted-foreground">
              {" "}
              · {rowsWithNestedData} equipment w/ data
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs shadow-sm"
        >
          <BarChart3 className="size-3.5 shrink-0 opacity-80" aria-hidden />
          View summary
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        overlayClassName={zBoost}
        className={cn(
          "flex max-h-[min(90dvh,44rem)] w-[calc(100%-1rem)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:w-full",
          zBoost,
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-6 pt-6 pr-12 pb-4 text-left">
          <DialogTitle>Electrical energy KPI summary</DialogTitle>
          <DialogDescription asChild>
            <div className="text-muted-foreground">{metaLine}</div>
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-6 pb-6 pt-4">
          <p className="mb-4 text-[11px] leading-snug text-muted-foreground">
            Σ totals additive quantities where applicable; µ averages suit
            ratios and efficiencies. Nested solar / DG / transformer / pump KPIs
            use all nested records merged across equipment below—no need to
            expand rows.
          </p>
          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="border-b border-border/60 pb-1">
                  <h3 className="text-xs font-semibold text-foreground">
                    {section.title}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {section.subtitle}
                  </p>
                </div>
                <EnergyKpiTileGrid kpis={section.kpis} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export type NestedAuditTableColumnControl = {
  auditKey: string;
  allColumns: string[];
  visibleKeys: Set<string>;
  onToggleColumn: (col: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAllButOne: () => void;
};

/** Audit program for snapshot tables — energy vs safety can diverge in layout and footer analytics. */
export type AuditSnapshotNestedTableProgram = "electrical_energy" | "electrical_safety";

type AuditSnapshotTableChrome = {
  shell: string;
  pickerRail: string;
  columnToolbar: string;
  theadRow: string;
  thIndex: string;
  thData: string;
  tbodyRow: (rowIdx: number) => string;
  indexCell: (rowIdx: number) => string;
  dataCell: string;
  expandButton: string;
  nestedExpandRow: string;
  nestedSection: string;
  nestedSectionTitle: string;
  nestedJsonPre: string;
};

/** Safety: amber / caution accent; Energy: emerald / operations accent. */
function getAuditSnapshotTableChrome(
  program: AuditSnapshotNestedTableProgram,
): AuditSnapshotTableChrome {
  if (program === "electrical_safety") {
    return {
      shell:
        "rounded-xl border border-amber-500/35 bg-gradient-to-b from-amber-500/[0.08] via-background to-background shadow-lg shadow-amber-900/[0.06] ring-1 ring-amber-500/20 dark:from-amber-950/[0.35] dark:shadow-black/25 dark:ring-amber-400/15",
      pickerRail:
        "border-b border-amber-500/25 bg-amber-500/[0.1] dark:border-amber-500/30 dark:bg-amber-950/40",
      columnToolbar:
        "border-b border-amber-500/18 bg-amber-500/[0.06] dark:border-amber-500/25 dark:bg-amber-950/30",
      theadRow:
        "border-b border-amber-500/35 bg-amber-100/92 dark:border-amber-400/25 dark:bg-amber-950/60",
      thIndex:
        "border-r border-amber-500/25 bg-amber-100/95 font-semibold text-amber-950 dark:border-amber-500/35 dark:bg-amber-950/65 dark:text-amber-50",
      thData:
        "font-semibold uppercase tracking-wide text-[11px] text-amber-950 dark:text-amber-50",
      tbodyRow: (rowIdx) =>
        cn(
          "group border-b border-amber-500/15 transition-colors duration-200 dark:border-amber-900/40",
          rowIdx % 2 === 0
            ? "bg-amber-500/[0.055] dark:bg-amber-950/[0.28]"
            : "bg-background/85 dark:bg-amber-950/[0.12]",
          "hover:bg-amber-200/50 dark:hover:bg-amber-900/40",
        ),
      indexCell: (rowIdx) =>
        cn(
          "sticky left-0 z-[1] border-r border-amber-500/18 px-2 py-2 align-top backdrop-blur-[2px] transition-colors duration-200 sm:px-3",
          rowIdx % 2 === 0
            ? "bg-amber-50/[0.97] dark:bg-amber-950/55"
            : "bg-background/[0.97] dark:bg-amber-950/38",
          "group-hover:bg-amber-200/55 dark:group-hover:bg-amber-900/45",
        ),
      dataCell:
        "max-w-[min(100vw,18rem)] min-w-[6rem] whitespace-normal break-words px-2 py-2 align-top text-xs transition-colors duration-200 sm:min-w-[8rem] sm:max-w-[14rem] sm:px-3 md:max-w-[18rem] text-foreground/95 group-hover:text-foreground",
      expandButton:
        "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-amber-900 transition-all hover:border-amber-500/40 hover:bg-amber-200/75 hover:text-amber-950 active:scale-[0.96] dark:text-amber-100 dark:hover:border-amber-400/35 dark:hover:bg-amber-900/55 dark:hover:text-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      nestedExpandRow:
        "border-b border-amber-500/18 bg-gradient-to-r from-amber-500/[0.07] via-amber-500/[0.02] to-transparent dark:border-amber-800/50 dark:from-amber-950/45",
      nestedSection:
        "border-l-[3px] border-amber-500/65 bg-amber-500/[0.06] px-3 py-3 dark:border-amber-400/45 dark:bg-amber-950/45 sm:pl-10",
      nestedSectionTitle:
        "mb-2 text-xs font-semibold text-amber-950 dark:text-amber-100",
      nestedJsonPre:
        "max-h-[min(36vh,16rem)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-amber-500/25 bg-background/90 p-3 font-mono text-[11px] leading-relaxed dark:border-amber-500/30",
    };
  }

  return {
    shell:
      "rounded-xl border border-emerald-500/35 bg-gradient-to-b from-emerald-500/[0.07] via-background to-background shadow-lg shadow-emerald-900/[0.06] ring-1 ring-emerald-500/20 dark:from-emerald-950/[0.32] dark:shadow-black/25 dark:ring-emerald-400/15",
    pickerRail:
      "border-b border-emerald-500/25 bg-emerald-500/[0.09] dark:border-emerald-500/30 dark:bg-emerald-950/40",
    columnToolbar:
      "border-b border-emerald-500/18 bg-emerald-500/[0.055] dark:border-emerald-500/25 dark:bg-emerald-950/30",
    theadRow:
      "border-b border-emerald-500/35 bg-emerald-100/92 dark:border-emerald-400/25 dark:bg-emerald-950/60",
    thIndex:
      "border-r border-emerald-500/25 bg-emerald-100/95 font-semibold text-emerald-950 dark:border-emerald-500/35 dark:bg-emerald-950/65 dark:text-emerald-50",
    thData:
      "font-semibold uppercase tracking-wide text-[11px] text-emerald-950 dark:text-emerald-50",
    tbodyRow: (rowIdx) =>
      cn(
        "group border-b border-emerald-500/15 transition-colors duration-200 dark:border-emerald-900/40",
        rowIdx % 2 === 0
          ? "bg-emerald-500/[0.048] dark:bg-emerald-950/[0.28]"
          : "bg-background/85 dark:bg-emerald-950/[0.12]",
        "hover:bg-emerald-200/45 dark:hover:bg-emerald-900/38",
      ),
    indexCell: (rowIdx) =>
      cn(
        "sticky left-0 z-[1] border-r border-emerald-500/18 px-2 py-2 align-top backdrop-blur-[2px] transition-colors duration-200 sm:px-3",
        rowIdx % 2 === 0
          ? "bg-emerald-50/[0.97] dark:bg-emerald-950/55"
          : "bg-background/[0.97] dark:bg-emerald-950/38",
        "group-hover:bg-emerald-200/50 dark:group-hover:bg-emerald-900/42",
      ),
    dataCell:
      "max-w-[min(100vw,18rem)] min-w-[6rem] whitespace-normal break-words px-2 py-2 align-top text-xs transition-colors duration-200 sm:min-w-[8rem] sm:max-w-[14rem] sm:px-3 md:max-w-[18rem] text-foreground/95 group-hover:text-foreground",
    expandButton:
      "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-emerald-900 transition-all hover:border-emerald-500/40 hover:bg-emerald-200/75 hover:text-emerald-950 active:scale-[0.96] dark:text-emerald-100 dark:hover:border-emerald-400/35 dark:hover:bg-emerald-900/55 dark:hover:text-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    nestedExpandRow:
      "border-b border-emerald-500/18 bg-gradient-to-r from-emerald-500/[0.06] via-emerald-500/[0.02] to-transparent dark:border-emerald-800/50 dark:from-emerald-950/45",
    nestedSection:
      "border-l-[3px] border-emerald-500/60 bg-emerald-500/[0.055] px-3 py-3 dark:border-emerald-400/45 dark:bg-emerald-950/45 sm:pl-10",
    nestedSectionTitle:
      "mb-2 text-xs font-semibold text-emerald-950 dark:text-emerald-100",
    nestedJsonPre:
      "max-h-[min(36vh,16rem)] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-500/25 bg-background/90 p-3 font-mono text-[11px] leading-relaxed dark:border-emerald-500/30",
  };
}

export type AuditSnapshotNestedRecordsTableProps = {
  /** Non-empty rows; caller ensures tabular shape. */
  rows: unknown[];
  /** Nesting depth for expandable equipment → audit rows (internal recursion). */
  nestedDepth?: number;
  /** Parent-owned column visibility for nested DG / solar / transformer / pump audit grids. */
  nestedAuditColumnControl?: NestedAuditTableColumnControl | null;
  /**
   * When the dataset is merged across utility accounts, force a `utility_account_number`
   * column to appear (helps disambiguate rows coming from different accounts).
   *
   * The backend often populates `utility_account_number` for audit records; when not present,
   * nested audit rows inherit it from the expanded parent row when possible.
   */
  includeUtilityAccountNumberColumn?: boolean;
  /**
   * Which program this grid belongs to.
   * Use `AuditSnapshotEnergyNestedRecordsTable` or `AuditSnapshotSafetyNestedRecordsTable` at call sites.
   */
  snapshotProgram?: AuditSnapshotNestedTableProgram;
  /** Optional extra classes on the outer table shell (chrome uses program accents by default). */
  className?: string;
};

export function AuditSnapshotNestedRecordsTable({
  rows,
  nestedDepth = 0,
  nestedAuditColumnControl = null,
  includeUtilityAccountNumberColumn = false,
  snapshotProgram = "electrical_energy",
  className,
}: AuditSnapshotNestedRecordsTableProps) {
  const parentControlledColumns = nestedAuditColumnControl !== null;

  const chrome = useMemo(
    () => getAuditSnapshotTableChrome(snapshotProgram),
    [snapshotProgram],
  );

  const inferredColumns = useMemo(() => {
    const cols = inferColumns(rows, { omitNestedAuditArrays: true });
    if (!includeUtilityAccountNumberColumn) return cols;
    const key = "utility_account_number";
    if (cols.includes(key)) return cols;
    const next = [key, ...cols].slice(0, MAX_TABLE_COLUMNS);
    return next;
  }, [rows, includeUtilityAccountNumberColumn]);

  const allColumnsRaw = parentControlledColumns
    ? nestedAuditColumnControl.allColumns
    : inferredColumns;

  const allColumns = useMemo(() => {
    if (!includeUtilityAccountNumberColumn) return allColumnsRaw;
    const key = "utility_account_number";
    if (allColumnsRaw.includes(key)) return allColumnsRaw;
    return [key, ...allColumnsRaw].slice(0, MAX_TABLE_COLUMNS);
  }, [allColumnsRaw, includeUtilityAccountNumberColumn]);

  const [localVisibleKeys, setLocalVisibleKeys] = useState<Set<string>>(
    () => new Set(inferredColumns),
  );

  useEffect(() => {
    if (parentControlledColumns) return;
    setLocalVisibleKeys(new Set(inferredColumns));
  }, [inferredColumns, parentControlledColumns]);

  const visibleKeys = parentControlledColumns
    ? nestedAuditColumnControl.visibleKeys
    : localVisibleKeys;

  const toggleColumn = useCallback(
    (col: string, checked: boolean) => {
      if (nestedAuditColumnControl) {
        nestedAuditColumnControl.onToggleColumn(col, checked);
        return;
      }
      setLocalVisibleKeys((prev) => {
        if (checked) {
          const next = new Set(prev);
          next.add(col);
          return next;
        }
        if (!prev.has(col)) return prev;
        if (prev.size <= 1) return prev;
        const next = new Set(prev);
        next.delete(col);
        return next;
      });
    },
    [nestedAuditColumnControl],
  );

  const selectAllColumns = useCallback(() => {
    if (nestedAuditColumnControl) {
      nestedAuditColumnControl.onSelectAll();
      return;
    }
    setLocalVisibleKeys(new Set(allColumns));
  }, [nestedAuditColumnControl, allColumns]);

  const deselectAllColumnsButFirst = useCallback(() => {
    if (nestedAuditColumnControl) {
      nestedAuditColumnControl.onDeselectAllButOne();
      return;
    }
    if (!allColumns.length) return;
    setLocalVisibleKeys(new Set([allColumns[0]]));
  }, [nestedAuditColumnControl, allColumns]);

  const visibleColumns = useMemo(
    () => allColumns.filter((c) => visibleKeys.has(c)),
    [allColumns, visibleKeys],
  );

  const nestedAuditRollup = useMemo(() => rollupNestedAuditArrays(rows), [rows]);

  const consolidatedKpiSections = useMemo(() => {
    if (nestedDepth !== 0 || snapshotProgram !== "electrical_energy") return [];
    return computeConsolidatedEnergyKpiSections(rows, inferredColumns);
  }, [nestedDepth, snapshotProgram, rows, inferredColumns]);

  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const {
    expandedKeys: expandedNestedAuditKeys,
    unionByKey: nestedAuditUnionColumns,
  } = useMemo(
    () => computeExpandedNestedAuditColumnUnions(rows, expandedRows),
    [rows, expandedRows],
  );

  const [nestedAuditVisibleKeysByKey, setNestedAuditVisibleKeysByKey] = useState<
    Record<string, Set<string>>
  >({});

  useEffect(() => {
    setNestedAuditVisibleKeysByKey((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const nk of expandedNestedAuditKeys) {
        const cols = nestedAuditUnionColumns[nk];
        if (!cols?.length) continue;
        if (!next[nk] || next[nk].size === 0) {
          next[nk] = new Set(cols);
          changed = true;
        }
      }
      for (const k of Object.keys(next)) {
        if (!expandedNestedAuditKeys.includes(k)) {
          delete next[k];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [expandedNestedAuditKeys, nestedAuditUnionColumns]);

  const toggleNestedAuditColumn = useCallback(
    (nk: string, col: string, checked: boolean) => {
      const cols = nestedAuditUnionColumns[nk];
      if (!cols?.length) return;
      setNestedAuditVisibleKeysByKey((prev) => {
        const cur = new Set(prev[nk] ?? cols);
        if (checked) {
          cur.add(col);
        } else {
          if (!cur.has(col)) return prev;
          if (cur.size <= 1) return prev;
          cur.delete(col);
        }
        return { ...prev, [nk]: cur };
      });
    },
    [nestedAuditUnionColumns],
  );

  const selectNestedAuditAll = useCallback(
    (nk: string) => {
      const cols = nestedAuditUnionColumns[nk];
      if (!cols?.length) return;
      setNestedAuditVisibleKeysByKey((prev) => ({
        ...prev,
        [nk]: new Set(cols),
      }));
    },
    [nestedAuditUnionColumns],
  );

  const deselectNestedAuditAllButFirst = useCallback(
    (nk: string) => {
      const cols = nestedAuditUnionColumns[nk];
      if (!cols?.length) return;
      setNestedAuditVisibleKeysByKey((prev) => ({
        ...prev,
        [nk]: new Set([cols[0]]),
      }));
    },
    [nestedAuditUnionColumns],
  );

  const resolveNestedVisibleKeys = useCallback(
    (nk: string): Set<string> => {
      const cols = nestedAuditUnionColumns[nk];
      if (!cols?.length) return new Set<string>();
      const saved = nestedAuditVisibleKeysByKey[nk];
      if (saved?.size) {
        const filtered = new Set<string>([...saved].filter((c) => cols.includes(c)));
        return filtered.size ? filtered : new Set<string>(cols);
      }
      return new Set<string>(cols);
    },
    [nestedAuditUnionColumns, nestedAuditVisibleKeysByKey],
  );

  const toggleRow = useCallback((idx: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }, []);

  useEffect(() => {
    setExpandedRows(new Set());
  }, [rows]);

  const tableScrollMax =
    nestedDepth === 0 ? "max-h-[min(58vh,30rem)]" : "max-h-[min(40vh,19rem)]";

  const colSpan = visibleColumns.length + 1;

  const showMainColumnPicker = !parentControlledColumns && allColumns.length > 0;

  const showNestedPickersOnParentHeader =
    nestedDepth === 0 &&
    !parentControlledColumns &&
    expandedNestedAuditKeys.some(
      (nk) => (nestedAuditUnionColumns[nk]?.length ?? 0) > 0,
    );

  const canExport = rows.length > 0 && visibleColumns.length > 0;

  const exportVariantLabel =
    nestedAuditColumnControl?.auditKey != null
      ? humanizeNestedKey(nestedAuditColumnControl.auditKey)
      : undefined;

  const showExportToolbar =
    canExport && (showMainColumnPicker || parentControlledColumns);

  const nestedVisibleColumnsByKey = useMemo(() => {
    if (nestedDepth !== 0) return undefined;
    const out: Record<string, string[]> = {};
    for (const nk of NESTED_AUDIT_RECORD_KEYS_ORDER) {
      const cols = nestedAuditUnionColumns[nk];
      if (!cols?.length) continue;
      const visible = resolveNestedVisibleKeys(nk);
      out[nk] = cols.filter((c) => visible.has(c));
    }
    return out;
  }, [nestedDepth, nestedAuditUnionColumns, resolveNestedVisibleKeys]);

  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-col overflow-hidden",
        chrome.shell,
        className,
      )}
      data-snapshot-program={snapshotProgram}
    >
      {showMainColumnPicker || showNestedPickersOnParentHeader || showExportToolbar ? (
        <div className={cn("flex shrink-0 flex-col", chrome.pickerRail)}>
          <div className={cn("flex flex-wrap items-center gap-2", chrome.columnToolbar)}>
            <div className="min-w-0 flex-1">
              {showMainColumnPicker ? (
                <ColumnPickerToolbar
                  allColumns={allColumns}
                  visibleKeys={visibleKeys}
                  onToggleColumn={toggleColumn}
                  onSelectAll={selectAllColumns}
                  onDeselectAllButOne={deselectAllColumnsButFirst}
                />
              ) : null}
            </div>
            {showExportToolbar ? (
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 px-2 py-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!canExport}
                  onClick={() =>
                    void downloadVisibleTableAsExcel({
                      rows,
                      visibleColumns,
                      snapshotProgram,
                      nestedDepth,
                      variantLabel: exportVariantLabel,
                      kpiSections:
                        nestedDepth === 0 && snapshotProgram === "electrical_energy"
                          ? consolidatedKpiSections
                          : undefined,
                      nestedVisibleColumnsByKey,
                    })
                  }
                >
                  Export Excel
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={!canExport}
                  onClick={() =>
                    void downloadVisibleTableAsPdf({
                      rows,
                      visibleColumns,
                      snapshotProgram,
                      nestedDepth,
                      variantLabel: exportVariantLabel,
                      kpiSections:
                        nestedDepth === 0 && snapshotProgram === "electrical_energy"
                          ? consolidatedKpiSections
                          : undefined,
                      nestedVisibleColumnsByKey,
                    })
                  }
                >
                  Export PDF
                </Button>
              </div>
            ) : null}
          </div>
          {showNestedPickersOnParentHeader
            ? expandedNestedAuditKeys.map((nk) => {
                const cols = nestedAuditUnionColumns[nk];
                if (!cols?.length) return null;
                return (
                  <ColumnPickerToolbar
                    key={nk}
                    variantLabel={` · ${humanizeNestedKey(nk)}`}
                    allColumns={cols}
                    visibleKeys={resolveNestedVisibleKeys(nk)}
                    onToggleColumn={(col, checked) =>
                      toggleNestedAuditColumn(nk, col, checked)
                    }
                    onSelectAll={() => selectNestedAuditAll(nk)}
                    onDeselectAllButOne={() => deselectNestedAuditAllButFirst(nk)}
                    toolbarClassName={chrome.columnToolbar}
                  />
                );
              })
            : null}
        </div>
      ) : null}

      <div
        className={cn(
          "min-h-0 overflow-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]",
          tableScrollMax,
        )}
      >
        <table className="w-max min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-[1] shadow-md backdrop-blur-sm">
            <tr className={cn("text-left", chrome.theadRow)}>
              <th
                className={cn(
                  "sticky left-0 z-[2] whitespace-nowrap px-2 py-2.5 text-xs backdrop-blur-sm sm:px-3",
                  chrome.thIndex,
                )}
              >
                #
              </th>
              {visibleColumns.map((col) => (
                <th
                  key={col}
                  className={cn(
                    "whitespace-nowrap px-3 py-2.5 text-xs capitalize",
                    chrome.thData,
                  )}
                >
                  {humanizeNestedKey(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const nested = isPlainObject(row) ? getNestedAuditRecords(row) : null;
              const isExpanded = expandedRows.has(idx);

              return (
                <Fragment key={idx}>
                  <tr className={chrome.tbodyRow(idx)}>
                    <td className={chrome.indexCell(idx)}>
                      <div className="flex items-center gap-1">
                        {nested ? (
                          <button
                            type="button"
                            className={chrome.expandButton}
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? "Collapse nested audit records"
                                : `Expand ${nested.records.length} nested audit records`
                            }
                            onClick={() => toggleRow(idx)}
                          >
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-block w-7 shrink-0" aria-hidden />
                        )}
                        <span className="tabular-nums text-xs text-muted-foreground group-hover:text-foreground/90">
                          {idx + 1}
                        </span>
                      </div>
                    </td>
                    {visibleColumns.map((col) => (
                      <td
                        key={col}
                        className={chrome.dataCell}
                        title={cellPreview(isPlainObject(row) ? row[col] : undefined)}
                      >
                        {cellPreview(isPlainObject(row) ? row[col] : undefined)}
                      </td>
                    ))}
                  </tr>
                  {nested && isExpanded ? (
                    <tr className={chrome.nestedExpandRow}>
                      <td colSpan={colSpan} className="p-0 align-top">
                        <div className={chrome.nestedSection}>
                          <p className={chrome.nestedSectionTitle}>
                            {humanizeNestedKey(nested.key)}
                            <span className="ml-2 tabular-nums font-normal text-muted-foreground">
                              ({nested.records.length})
                            </span>
                          </p>
                          {shouldUseNestedRecordsTable(nested.records) ? (
                            <AuditSnapshotNestedRecordsTable
                              rows={
                                includeUtilityAccountNumberColumn &&
                                isPlainObject(row) &&
                                typeof row.utility_account_number === "string" &&
                                row.utility_account_number.trim() &&
                                Array.isArray(nested.records)
                                  ? nested.records.map((rec) => {
                                      if (!isPlainObject(rec)) return rec;
                                      if (
                                        typeof rec.utility_account_number === "string" &&
                                        rec.utility_account_number.trim()
                                      ) {
                                        return rec;
                                      }
                                      return {
                                        ...rec,
                                        utility_account_number: row.utility_account_number,
                                      };
                                    })
                                  : nested.records
                              }
                              nestedDepth={nestedDepth + 1}
                              snapshotProgram={snapshotProgram}
                              includeUtilityAccountNumberColumn={
                                includeUtilityAccountNumberColumn
                              }
                              nestedAuditColumnControl={
                                nestedDepth === 0
                                  ? {
                                      auditKey: nested.key,
                                      allColumns:
                                        nestedAuditUnionColumns[nested.key] ??
                                        inferColumns(nested.records, {
                                          omitNestedAuditArrays: true,
                                        }).slice(0, MAX_TABLE_COLUMNS),
                                      visibleKeys: resolveNestedVisibleKeys(nested.key),
                                      onToggleColumn: (col, checked) =>
                                        toggleNestedAuditColumn(
                                          nested.key,
                                          col,
                                          checked,
                                        ),
                                      onSelectAll: () =>
                                        selectNestedAuditAll(nested.key),
                                      onDeselectAllButOne: () =>
                                        deselectNestedAuditAllButFirst(nested.key),
                                    }
                                  : null
                              }
                            />
                          ) : (
                            <pre className={chrome.nestedJsonPre}>
                              {nestedRecordsJsonPreview(nested.records)}
                            </pre>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {nestedDepth === 0 && snapshotProgram === "electrical_energy" ? (
        <div className="flex shrink-0 justify-end border-t border-border/80 bg-muted/10 px-3 py-2 sm:px-4">
          <ConsolidatedEnergyKpiSummaryModal
            sections={consolidatedKpiSections}
            rowCount={rows.length}
            visibleColumnCount={visibleColumns.length}
            totalColumnCount={allColumns.length}
            nestedAuditRollup={nestedAuditRollup}
          />
        </div>
      ) : null}
    </div>
  );
}

