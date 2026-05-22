
/** Editable billing fields only; auto-calculated values are derived after import. */
export type UtilityBillingRecordExcelPayload = {
  billing_period_start: string;
  billing_period_end: string;
  bill_no: string;
  mdi_kVA: string;
  units_kWh: string;
  units_kVAh: string;
  fixed_charges_rs: string;
  demand_charges_rs: string;
  energy_charges_rs: string;
  taxes_and_rent_rs: string;
  other_charges_rs: string;
  penalty_rs: string;
  other_charges_remark: string;
  rebate_subsidy_rs: string;
};

export const UTILITY_BILLING_RECORD_EXCEL_FIELDS: {
  key: keyof UtilityBillingRecordExcelPayload;
  label: string;
}[] = [
  { key: "billing_period_start", label: "Billing Period Start" },
  { key: "billing_period_end", label: "Billing Period End" },
  { key: "bill_no", label: "Bill No" },
  { key: "mdi_kVA", label: "MDI (kVA)" },
  { key: "units_kWh", label: "Units (kWh)" },
  { key: "units_kVAh", label: "Units (kVAh)" },
  { key: "fixed_charges_rs", label: "Fixed Charges (₹)" },
  { key: "demand_charges_rs", label: "Demand Charges (₹)" },
  { key: "energy_charges_rs", label: "Energy Charges (₹)" },
  { key: "taxes_and_rent_rs", label: "Taxes and Rent (₹)" },
  { key: "other_charges_rs", label: "Other Charges (₹)" },
  { key: "penalty_rs", label: "Penalty (₹)" },
  { key: "other_charges_remark", label: "Other Charges Remark" },
  { key: "rebate_subsidy_rs", label: "Rebate / Subsidy (₹)" },
];

export type BillingCycleKind = "monthly" | "bi-monthly" | "quarterly";

export function getBulkRecordCountForBillingCycle(
  billingCycle: BillingCycleKind = "monthly",
): number {
  switch (billingCycle) {
    case "bi-monthly":
      return 6;
    case "quarterly":
      return 3;
    case "monthly":
    default:
      return 12;
  }
}

/** Aligns with solar-generation-record-excel `RECORD_NUM_HEADER` — row order matches UI (creation order + drafts). */
export const RECORD_NUM_HEADER = "Record #";

/**
 * Read-only column (solar-style context column). Shows `form.localId` when downloading with rowPrefills;
 * for empty templates, shows `buildUtilityBillingDraftLocalId` for each trailing draft ordinal.
 */
export const SLOT_KEY_HEADER = "Slot key (read-only)";

/**
 * Stable localId for the Nth padded empty slot (0-based ordinal among draft-only rows).
 * Single source of truth shared with `utility-billing-record-section` (same idea as solar billingRows + Record #).
 */
export function buildUtilityBillingDraftLocalId(
  utilityAccountId: string,
  draftOrdinal: number,
): string {
  return `draft-${utilityAccountId}-${draftOrdinal}`;
}

export type UtilityBillingTemplateRowPrefill = {
  billing_period_start?: string;
  billing_period_end?: string;
  bill_no?: string;
  /** Current `form.localId` (Mongo id or draft-*). */
  slotKey?: string;
};

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, keyof UtilityBillingRecordExcelPayload>();
  const keySet = new Set<string>();
  for (const { key, label } of UTILITY_BILLING_RECORD_EXCEL_FIELDS) {
    keySet.add(key);
    labelToKey.set(normalizeKey(label), key);
    labelToKey.set(normalizeKey(key.replace(/_/g, " ")), key);
  }
  return { labelToKey, keySet };
}

const { labelToKey, keySet } = buildLookupMaps();

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return "";
    return String(value);
  }
  return String(value).trim();
}

function isRecordNumColumn(header: string): boolean {
  const n = normalizeKey(header);
  return n === "record #" || n === "#" || n === "record" || n === "no";
}

function isSlotKeyColumn(header: string): boolean {
  const n = normalizeKey(header);
  if (n === normalizeKey(SLOT_KEY_HEADER)) return true;
  return n.startsWith("slot key");
}

