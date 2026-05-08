/**
 * Shared column metadata for Excel (numFmt) and PDF (decimal display).
 * Use { key, label, decimals?, type?: 'integer' | 'number' } in table_columns / section columns.
 */

export const buildExcelNumFmt = (decimals, useIntegerStyle) => {
  if (useIntegerStyle) return "#,##0";
  const d = Math.min(15, Math.max(0, Number(decimals) || 2));
  if (d === 0) return "#,##0";
  return `#,##0.${"0".repeat(d)}`;
};

/** Format a numeric cell for PDF/plain text when value is a number */
export const formatNumericForDisplay = (value, col = {}) => {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value !== "number" || !Number.isFinite(value))
    return String(value);

  if (col.type === "integer") return String(Math.round(value));

  let decimals = col.decimals;
  if (decimals === undefined) {
    if (Number.isInteger(value)) decimals = 0;
    else if (Math.abs(value) < 1 && Math.abs(value) > 0) decimals = 4;
    else decimals = 2;
  }

  if (decimals <= 0) return String(Math.round(value));
  return value.toFixed(Math.min(15, decimals));
};

/** Combined column definitions for safety audit sections */
/**
 * Combined columns for safety audit sheet
 * Ensures consistent formatting across all safety sections
 */
export const SAFETY_AUDIT_COMBINED_COLUMNS = Object.freeze([
  { key: "section", label: "Audit Section", width: 30 },
  { key: "checkpoint", label: "Safety Checkpoint", width: 40 },
  { key: "observation", label: "Observation", width: 50 },
  { key: "severity", label: "Severity", width: 15 },
  { key: "recommendation", label: "Recommendation", width: 50 },
  { key: "due_date", label: "Due Date", width: 15, type: "date" },
  { key: "status", label: "Status", width: 15 },
]);
