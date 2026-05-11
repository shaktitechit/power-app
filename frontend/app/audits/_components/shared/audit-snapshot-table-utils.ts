export function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function humanizeNestedKey(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function extractAllDocuments(obj: any, uan: string, prefix: string = "Utility Account"): any[] {
  if (!obj || typeof obj !== "object") return [];
  let docs: any[] = [];
  
  if (Array.isArray(obj.documents)) {
    docs.push(...obj.documents.map((d: any) => ({
      ...d,
      utility_account_number: uan,
      sourceType: prefix
    })));
  }

  for (const key of Object.keys(obj)) {
    if (key === "documents" || key === "utility_account") continue;
    const val = obj[key];
    if (Array.isArray(val)) {
      for (const item of val) {
        docs.push(...extractAllDocuments(item, uan, humanizeNestedKey(key)));
      }
    } else if (typeof val === "object" && val !== null) {
      docs.push(...extractAllDocuments(val, uan, prefix));
    }
  }

  return docs;
}

/** Hide Mongo/ObjectId-style keys from tables and JSON previews. */
export function isIdLikeFieldKey(key: string): boolean {
  if (key.startsWith("__")) return true;
  if (key === "_id" || key === "id") return true;
  if (/_id$/i.test(key)) return true;
  return false;
}

/** Nested audit arrays on equipment docs (energy snapshot aggregate). */
export const NESTED_AUDIT_RECORD_KEYS_ORDER = [
  "solar_generation_records",
  "dg_audit_records",
  "transformer_audit_records",
  "pump_audit_records",
] as const;

export const NESTED_AUDIT_RECORD_KEYS = new Set<string>(
  NESTED_AUDIT_RECORD_KEYS_ORDER,
);

export function rollupNestedAuditArrays(rows: unknown[]): {
  totalNestedRecords: number;
  rowsWithNestedData: number;
} {
  let totalNestedRecords = 0;
  let rowsWithNestedData = 0;
  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    let rowSum = 0;
    for (const k of NESTED_AUDIT_RECORD_KEYS_ORDER) {
      const v = row[k];
      if (Array.isArray(v)) rowSum += v.length;
    }
    totalNestedRecords += rowSum;
    if (rowSum > 0) rowsWithNestedData += 1;
  }
  return { totalNestedRecords, rowsWithNestedData };
}

export function getNestedAuditRecords(
  row: unknown,
): { key: string; records: unknown[] } | null {
  if (!isPlainObject(row)) return null;
  for (const k of NESTED_AUDIT_RECORD_KEYS_ORDER) {
    const v = row[k];
    if (Array.isArray(v) && v.length > 0) {
      return { key: k, records: v };
    }
  }
  return null;
}

export function nestedAuditTypeSortIndex(key: string): number {
  const i = NESTED_AUDIT_RECORD_KEYS_ORDER.indexOf(
    key as (typeof NESTED_AUDIT_RECORD_KEYS_ORDER)[number],
  );
  return i === -1 ? 999 : i;
}

/** Union inferred columns for each nested audit type currently expanded on equipment rows. */
export function computeExpandedNestedAuditColumnUnions(
  rows: unknown[],
  expandedRows: Set<number>,
): { expandedKeys: string[]; unionByKey: Record<string, string[]> } {
  const keySeen = new Set<string>();
  const orderedKeys: string[] = [];
  for (const idx of expandedRows) {
    const row = rows[idx];
    const nest = isPlainObject(row) ? getNestedAuditRecords(row) : null;
    if (!nest) continue;
    if (!keySeen.has(nest.key)) {
      keySeen.add(nest.key);
      orderedKeys.push(nest.key);
    }
  }
  orderedKeys.sort(
    (a, b) => nestedAuditTypeSortIndex(a) - nestedAuditTypeSortIndex(b),
  );

  const unionSets: Record<string, Set<string>> = {};
  for (const nk of orderedKeys) {
    unionSets[nk] = new Set();
  }

  for (const idx of expandedRows) {
    const row = rows[idx];
    const nest = isPlainObject(row) ? getNestedAuditRecords(row) : null;
    if (!nest) continue;
    inferColumns(nest.records, { omitNestedAuditArrays: true }).forEach((c) =>
      unionSets[nest.key]?.add(c),
    );
  }

  const unionByKey: Record<string, string[]> = {};
  for (const nk of orderedKeys) {
    unionByKey[nk] = [...(unionSets[nk] || [])].slice(0, MAX_TABLE_COLUMNS);
  }

  return { expandedKeys: orderedKeys, unionByKey };
}

