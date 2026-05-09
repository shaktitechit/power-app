"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import {
  AuditSnapshotNestedTableProgram,
  MAX_TABLE_COLUMNS,
  NESTED_AUDIT_RECORD_KEYS_ORDER,
  cellPreview,
  computeExpandedNestedAuditColumnUnions,
  getNestedAuditRecords,
  humanizeNestedKey,
  inferColumns,
  isPlainObject,
  nestedRecordsJsonPreview,
  rollupNestedAuditArrays,
  shouldUseNestedRecordsTable,
} from "./audit-snapshot-table-utils";
import {
  downloadVisibleTableAsExcel,
  downloadVisibleTableAsPdf,
} from "./audit-snapshot-export-utils";
import { ColumnPickerToolbar } from "./audit-snapshot-column-picker";
import type { EnergyKpiSection } from "../energy/audit-snapshot-kpi-summary";
import { Button } from "@/components/ui/button";

export type NestedAuditTableColumnControl = {
  auditKey: string;
  allColumns: string[];
  visibleKeys: Set<string>;
  onToggleColumn: (col: string, checked: boolean) => void;
  onSelectAll: () => void;
  onDeselectAllButOne: () => void;
};

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
export function getAuditSnapshotTableChrome(
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
   */
  snapshotProgram?: AuditSnapshotNestedTableProgram;
  /** Optional extra classes on the outer table shell (chrome uses program accents by default). */
  className?: string;
  /** Optional KPI sections for export. */
  exportKpiSections?: EnergyKpiSection[];
  /** Optional footer component (e.g. for KPI Summary Modal) */
  footer?: React.ReactNode;
  /** Override inferred columns (useful for separate tab tables) */
  overrideColumns?: string[];
};

export function AuditSnapshotNestedRecordsTable({
  rows,
  nestedDepth = 0,
  nestedAuditColumnControl = null,
  includeUtilityAccountNumberColumn = false,
  snapshotProgram = "electrical_energy",
  className,
  exportKpiSections,
  footer,
  overrideColumns,
}: AuditSnapshotNestedRecordsTableProps) {
  const parentControlledColumns = nestedAuditColumnControl !== null;

  const chrome = useMemo(
    () => getAuditSnapshotTableChrome(snapshotProgram),
    [snapshotProgram],
  );

  const inferredColumns = useMemo(() => {
    if (overrideColumns && overrideColumns.length > 0) return overrideColumns;
    const cols = inferColumns(rows, { omitNestedAuditArrays: true });
    if (!includeUtilityAccountNumberColumn) return cols;
    const key = "utility_account_number";
    if (cols.includes(key)) return cols;
    const next = [key, ...cols].slice(0, MAX_TABLE_COLUMNS);
    return next;
  }, [rows, includeUtilityAccountNumberColumn, overrideColumns]);

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
                      kpiSections: exportKpiSections,
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
                      kpiSections: exportKpiSections,
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

      {footer && <div className="flex shrink-0 justify-end border-t border-border/80 bg-muted/10 px-3 py-2 sm:px-4">{footer}</div>}
    </div>
  );
}
