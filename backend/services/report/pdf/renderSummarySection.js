import { formatCellValue, toLabel } from "./formatting.js";

/**
 * Plain-text summary (e.g. logs or previews). For PDF output use drawSummaryObject in drawTables.js.
 */
export const renderSummarySection = (summary = {}, title = "Summary") => {
  const lines = [String(title)];
  Object.entries(summary || {}).forEach(([key, value]) => {
    lines.push(`- ${toLabel(key)}: ${formatCellValue(value)}`);
  });
  return lines.join("\n");
};

export default renderSummarySection;