/** Strip id-like keys recursively for display (cells + fallback JSON). */
export function sanitizeForDisplay(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(sanitizeForDisplay);
  if (value instanceof Date) return value;
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (isIdLikeFieldKey(k)) continue;
    out[k] = sanitizeForDisplay(v);
  }
  return out;
}

export const ISO_DATE_LIKE_RE = /^\d{4}-\d{2}-\d{2}/;

export function tryParseDisplayDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }
  if (typeof value === "string") {
    const s = value.trim();
    if (s.length < 10 || !ISO_DATE_LIKE_RE.test(s)) return null;
    const t = Date.parse(s);
    if (Number.isNaN(t)) return null;
    const d = new Date(t);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }
  return null;
}

export function formatDateOnly(d: Date): string {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Format ISO / date strings and Date leaves as locale date-only (no time). */
export function formatDatesForDisplay(value: unknown): unknown {
  const parsed = tryParseDisplayDate(value);
  if (parsed) return formatDateOnly(parsed);
  if (Array.isArray(value)) return value.map(formatDatesForDisplay);
  if (!isPlainObject(value)) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    out[k] = formatDatesForDisplay(v);
  }
  return out;
}

export const MAX_TABLE_COLUMNS = 24;

/** Column keys never shown in nested audit tables (attachments / large blobs). */
export const TABLE_OMIT_COLUMN_KEYS = new Set<string>([
  "documents",
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
]);

export function inferColumns(
  rows: unknown[],
  options?: { omitNestedAuditArrays?: boolean },
): string[] {
  const omitNested = options?.omitNestedAuditArrays !== false;
  const keys = new Set<string>();
  for (const row of rows.slice(0, 80)) {
    if (!isPlainObject(row)) continue;
    Object.keys(row).forEach((k) => {
      if (TABLE_OMIT_COLUMN_KEYS.has(k)) return;
      if (!isIdLikeFieldKey(k)) {
        if (omitNested && NESTED_AUDIT_RECORD_KEYS.has(k)) return;
        keys.add(k);
      }
    });
  }
  return [...keys].slice(0, MAX_TABLE_COLUMNS);
}

/** Infer column keys for a tabular block (e.g. nested object arrays on safety audit docs). */
export function inferAuditSnapshotTabularColumns(rows: unknown[]): string[] {
  return inferColumns(rows, { omitNestedAuditArrays: true });
}

export function cellPreview(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
  }
  const cleaned = sanitizeForDisplay(value);
  const asDate = tryParseDisplayDate(cleaned);
  if (asDate) return formatDateOnly(asDate);
  if (typeof cleaned === "object") {
    try {
      return JSON.stringify(formatDatesForDisplay(cleaned));
    } catch {
      return String(cleaned);
    }
  }
  return String(cleaned);
}

/** Single-cell string used by safety document boxes and tables. */
export function formatAuditSnapshotCellPreview(value: unknown): string {
  return cellPreview(value);
}

export function nestedRecordsJsonPreview(data: unknown[]): string {
  const displayPayload = formatDatesForDisplay(sanitizeForDisplay(data));
  return JSON.stringify(displayPayload, null, 2);
}

export function shouldUseNestedRecordsTable(rows: unknown[]): boolean {
  if (!rows.length || !rows.every((row) => row === null || isPlainObject(row))) {
    return false;
  }
  const columns = inferColumns(rows, { omitNestedAuditArrays: true });
  if (columns.length > 0) return true;
  return rows.some((row) => getNestedAuditRecords(row) != null);
}
export type AuditSnapshotNestedTableProgram = "electrical_energy" | "electrical_safety";