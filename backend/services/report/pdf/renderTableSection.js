import { formatCellValue, normalizeColumns } from "./formatting.js";

/**
 * Plain-text table (e.g. logs). For PDF output use drawDataTable in drawTables.js.
 */
export const renderTableSection = (title, columns = [], rows = []) => {
  const cols = normalizeColumns(columns);
  if (!cols.length) return title || "";

  const header = cols.map((c) => c.label).join(" | ");
  const body = (rows || []).map((row) =>
    cols.map((c) => formatCellValue(row?.[c.key])).join(" | "),
  );
  return [title, header, ...body].filter(Boolean).join("\n");
};

export default renderTableSection;
