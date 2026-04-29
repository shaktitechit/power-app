import PDFDocument from "pdfkit";
import {
  drawCoverPage,
  drawFacilityInfoPage,
  drawMinimalCoverFromMeta,
} from "./drawCoverFacility.js";
import { drawSectionTitle, drawPageFooter } from "./drawPrimitives.js";
import { drawDataTable, drawSummaryObject } from "./drawTables.js";
import { renderPdfSection } from "./renderPdfSection.js";
import { shouldSkipRowKey, toLabel } from "./formatting.js";
import { PDF_THEME } from "./styles.js";
import { createUtilityAccountTintResolver } from "../utilityAccountSectionTint.js";

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

const collectDynamicSections = (reportData) => {
  const raw = [
    ...(Array.isArray(reportData?.sections) ? reportData.sections : []),
    ...(Array.isArray(reportData?.sheet_sections)
      ? reportData.sheet_sections
      : []),
    reportData?.hvac_sheet,
    reportData?.ac_sheet,
    reportData?.dg_sheet,
    reportData?.transformer_sheet,
    reportData?.pump_sheet,
  ].filter(Boolean);

  return dedupeSectionsByTitle(raw);
};

const isNonEmptyObject = (value) =>
  !!value && typeof value === "object" && Object.keys(value).length > 0;

const hasRenderableRows = (rows) => Array.isArray(rows) && rows.length > 0;

const hasRenderableBlock = (block) => {
  if (!block || typeof block !== "object") return false;
  if (block.type === "kv" || block.type === "table")
    return hasRenderableRows(block.rows || block.items);
  if (block.type === "summary") return isNonEmptyObject(block.data);
  if (block.type === "text") return Boolean(String(block.value || "").trim());
  return false;
};

const hasRenderableSubsection = (sub) => {
  if (!sub || typeof sub !== "object") return false;
  return hasRenderableRows(sub.rows);
};

const isRenderableSection = (section) => {
  if (!section || typeof section !== "object") return false;
  if (Array.isArray(section.blocks) && section.blocks.some(hasRenderableBlock))
    return true;
  if (Array.isArray(section.sections) && section.sections.some(hasRenderableSubsection))
    return true;
  if (hasRenderableRows(section.items) || hasRenderableRows(section.table_rows))
    return true;
  if (isNonEmptyObject(section.summary)) return true;
  return false;
};

const drawFallbackFlatSection = (doc, theme, title, items, tintResolver) => {
  if (!Array.isArray(items) || !items.length) return;

  let y = drawSectionTitle(doc, title, theme, doc.page.margins.top);
  const first = items[0] || {};
  const keys = Object.keys(first)
    .filter((k) => !shouldSkipRowKey(k))
    .slice(0, 18);

  if (!keys.length) return;

  const columns = keys.map((k) => ({ key: k, label: toLabel(k) }));
  drawDataTable(doc, theme, y, null, columns, items, tintResolver);
};

export const generatePdfReport = async ({ reportData }) => {
  const theme = PDF_THEME;
  const tintResolver = createUtilityAccountTintResolver();
  const doc = new PDFDocument({
    size: theme.page.size,
    margin: theme.page.margin,
    autoFirstPage: true,
  });
  let pageNumber = 1;
  const stampFooter = () => {
    // Single-pass footer avoids page re-entry artifacts in some PDF viewers.
    drawPageFooter(doc, pageNumber - 1, pageNumber, theme);
  };
  const nextPage = () => {
    stampFooter();
    doc.addPage();
    pageNumber += 1;
  };

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const bufferPromise = new Promise((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const meta = reportData?.meta || {};

  if (reportData?.cover) {
    drawCoverPage(doc, reportData.cover, meta, theme);
  } else {
    drawMinimalCoverFromMeta(doc, meta, theme);
  }

  const dynamicSections = collectDynamicSections(reportData).filter(
    isRenderableSection,
  );

  if (reportData?.facility_info) {
    nextPage();
    drawFacilityInfoPage(doc, reportData.facility_info, theme);
  }

  const hasTopSummary =
    reportData?.summary &&
    typeof reportData.summary === "object" &&
    Object.keys(reportData.summary).length > 0;

  if (hasTopSummary) {
    nextPage();
    let y = drawSectionTitle(
      doc,
      "Executive overview",
      theme,
      doc.page.margins.top,
    );
    drawSummaryObject(
      doc,
      theme,
      y,
      "Facility snapshot",
      reportData.summary,
      tintResolver,
    );
  }

  if (dynamicSections.length) {
    dynamicSections.forEach((section) => {
      nextPage();
      renderPdfSection(doc, section, theme, tintResolver);
    });
  } else {
    const fallbacks = [
      ["Utility accounts", reportData?.utility_accounts],
      ["Tariffs", reportData?.tariffs],
      ["Billing records", reportData?.billing_records],
      ["Solar systems", reportData?.solar_systems],
      ["DG sets", reportData?.dg_sets],
      ["Transformers", reportData?.transformers],
      ["Pumps", reportData?.pumps],
      ["HVAC records", reportData?.hvac_records],
      ["AC records", reportData?.ac_records],
      ["Fan records", reportData?.fan_records],
      ["Lighting records", reportData?.lighting_records],
      ["Lux records", reportData?.lux_records],
      ["Misc records", reportData?.misc_records],
      ["Recommendations", reportData?.recommendations],
    ];

    for (const [title, items] of fallbacks) {
      if (Array.isArray(items) && items.length) {
        nextPage();
        drawFallbackFlatSection(doc, theme, title, items, tintResolver);
      }
    }
  }

  stampFooter();
  doc.end();

  return bufferPromise;
};

export default generatePdfReport;