function slotKeyForTemplateRow(
  ua: string,
  rowIndex: number,
  prefills: UtilityBillingTemplateRowPrefill[],
): string {
  const pre = prefills[rowIndex];
  if (pre?.slotKey) return pre.slotKey;

  let draftOrd = 0;
  for (let k = 0; k < rowIndex; k += 1) {
    const pk = prefills[k]?.slotKey;
    const isDraft =
      !pk || String(pk).startsWith(`draft-${ua}-`);
    if (isDraft) draftOrd += 1;
  }
  return buildUtilityBillingDraftLocalId(ua, draftOrd);
}

export async function downloadUtilityBillingRecordTemplate(options: {
  billingCycle: BillingCycleKind;
  utilityAccountId: string;
  recordCount?: number;
  rowPrefills?: UtilityBillingTemplateRowPrefill[];
  filename?: string;
}) {
  const count =
    options.recordCount ??
    getBulkRecordCountForBillingCycle(options.billingCycle);
  const cycle = options.billingCycle;
  const ua = options.utilityAccountId;
  const filename =
    options.filename ??
    `utility-billing-bulk-${cycle}-${count}-records.xlsx`;

  const headers = [
    ...UTILITY_BILLING_RECORD_EXCEL_FIELDS.map((f) => f.label),
  ];

  const rows: (string | number)[][] = [
    [
      "One row per billing record. Enter billing period dates as YYYY-MM-DD.",
      ...Array(headers.length - 1).fill(""),
    ],
    headers,
  ];

  const prefills = options.rowPrefills ?? [];

  for (let i = 0; i < count; i += 1) {
    const pre = prefills[i];
    const row: (string | number)[] = [];

    for (const field of UTILITY_BILLING_RECORD_EXCEL_FIELDS) {
      if (
        field.key === "billing_period_start" ||
        field.key === "billing_period_end" ||
        field.key === "bill_no"
      ) {
        const v =
          pre?.[
            field.key as "billing_period_start" | "billing_period_end" | "bill_no"
          ];
        row.push(v ?? "");
      } else {
        row.push("");
      }
    }
    rows.push(row);
  }

  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Billing records");
  XLSX.writeFile(wb, filename);
}

/** Maps header cell → payload key; null = skip (Record #, Slot key, etc.). */
function parseHeaderToColumnKeys(
  headerRow: unknown[],
): (keyof UtilityBillingRecordExcelPayload | null)[] {
  return headerRow.map((cell) => {
    const s = cellToString(cell);
    if (!s) return null;
    if (isRecordNumColumn(s)) return null;
    if (isSlotKeyColumn(s)) return null;
    if (keySet.has(s)) return s as keyof UtilityBillingRecordExcelPayload;
    return labelToKey.get(normalizeKey(s)) ?? null;
  });
}

function rowHasPayloadData(
  row: unknown[],
  colKeys: (keyof UtilityBillingRecordExcelPayload | null)[],
): boolean {
  for (let c = 0; c < colKeys.length; c += 1) {
    const k = colKeys[c];
    if (!k) continue;
    if (cellToString(row[c])) return true;
  }
  return false;
}

function parseDataRow(
  row: unknown[],
  colKeys: (keyof UtilityBillingRecordExcelPayload | null)[],
): Partial<UtilityBillingRecordExcelPayload> {
  const out: Partial<UtilityBillingRecordExcelPayload> = {};
  for (let c = 0; c < colKeys.length; c += 1) {
    const k = colKeys[c];
    if (!k) continue;
    const v = cellToString(row[c]);
    if (v !== "") out[k] = v;
  }
  return out;
}

/**
 * Parses bulk table: instruction row(s), header row, data rows.
 * Slot key column is ignored (same pattern as solar-generation-record-excel reference columns).
 */
