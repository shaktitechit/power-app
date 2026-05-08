import ExcelJS from "exceljs";
import { buildExcelNumFmt } from "../columnMeta.js";
import {
  createUtilityAccountTintResolver,
  getUtilityAccountSectionTintFromHeading,
} from "../utilityAccountSectionTint.js";

const toLabel = (key) =>
  String(key || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const sanitizeValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item)).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return value;
};

const getFlatColumns = (items = []) => {
  const columnSet = new Set();

  items.forEach((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;

    Object.keys(item)
      .filter((key) => !key.startsWith("__"))
      .forEach((key) => {
        columnSet.add(key);
      });
  });

  return [...columnSet];
};

const normalizeColumns = (items = [], explicitColumns = null) => {
  if (Array.isArray(explicitColumns) && explicitColumns.length) {
    return explicitColumns
      .map((col) =>
        typeof col === "string"
          ? { key: col, label: toLabel(col) }
          : {
              key: col?.key,
              label: col?.label || toLabel(col?.key),
              decimals: col?.decimals,
              type: col?.type,
            },
      )
      .filter((col) => col?.key);
  }

  const derivedColumns =
    Array.isArray(items) && items.length && Array.isArray(items[0]?.__columns)
      ? items[0].__columns
      : getFlatColumns(items);

  return derivedColumns
    .map((col) =>
      typeof col === "string"
        ? { key: col, label: toLabel(col) }
        : {
            key: col?.key,
            label: col?.label || toLabel(col?.key),
            decimals: col?.decimals,
            type: col?.type,
          },
    )
    .filter((col) => col?.key);
};

/** Excel cell: real numbers + numFmt (not plain-text numbers) */
const setDataCell = (cell, raw, col = {}) => {
  if (raw === null || raw === undefined || raw === "") {
    cell.value = null;
    return;
  }

  if (typeof raw === "number" && Number.isFinite(raw)) {
    cell.value = raw;

    if (col.type === "integer") {
      cell.numFmt = buildExcelNumFmt(0, true);
      return;
    }

    if (col.decimals !== undefined && col.decimals !== null) {
      const d = col.decimals;
      cell.numFmt = buildExcelNumFmt(d, d === 0);
      return;
    }

    if (Number.isInteger(raw)) {
      cell.numFmt = buildExcelNumFmt(0, true);
      return;
    }

    if (Math.abs(raw) < 1 && Math.abs(raw) > 0) {
      cell.numFmt = buildExcelNumFmt(4, false);
      return;
    }

    cell.numFmt = buildExcelNumFmt(2, false);
    return;
  }

  cell.value = sanitizeValue(raw);
};

const autoFitColumns = (sheet, minWidth = 14, maxWidth = 40) => {
  if (!sheet?.columns?.length) return;

  sheet.columns.forEach((column) => {
    let longest = minWidth;

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const value = cell.value ? String(cell.value) : "";
      if (value.length + 2 > longest) {
        longest = value.length + 2;
      }
    });

    column.width = Math.min(longest, maxWidth);
  });
};

const applyTitleStyle = (row) => {
  row.font = { bold: true, size: 14 };
  row.alignment = { vertical: "middle", horizontal: "left" };
};

const applySubTitleStyle = (row) => {
  row.font = { bold: true, size: 12 };
  row.alignment = { vertical: "middle", horizontal: "left" };
};

const getTintArgb = (text, tintResolver) =>
  tintResolver
    ? (tintResolver.fromHeading(text)?.argb ?? null)
    : (getUtilityAccountSectionTintFromHeading(text)?.argb ?? null);

const applyRowFill = (row, tint) => {
  if (!tint) return;
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: tint },
    };
  });
};

const applyHeaderStyle = (row) => {
  row.font = { bold: true };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };

  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
};

