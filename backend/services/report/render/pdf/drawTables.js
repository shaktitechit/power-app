import {
  formatCellValue,
  getRowCell,
  isKeyValueSubsection,
  normalizeColumns,
  sanitizePdfText,
  toLabel,
  truncatePdfText,
} from "./formatting.js";
import { PDF_THEME } from "./styles.js";
import {
  contentLeft,
  contentWidth,
  drawSubsectionHeading,
  ensureSpace,
} from "./drawPrimitives.js";
import { getUtilityAccountSectionTintFromHeading } from "../utilityAccountSectionTint.js";

const resolveDataTintHex = (heading, tintResolver) => {
  if (!heading) return null;
  return tintResolver
    ? tintResolver.fromHeading(heading)?.hex ?? null
    : getUtilityAccountSectionTintFromHeading(heading)?.hex ?? null;
};

const kvKeys = (sub) => {
  const cols = sub.columns || [];
  const keys = cols.map((c) => (typeof c === "string" ? c : c?.key));
  return { labelKey: keys[0], valueKey: keys[1] };
};

export const drawKeyValueBlock = (
  doc,
  theme,
  y,
  heading,
  rows = [],
  labelKey = "label",
  valueKey = "value",
  tintResolver = null,
) => {
  const x = contentLeft(doc);
  const w = contentWidth(doc);
  let cursor = y;
  const blockTint = resolveDataTintHex(heading, tintResolver);

  if (heading) {
    cursor = drawSubsectionHeading(doc, heading, theme, cursor, tintResolver);
  }

  if (!Array.isArray(rows) || !rows.length) {
    cursor = ensureSpace(doc, cursor, 20);
    doc.save();
    doc
      .font(theme.font.family)
      .fontSize(theme.font.caption)
      .fillColor(theme.colors.muted)
      .text(sanitizePdfText("No data available", "kv-empty"), x, cursor, {
        width: w,
      });
    doc.restore();
    return doc.y + theme.spacing.blockGap;
  }

  const labelColW = Math.min(w * 0.36, 200);
  const valueColW = w - labelColW - 10;
  doc.font(theme.font.family).fontSize(theme.font.body);

  rows.forEach((row, i) => {
    const label = truncatePdfText(formatCellValue(row?.[labelKey]), 120);
    const value = truncatePdfText(formatCellValue(row?.[valueKey]), 240);
    if (!label && !value) return;

    const lh = doc.heightOfString(String(label), { width: labelColW - 14 });
    const vh = doc.heightOfString(String(value || "—"), {
      width: valueColW - 14,
    });
    const rowH = Math.max(lh, vh, 12) + 12;
    cursor = ensureSpace(doc, cursor, rowH);

    if (blockTint || i % 2 === 0) {
      doc.save();
      doc
        .rect(x, cursor, w, rowH)
        .fill(blockTint || theme.colors.accentLight);
      doc.restore();
    }

    doc.save();
    doc
      .fillColor(theme.colors.text)
      .font(theme.font.familyBold)
      .fontSize(theme.font.body)
      .text(String(label), x + 8, cursor + 6, { width: labelColW - 14 });
    doc
      .font(theme.font.family)
      .fontSize(theme.font.body)
      .text(String(value || "—"), x + labelColW + 6, cursor + 6, {
        width: valueColW - 14,
        lineGap: 1,
      });
    doc.restore();
    cursor += rowH;
  });

  return cursor + theme.spacing.blockGap;
};

