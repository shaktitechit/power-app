import { formatNumericForDisplay } from "../columnMeta.js";

export const toLabel = (key) =>
  String(key || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Strip bidi marks that can trigger mirrored/reordered text in PDFs.
const BIDI_MARKS_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;
// Convert control chars (incl. CR/LF/TAB) to spaces so words don't get merged.
const CONTROL_CHARS_RE = /[\u0000-\u001F\u007F]/g;

export const sanitizePdfText = (input, context = "unknown") => {
  const original = String(input ?? "");
  const cleaned = original
    .replace(BIDI_MARKS_RE, "")
    .replace(CONTROL_CHARS_RE, " ")
    .replace(/\s+/g, " ")
    .trim();

  return cleaned;
};

export const truncatePdfText = (input, maxLength = 300) => {
  const text = sanitizePdfText(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}\u2026`;
};

export const formatCellValue = (value, col = null) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return sanitizePdfText(formatNumericForDisplay(value, col || {}));
  }
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    const joined = value
      .map((item) =>
        typeof item === "object" ? JSON.stringify(item) : String(item),
      )
      .join(", ");
    return sanitizePdfText(joined);
  }
  if (typeof value === "object") {
    try {
      return sanitizePdfText(JSON.stringify(value));
    } catch {
      return sanitizePdfText(String(value));
    }
  }
  return sanitizePdfText(String(value));
};

/** Skip internal / bulky keys when dumping row objects as fallback */
export const shouldSkipRowKey = (key) => {
  if (!key || typeof key !== "string") return true;
  if (key.startsWith("__")) return true;
  if (key === "documents" || key === "display_rows" || key === "summary_cards")
    return true;
  return false;
};

export const normalizeColumn = (col) => {
  if (typeof col === "string") {
    return { key: col, label: toLabel(col) };
  }
  if (col && typeof col === "object") {
    const key = col.key;
    if (!key) return null;
    return {
      key,
      label: col.label || toLabel(key),
      decimals: col.decimals,
      type: col.type,
    };
  }
  return null;
};

export const normalizeColumns = (columns = []) => {
  if (!Array.isArray(columns)) return [];
  return columns.map(normalizeColumn).filter(Boolean);
};

export const isKeyValueSubsection = (subSection) => {
  if (!Array.isArray(subSection?.columns) || subSection.columns.length !== 2) {
    return false;
  }
  const [first, second] = subSection.columns.map((c) =>
    typeof c === "string" ? c : c?.key,
  );
  const pairs = [
    ["label", "value"],
    ["field", "value"],
    ["metric", "value"],
  ];
  return pairs.some(([a, b]) => first === a && second === b);
};

export const getRowCell = (row, key, col = null) => {
  if (!row || typeof row !== "object") return "";
  const v = row[key];
  return formatCellValue(v, col);
};