export function parseUtilityBillingRecordExcelBulk(
  file: File,
): Promise<(Partial<UtilityBillingRecordExcelPayload> | null)[]> {
  return new Promise(async (resolve, reject) => {
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          reject(new Error("Could not read file."));
          return;
        }

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
        });

        const firstName = workbook.SheetNames[0];
        if (!firstName) {
          reject(new Error("The workbook has no sheets."));
          return;
        }

        const sheet = workbook.Sheets[firstName];
        const matrix = XLSX.utils.sheet_to_json<
          (string | number | Date | null | undefined)[]
        >(sheet, { header: 1, defval: "", raw: false }) as unknown[][];

        if (matrix.length < 2) {
          reject(new Error("The sheet is too short. Use the downloaded template."));
          return;
        }

        const isLikelyBulkHeaderRow = (row: unknown[]) => {
          if (!row?.length) return false;
          const keys = parseHeaderToColumnKeys(row);
          const mapped = keys.filter((k) => k !== null).length;
          const first = cellToString(row[0]);
          const isKnownFirstCol =
            normalizeKey(first) === "billing period start" ||
            normalizeKey(first) === "bill no" ||
            isRecordNumColumn(first);
          if (isKnownFirstCol && mapped >= 1) return true;
          if (mapped >= 3) return true;
          return false;
        };

        let headerRowIndex = matrix.findIndex(
          (row) => row?.length && isLikelyBulkHeaderRow(row as unknown[]),
        );

        if (headerRowIndex < 0) {
          reject(
            new Error(
              "Could not find a header row. Use the downloaded template (e.g. starting with column 'Billing Period Start').",
            ),
          );
          return;
        }

        const headerRow = matrix[headerRowIndex] as unknown[];
        const colKeys = parseHeaderToColumnKeys(headerRow);

        if (!colKeys.some((k) => k !== null)) {
          reject(new Error("No recognized columns in the header row."));
          return;
        }

        const rows: (Partial<UtilityBillingRecordExcelPayload> | null)[] = [];
        for (let r = headerRowIndex + 1; r < matrix.length; r += 1) {
          const row = matrix[r] as unknown[];
          if (!row || !row.length) {
            rows.push(null);
            continue;
          }
          if (!rowHasPayloadData(row, colKeys)) {
            rows.push(null);
            continue;
          }
          rows.push(parseDataRow(row, colKeys));
        }

        resolve(rows);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
}

/** Legacy single-column Field | Value sheet (one record). */
export function parseUtilityBillingRecordExcel(
  file: File,
): Promise<Partial<UtilityBillingRecordExcelPayload>> {
  return new Promise(async (resolve, reject) => {
    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          reject(new Error("Could not read file."));
          return;
        }

        const workbook = XLSX.read(data, {
          type: "array",
          cellDates: true,
        });

        const firstName = workbook.SheetNames[0];
        if (!firstName) {
          reject(new Error("The workbook has no sheets."));
          return;
        }

        const sheet = workbook.Sheets[firstName];
        const matrix = XLSX.utils.sheet_to_json<
          (string | number | Date | null | undefined)[]
        >(sheet, { header: 1, defval: "", raw: false }) as unknown[][];

        const out: Partial<UtilityBillingRecordExcelPayload> = {};
        let startRow = 0;

        if (matrix.length > 0) {
          const r0 = matrix[0];
          const a0 = cellToString(r0?.[0]).toLowerCase();
          const b0 = cellToString(r0?.[1]).toLowerCase();
          if (a0 === "field" && b0 === "value") {
            startRow = 1;
          }
        }

        for (let i = startRow; i < matrix.length; i++) {
          const row = matrix[i];
          if (!row || row.length < 2) continue;

          const fieldRaw = cellToString(row[0]);
          const valueRaw = cellToString(row[1]);
          if (!fieldRaw) continue;

          let key: keyof UtilityBillingRecordExcelPayload | undefined;
          if (keySet.has(fieldRaw)) {
            key = fieldRaw as keyof UtilityBillingRecordExcelPayload;
          } else {
            key = labelToKey.get(normalizeKey(fieldRaw));
          }

          if (key) {
            out[key] = valueRaw;
          }
        }

        resolve(out);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
    } catch (err) {
      reject(err);
    }
  });
}
