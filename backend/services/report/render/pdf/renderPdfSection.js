import { drawSectionTitle } from "./drawPrimitives.js";
import {
  drawBlocks,
  drawDataTable,
  drawSubSection,
  drawSummaryObject,
} from "./drawTables.js";
import { PDF_THEME } from "./styles.js";

/**
 * Renders one logical report section (same shapes as Excel: blocks, sections, items, summary).
 * Caller is responsible for starting a new page before this when needed.
 */
export const renderPdfSection = (
  doc,
  section,
  theme = PDF_THEME,
  tintResolver = null,
) => {
  let y = doc.page.margins.top;
  const title = section?.title || section?.key || "Section";
  y = drawSectionTitle(doc, title, theme, y);

  if (Array.isArray(section?.blocks) && section.blocks.length) {
    return drawBlocks(doc, theme, y, section, tintResolver);
  }

  const hasSubSections =
    Array.isArray(section?.sections) && section.sections.length > 0;
  const hasItems =
    Array.isArray(section?.items) && section.items.length > 0;
  const hasSummary =
    section?.summary &&
    typeof section.summary === "object" &&
    Object.keys(section.summary).length > 0;

  if (hasSubSections) {
    section.sections.forEach((sub) => {
      y = drawSubSection(doc, theme, y, sub, tintResolver);
    });
  } else if (hasItems) {
    y = drawDataTable(
      doc,
      theme,
      y,
      null,
      section.table_columns || section.columns || [],
      section.table_rows || section.items || [],
      tintResolver,
    );
  }

  if (hasSummary && !hasSubSections) {
    y = drawSummaryObject(
      doc,
      theme,
      y,
      "Summary",
      section.summary,
      tintResolver,
    );
  }

  return y;
};
