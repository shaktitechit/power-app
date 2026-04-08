export const toLabel = (key) =>
  String(key || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const formatCellValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object" ? JSON.stringify(item) : String(item),
      )
      .join(", ");
  }
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
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