export const drawDataTable = (
  doc,
  theme,
  y,
  heading,
  columns = [],
  rows = [],
  tintResolver = null,
) => {
  const x = contentLeft(doc);
  const totalWidth = contentWidth(doc);
  const cols = normalizeColumns(columns);
  if (!cols.length) return y;

  let cursor = y;
  const blockTint = resolveDataTintHex(heading, tintResolver);
  if (heading) {
    cursor = drawSubsectionHeading(doc, heading, theme, cursor, tintResolver);
  }

  if (!Array.isArray(rows) || !rows.length) {
    cursor = ensureSpace(doc, cursor, 20);
    doc.save();
    doc
      .font(theme.font.family)
      .fontSize(theme.font.caption)
      .fillColor(theme.colors.muted)
      .text(sanitizePdfText("No data available", "table-empty"), x, cursor, {
        width: totalWidth,
      });
    doc.restore();
    return doc.y + theme.spacing.blockGap;
  }

  const n = cols.length;
  const gap = 2;
  const cellPad = 4;
  const colW = (totalWidth - gap * (n - 1)) / n;
  const headerSize =
    n > 12 ? 6.5 : n > 8 ? 7 : theme.font.tableHeader;
  const bodySize =
    n > 12 ? 6 : n > 8 ? 6.5 : theme.font.tableBody;

  doc.font(theme.font.familyBold).fontSize(headerSize);
  let headerTextH = 0;
  cols.forEach((c) => {
    const h = doc.heightOfString(c.label, { width: colW - 2 * cellPad });
    headerTextH = Math.max(headerTextH, h);
  });
  const headerRowH = Math.max(headerTextH + 10, 18);
  cursor = ensureSpace(doc, cursor, headerRowH + 4);

  doc.save();
  doc.rect(x, cursor, totalWidth, headerRowH).fill(theme.colors.headerBg);
  cols.forEach((c, i) => {
    const cx = x + i * (colW + gap);
    doc
      .fillColor(theme.colors.headerText)
      .font(theme.font.familyBold)
      .fontSize(headerSize)
      .text(sanitizePdfText(c.label, "table-header"), cx + cellPad, cursor + 5, {
        width: colW - 2 * cellPad,
        lineGap: 0.5,
      });
  });
  doc.restore();
  cursor += headerRowH;

  doc.font(theme.font.family).fontSize(bodySize).fillColor(theme.colors.text);

  rows.forEach((row, ri) => {
    const vals = cols.map((c) =>
      truncatePdfText(getRowCell(row, c.key, c), 120),
    );
    let rowH = 0;
    vals.forEach((v, i) => {
      const h = doc.heightOfString(v || "—", {
        width: colW - 2 * cellPad,
      });
      rowH = Math.max(rowH, h + 8);
    });
    rowH = Math.max(rowH, 16);
    cursor = ensureSpace(doc, cursor, rowH + 1);

    if (blockTint || ri % 2 === 1) {
      doc.save();
      doc
        .rect(x, cursor, totalWidth, rowH)
        .fill(blockTint || theme.colors.zebra);
      doc.restore();
    }

    vals.forEach((v, i) => {
      const cx = x + i * (colW + gap);
      doc
        .fillColor(theme.colors.text)
        .text(v || "—", cx + cellPad, cursor + 4, {
          width: colW - 2 * cellPad,
          lineGap: 0.5,
        });
    });
    cursor += rowH;
    doc.save();
    doc.strokeColor(theme.colors.border).lineWidth(0.25);
    doc.moveTo(x, cursor).lineTo(x + totalWidth, cursor).stroke();
    doc.restore();
  });

  return cursor + theme.spacing.blockGap;
};

export const drawSummaryObject = (
  doc,
  theme,
  y,
  title,
  summaryObj,
  tintResolver = null,
) => {
  const entries = Object.entries(summaryObj || {}).filter(
    ([k]) => k && !String(k).startsWith("__"),
  );
  if (!entries.length) return y;

  const rows = entries.map(([key, value]) => ({
    label: toLabel(key),
    value: formatCellValue(value),
  }));
  return drawKeyValueBlock(
    doc,
    theme,
    y,
    title || "Summary",
    rows,
    "label",
    "value",
    tintResolver,
  );
};

export const drawSubSection = (doc, theme, y, sub, tintResolver = null) => {
  if (!sub) return y;
  const heading = sub.heading || "";
  const columns = sub.columns || [];
  const rows = sub.rows || [];

  if (isKeyValueSubsection(sub)) {
    const { labelKey, valueKey } = kvKeys(sub);
    return drawKeyValueBlock(
      doc,
      theme,
      y,
      heading,
      rows,
      labelKey,
      valueKey,
      tintResolver,
    );
  }

  return drawDataTable(doc, theme, y, heading, columns, rows, tintResolver);
};

export const drawBlocks = (doc, theme, y, section, tintResolver = null) => {
  const blocks = section?.blocks;
  if (!Array.isArray(blocks)) return y;
  let cursor = y;

  blocks.forEach((block) => {
    if (!block) return;
    if (block.type === "kv") {
      cursor = drawKeyValueBlock(
        doc,
        theme,
        cursor,
        block.heading,
        block.rows || [],
        "label",
        "value",
        tintResolver,
      );
      return;
    }
    if (block.type === "table") {
      cursor = drawDataTable(
        doc,
        theme,
        cursor,
        block.heading,
        block.columns || [],
        block.items || [],
        tintResolver,
      );
      return;
    }
    if (block.type === "summary") {
      cursor = drawSummaryObject(
        doc,
        theme,
        cursor,
        block.heading || "Summary",
        block.data || {},
        tintResolver,
      );
      return;
    }
    if (block.type === "text") {
      if (block.heading) {
        cursor = drawSubsectionHeading(
          doc,
          block.heading,
          theme,
          cursor,
          tintResolver,
        );
      }
      const x = contentLeft(doc);
      const w = contentWidth(doc);
      const text = truncatePdfText(formatCellValue(block.value || ""), 2000);
      const h = doc.heightOfString(text, { width: w });
      cursor = ensureSpace(doc, cursor, h + 16);
      doc.save();
      doc
        .font(theme.font.family)
        .fontSize(theme.font.body)
        .fillColor(theme.colors.text)
        .text(text, x, cursor, { width: w, lineGap: 2 });
      doc.restore();
      cursor = doc.y + theme.spacing.blockGap;
    }
  });

  return cursor;
};