const applyBodyBorders = (row) => {
  row.eachCell((cell) => {
    cell.alignment = { vertical: "top", wrapText: true };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
};

/** Excel worksheet names cannot contain * ? : \ / [ ] — max length 31. */
const EXCEL_SHEET_INVALID_CHARS = /[\*\?\:\\\/\[\]]/g;

const sanitizeWorksheetTitle = (raw) => {
  let s = String(raw ?? "")
    .replace(EXCEL_SHEET_INVALID_CHARS, "-")
    .replace(/-+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^['\s-]+|['\s-]+$/g, "")
    .trim();

  if (!s) s = "Sheet";
  if (/^history$/i.test(s)) s = "Sheet_History";
  return s.slice(0, 31);
};

const getUniqueSheetName = (workbook, baseName = "Sheet") => {
  const cleanBase = sanitizeWorksheetTitle(baseName);
  let candidate = cleanBase.slice(0, 31);
  let counter = 1;

  while (workbook.getWorksheet(candidate)) {
    const suffix = `_${counter}`;
    const allowedBaseLength = 31 - suffix.length;
    candidate = `${cleanBase.slice(0, allowedBaseLength)}${suffix}`;
    counter += 1;
  }

  return candidate;
};

const createWorksheet = (workbook, title) => {
  const uniqueName = getUniqueSheetName(workbook, title);
  return workbook.addWorksheet(uniqueName);
};

const addHeadingRow = (sheet, text, mergeTillCol = 6) => {
  const row = sheet.addRow([sanitizeValue(text)]);
  applyTitleStyle(row);

  const endCol = Math.max(mergeTillCol, 1);
  if (endCol > 1) {
    sheet.mergeCells(row.number, 1, row.number, endCol);
  }

  return row;
};

const addSubHeadingRow = (
  sheet,
  text,
  mergeTillCol = 6,
  tintResolver = null,
) => {
  const row = sheet.addRow([sanitizeValue(text)]);
  applySubTitleStyle(row);
  const tint = getTintArgb(text, tintResolver);

  const endCol = Math.max(mergeTillCol, 1);
  if (endCol > 1) {
    sheet.mergeCells(row.number, 1, row.number, endCol);
  }

  if (tint) {
    row.getCell(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: tint },
    };
  }

  return row;
};

const addEmptyStateRow = (
  sheet,
  text = "No data available",
  mergeTillCol = 4,
) => {
  const row = sheet.addRow([text]);
  const endCol = Math.max(mergeTillCol, 1);

  if (endCol > 1) {
    sheet.mergeCells(row.number, 1, row.number, endCol);
  }

  row.alignment = { vertical: "middle", horizontal: "left" };
  return row;
};

const addKeyValueBlock = (sheet, heading, rows = [], tintResolver = null) => {
  const tint = getTintArgb(heading, tintResolver);
  if (heading) {
    addSubHeadingRow(sheet, heading, 4, tintResolver);
  }

  if (!Array.isArray(rows) || !rows.length) {
    addEmptyStateRow(sheet, "No data available", 4);
    sheet.addRow([]);
    return;
  }

  rows.forEach((entry) => {
    if (Array.isArray(entry)) {
      const row = sheet.addRow([
        sanitizeValue(entry[0]),
        sanitizeValue(entry[1]),
      ]);
      setDataCell(row.getCell(2), entry[1], {});
      applyBodyBorders(row);
      applyRowFill(row, tint);
      return;
    }

    if (entry && typeof entry === "object") {
      const row = sheet.addRow([
        sanitizeValue(entry.label || entry.key || ""),
        sanitizeValue(entry.value),
      ]);
      setDataCell(row.getCell(2), entry.value, {});
      applyBodyBorders(row);
      applyRowFill(row, tint);
    }
  });

  sheet.addRow([]);
};

const addTableBlock = (
  sheet,
  heading,
  columns = [],
  items = [],
  tintResolver = null,
) => {
  const normalizedColumns = normalizeColumns(items, columns);
  const mergeTillCol = Math.max(normalizedColumns.length || 1, 4);
  const tint = getTintArgb(heading, tintResolver);

  if (heading) {
    addSubHeadingRow(sheet, heading, mergeTillCol, tintResolver);
  }

  if (!normalizedColumns.length) {
    addEmptyStateRow(sheet, "No data available", mergeTillCol);
    sheet.addRow([]);
    return;
  }

  const headerRow = sheet.addRow(normalizedColumns.map((col) => col.label));
  applyHeaderStyle(headerRow);
  applyRowFill(headerRow, tint);

  if (!Array.isArray(items) || !items.length) {
    addEmptyStateRow(sheet, "No data available", mergeTillCol);
    sheet.addRow([]);
    return;
  }

  items.forEach((item) => {
    const row = sheet.addRow([]);
    normalizedColumns.forEach((col, idx) => {
      setDataCell(row.getCell(idx + 1), item?.[col.key], col);
    });
    applyBodyBorders(row);
    applyRowFill(row, tint);
  });

  sheet.addRow([]);
};

const addMultiBlockSheet = (workbook, section = {}, tintResolver = null) => {
  if (!section || !Array.isArray(section.blocks) || !section.blocks.length) {
    return;
  }

  const sheet = createWorksheet(workbook, section.title || "Sheet");

  addHeadingRow(sheet, section.title || "Sheet", 6);
  sheet.addRow([]);

  section.blocks.forEach((block) => {
    if (!block) return;

    if (block.type === "kv") {
      addKeyValueBlock(sheet, block.heading, block.rows || [], tintResolver);
      return;
    }

    if (block.type === "table") {
      addTableBlock(
        sheet,
        block.heading,
        block.columns || [],
        block.items || [],
        tintResolver,
      );
      return;
    }

    if (block.type === "summary") {
      addKeyValueBlock(
        sheet,
        block.heading || "Summary",
        Object.entries(block.data || {}).map(([key, value]) => [
          toLabel(key),
          value,
        ]),
        tintResolver,
      );
      return;
    }

    if (block.type === "text") {
      if (block.heading) {
        addSubHeadingRow(sheet, block.heading, 6, tintResolver);
      }

      sheet.addRow([sanitizeValue(block.value || "")]);
      sheet.addRow([]);
    }
  });

  autoFitColumns(sheet);
};

const isKeyValueSection = (subSection) => {
  if (!Array.isArray(subSection?.columns) || subSection.columns.length !== 2) {
    return false;
  }

  const [first, second] = subSection.columns;
  return first === "label" && second === "value";
};

const addSectionWithSubsections = (
  workbook,
  section = {},
  tintResolver = null,
) => {
  if (!section) return;

  const hasSubSections =
    Array.isArray(section.sections) && section.sections.length > 0;

  const hasItems = Array.isArray(section.items) && section.items.length > 0;

  const hasSummary =
    section.summary &&
    typeof section.summary === "object" &&
    Object.keys(section.summary).length > 0;

  if (!hasSubSections && !hasItems && !hasSummary) return;

  const sheet = createWorksheet(
    workbook,
    section.title || section.key || "Section",
  );

  addHeadingRow(sheet, section.title || section.key || "Section", 8);
  sheet.addRow([]);

  if (hasSubSections) {
    section.sections.forEach((subSection) => {
      if (!subSection) return;

      const rows = Array.isArray(subSection.rows) ? subSection.rows : [];
      const columns = Array.isArray(subSection.columns)
        ? subSection.columns
        : [];

      if (isKeyValueSection(subSection)) {
        addKeyValueBlock(sheet, subSection.heading, rows, tintResolver);
        return;
      }

      addTableBlock(sheet, subSection.heading, columns, rows, tintResolver);
    });
  } else if (hasItems) {
    addTableBlock(
      sheet,
      section.title || section.key || "Section",
      section.table_columns || section.columns || [],
      section.table_rows || section.items || [],
      tintResolver,
    );
  }

  // Section builders already embed a "* Summary" table inside `section.sections`
  // and also expose the same metrics on `section.summary` for aggregates / PDF.
  // Rendering both produces a duplicate "Summary" block on the sheet.
  if (hasSummary && !hasSubSections) {
    addKeyValueBlock(
      sheet,
      "Summary",
      Object.entries(section.summary).map(([key, value]) => [
        toLabel(key),
        sanitizeValue(value),
      ]),
      tintResolver,
    );
  }

  autoFitColumns(sheet);
};

const dedupeSectionsByTitle = (sections = []) => {
  const seen = new Set();
  const result = [];

  sections.forEach((section) => {
    if (!section) return;

    const title = String(section.title || section.key || "Section").trim();
    const signature = JSON.stringify({
      title,
      sections: Array.isArray(section.sections)
        ? section.sections.map((s) => s?.heading || "")
        : [],
      itemsLength: Array.isArray(section.items) ? section.items.length : 0,
      blocksLength: Array.isArray(section.blocks) ? section.blocks.length : 0,
    });

    if (seen.has(signature)) return;
    seen.add(signature);
    result.push(section);
  });

  return result;
};

const addDynamicSectionSheets = (workbook, reportData, tintResolver = null) => {
  const sectionList = dedupeSectionsByTitle(reportData?.sections || []);

  sectionList.forEach((section) => {
    if (!section) return;

    if (Array.isArray(section.blocks) && section.blocks.length) {
      addMultiBlockSheet(workbook, section, tintResolver);
      return;
    }

    addSectionWithSubsections(workbook, section, tintResolver);
  });

  const extraSheets = [
    reportData?.hvac_sheet,
    reportData?.ac_sheet,
    reportData?.dg_sheet,
    reportData?.transformer_sheet,
    reportData?.pump_sheet,
  ].filter((item) => item?.blocks?.length);

  dedupeSectionsByTitle(extraSheets).forEach((section) => {
    addMultiBlockSheet(workbook, section, tintResolver);
  });

  if (Array.isArray(reportData?.sheet_sections)) {
    dedupeSectionsByTitle(reportData.sheet_sections).forEach((section) => {
      addMultiBlockSheet(workbook, section, tintResolver);
    });
  }
};

export const generateExcelReport = async ({ reportData }) => {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "Power Audit System";
  workbook.created = new Date();
  workbook.modified = new Date();

  const metaSheet = createWorksheet(workbook, "Report");

  metaSheet.columns = [
    { header: "Field", key: "field", width: 28 },
    { header: "Value", key: "value", width: 50 },
  ];

  const titleRow = metaSheet.addRow(["Report Metadata"]);
  applyTitleStyle(titleRow);
  metaSheet.mergeCells(titleRow.number, 1, titleRow.number, 2);

  metaSheet.addRow([]);

  const metaHeaderRow = metaSheet.addRow(["Field", "Value"]);
  applyHeaderStyle(metaHeaderRow);

  const metaRows = [
    {
      field: "Title",
      value: sanitizeValue(reportData?.meta?.title || "Report"),
    },
    {
      field: "Scope",
      value: sanitizeValue(reportData?.meta?.report_scope || ""),
    },
    {
      field: "Type",
      value: sanitizeValue(reportData?.meta?.report_type || ""),
    },
    {
      field: "Generated At",
      value: reportData?.meta?.generated_at
        ? new Date(reportData.meta.generated_at).toISOString()
        : new Date().toISOString(),
    },
  ];

  metaRows.forEach((item) => {
    const row = metaSheet.addRow(item);
    applyBodyBorders(row);
  });

  if (reportData?.summary && Object.keys(reportData.summary).length) {
    metaSheet.addRow([]);
    const summaryHeading = metaSheet.addRow(["Summary"]);
    applySubTitleStyle(summaryHeading);
    metaSheet.mergeCells(summaryHeading.number, 1, summaryHeading.number, 2);

    Object.entries(reportData.summary).forEach(([key, value]) => {
      const row = metaSheet.addRow([toLabel(key), sanitizeValue(value)]);
      applyBodyBorders(row);
    });
  }

  autoFitColumns(metaSheet);

  const tintResolver = createUtilityAccountTintResolver();

  /** Multi-block checklist sheets: one combined sheet per utility account (facility) or single sheet (utility scope). */
  const isCombinedSafetyChecklistSheet = (s) =>
    s?.key === "safety_audit_combined" ||
    (typeof s?.key === "string" && s.key.startsWith("safety_audit_ua_"));

  const combinedSafetySheets = (reportData?.sheet_sections || []).filter(
    isCombinedSafetyChecklistSheet,
  );

  if (combinedSafetySheets.length > 0) {
    combinedSafetySheets.forEach((section) =>
      addMultiBlockSheet(workbook, section, tintResolver),
    );

    const otherSections = (reportData?.sections || []).filter(
      (s) => !s.key?.startsWith("safety_"),
    );

    const otherSheetSections = (reportData?.sheet_sections || []).filter(
      (s) => !isCombinedSafetyChecklistSheet(s),
    );

    addDynamicSectionSheets(
      workbook,
      {
        ...reportData,
        sections: otherSections,
        sheet_sections: otherSheetSections,
      },
      tintResolver,
    );
  } else {
    addDynamicSectionSheets(workbook, reportData, tintResolver);
  }

  const uint8 = await workbook.xlsx.writeBuffer();
  return Buffer.from(uint8);
};

export default generateExcelReport;
