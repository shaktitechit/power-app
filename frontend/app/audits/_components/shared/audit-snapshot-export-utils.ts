import { toast } from "sonner";
import {
  AuditSnapshotNestedTableProgram,
  MAX_TABLE_COLUMNS,
  NESTED_AUDIT_RECORD_KEYS_ORDER,
  cellPreview,
  humanizeNestedKey,
  inferColumns,
  isPlainObject,
} from "./audit-snapshot-table-utils";
import type { EnergyKpiSection } from "../energy/audit-snapshot-kpi-summary";
import { formatKpiNumber } from "../energy/audit-snapshot-kpi-summary";

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
    ["Metric", "Value"],
    // ["Section", "Metric", "Value"],
  ];

  for (const section of sections) {
    if (!section.kpis.length) continue;
    for (const kpi of section.kpis) {
      let finalValue: string | number = "";

      if (typeof kpi.value === "number") {
        finalValue = formatKpiNumber(kpi.value);
      } else if (typeof kpi.value === "string") {
        finalValue = kpi.value;
      } else if (kpi.value != null) {
        // Fallback for React nodes or other objects: try to stringify
        finalValue = String(kpi.value);
      }

      aoa.push([
        // section.title,
        kpi.label,
        finalValue,
      ]);
    }
  }

  return aoa;
}

export async function downloadVisibleTableAsExcel(args: {
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

export async function downloadVisibleTableAsPdf(args: {
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
