export const toLabel = (key) =>
  String(key || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

// Strip bidi/control marks that can trigger mirrored/reordered text in PDFs.
const BIDI_AND_CONTROL_RE = /[\u200E\u200F\u202A-\u202E\u2066-\u2069\u0000-\u001F\u007F]/g;

const shouldDebugPdfText = process.env.PDF_DEBUG_TEXT === "true";

const codePoints = (value) =>
  Array.from(String(value ?? ""))
    .map((ch) => `U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`)
    .join(" ");

export const sanitizePdfText = (input, context = "unknown") => {
  const original = String(input ?? "");
  const cleaned = original.replace(BIDI_AND_CONTROL_RE, "").replace(/\s+/g, " ").trim();

  if (shouldDebugPdfText && cleaned !== original) {
    console.warn("[pdf-text-debug] sanitized text", {
      context,
      original,
      cleaned,
      originalCodePoints: codePoints(original),
      cleanedCodePoints: codePoints(cleaned),
    });
  }

  return cleaned;
};

export const truncatePdfText = (input, maxLength = 300) => {
  const text = sanitizePdfText(input);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 1))}\u2026`;
};

export const formatCellValue = (value) => {
  if (value === null || value === undefined) return "";
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
    return { key, label: col.label || toLabel(key) };
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

export const getRowCell = (row, key) => {
  if (!row || typeof row !== "object") return "";
  const v = row[key];
  return formatCellValue(v);
};
