"use client";

import { BarChart3 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuditExplorerExpanded } from "../audit-snapshot-explorer-layout-context";
import {
  ISO_DATE_LIKE_RE,
  NESTED_AUDIT_RECORD_KEYS_ORDER,
  humanizeNestedKey,
  inferColumns,
  isPlainObject,
} from "../shared/audit-snapshot-table-utils";

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

export type EnergyAuditColumnKpi = {
  columnKey: string;
  label: string;
  value?: string | number | React.ReactNode;
};

export function computeEnergyAuditColumnKpis(
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

    let value: number;
    let titlePrefix = "";
    if (mode === "sum" || mode === "both") {
      value = sum;
      titlePrefix = "Total ";
    } else {
      value = average;
      titlePrefix = "Avg ";
    }

    out.push({
      columnKey: key,
      label: titlePrefix + humanizeNestedKey(key),
      value,
    });
  }

  out.sort((a, b) => a.label.localeCompare(b.label));

  return out.slice(0, MAX_KPI_METRICS);
}

export type EnergyKpiSection = {
  id: string;
  title: string;
  subtitle: string;
  displayMode?: "grid" | "table";
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

export function computeConsolidatedEnergyKpiSections(
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

export function formatKpiNumber(n: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(n);
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
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0">
              <span className="font-semibold tabular-nums text-foreground">
                {typeof kpi.value === "number" ? formatKpiNumber(kpi.value) : kpi.value}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EnergyKpiTable({ kpis }: { kpis: EnergyAuditColumnKpi[] }) {
  if (kpis.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-border/60 bg-card/90 shadow-xs">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 font-medium">Metric</th>
            <th className="px-4 py-2.5 font-medium">Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {kpis.map((kpi) => (
            <tr key={kpi.columnKey} className="hover:bg-muted/30">
              <td className="px-4 py-2 font-medium text-foreground">{kpi.label}</td>
              <td className="px-4 py-2 font-semibold tabular-nums text-foreground">
                {typeof kpi.value === "number" ? formatKpiNumber(kpi.value) : kpi.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type ConsolidatedEnergyKpiPanelProps = {
  sections: EnergyKpiSection[];
  rowCount: number;
  totalColumnCount: number;
  nestedAuditRollup: {
    totalNestedRecords: number;
    rowsWithNestedData: number;
  };
};

export function ConsolidatedEnergyKpiSummaryModal({
  sections,
  rowCount,
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
          <span className="font-medium text-foreground">
            {totalColumnCount}
          </span>{" "}
          columns
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
                {section.displayMode === "table" ? (
                  <EnergyKpiTable kpis={section.kpis} />
                ) : (
                  <EnergyKpiTileGrid kpis={section.kpis} />
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
