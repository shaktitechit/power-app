import * as XLSX from "xlsx";

/** Columns merged on import (billing columns are template context only). */
export type SolarGenerationExcelEditablePayload = {
  import_kWh: string;
  import_kVAh: string;
  import_kVA: string;
  export_kWh: string;
  export_kVAh: string;
  export_kVA: string;
  solar_generation_kWh: string;
  solar_generation_kVAh: string;
  solar_generation_kVA: string;
};

const REFERENCE_FIELDS: { key: string; label: string }[] = [
  { key: "billing_period_start", label: "Billing Period Start" },
  { key: "billing_period_end", label: "Billing Period End" },
  { key: "bill_no", label: "Bill No" },
];

const EDITABLE_FIELDS: {
  key: keyof SolarGenerationExcelEditablePayload;
  label: string;
}[] = [
  { key: "import_kWh", label: "Import kWh" },
  { key: "import_kVAh", label: "Import kVAh" },
  { key: "import_kVA", label: "Import kVA" },
  { key: "export_kWh", label: "Export kWh" },
  { key: "export_kVAh", label: "Export kVAh" },
  { key: "export_kVA", label: "Export kVA" },
  { key: "solar_generation_kWh", label: "Solar Generation kWh" },
  { key: "solar_generation_kVAh", label: "Solar Generation kVAh" },
  { key: "solar_generation_kVA", label: "Solar Generation kVA" },
];

const EDITABLE_KEY_SET = new Set<string>(
  EDITABLE_FIELDS.map((f) => f.key as string),
);

const RECORD_NUM_HEADER = "Record #";

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, string>();
  const keySet = new Set<string>();
  for (const { key, label } of [...REFERENCE_FIELDS, ...EDITABLE_FIELDS]) {
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

function parseHeaderToColumnKeys(headerRow: unknown[]): (string | null)[] {
  return headerRow.map((cell) => {
    const s = cellToString(cell);
    if (!s) return null;
    if (isRecordNumColumn(s)) return null;
    if (keySet.has(s)) return s;
    return labelToKey.get(normalizeKey(s)) ?? null;
  });
}

function rowHasEditableData(
  row: unknown[],
  colKeys: (string | null)[],
): boolean {
  for (let c = 0; c < colKeys.length; c += 1) {
    const k = colKeys[c];
    if (!k || !EDITABLE_KEY_SET.has(k)) continue;
    if (cellToString(row[c])) return true;
  }
  return false;
}

function parseEditableDataRow(
  row: unknown[],
  colKeys: (string | null)[],
): Partial<SolarGenerationExcelEditablePayload> {
  const out: Partial<SolarGenerationExcelEditablePayload> = {};
  for (let c = 0; c < colKeys.length; c += 1) {
    const k = colKeys[c];
    if (!k || !EDITABLE_KEY_SET.has(k)) continue;
    const v = cellToString(row[c]);
    if (v === "") continue;
    if (k === "import_kWh") out.import_kWh = v;
    else if (k === "import_kVAh") out.import_kVAh = v;
    else if (k === "import_kVA") out.import_kVA = v;
    else if (k === "export_kWh") out.export_kWh = v;
    else if (k === "export_kVAh") out.export_kVAh = v;
    else if (k === "export_kVA") out.export_kVA = v;
    else if (k === "solar_generation_kWh") out.solar_generation_kWh = v;
    else if (k === "solar_generation_kVAh") out.solar_generation_kVAh = v;
    else if (k === "solar_generation_kVA") out.solar_generation_kVA = v;
  }
  return out;
}

export type SolarGenerationTemplateRowContext = {
  billing_period_start: string;
  billing_period_end: string;
  bill_no: string;
};

export function downloadSolarGenerationBulkTemplate(options: {
  recordCount: number;
  /** Prefill billing columns per row (same order as on screen: newest first). */
  billingRows: SolarGenerationTemplateRowContext[];
  filename?: string;
}) {
  const count = options.recordCount;
  const filename =
    options.filename ?? `solar-generation-bulk-${count}-records.xlsx`;

  const headers = [
    RECORD_NUM_HEADER,
    ...REFERENCE_FIELDS.map((f) => f.label),
    ...EDITABLE_FIELDS.map((f) => f.label),
  ];

  const rows: (string | number)[][] = [
    [
      "One row per utility billing period. Row order matches Solar Generation Record cards (newest first). Billing columns are read-only context; fill Import / Export / Solar Generation only.",
      ...Array(headers.length - 1).fill(""),
    ],
    headers,
  ];

  for (let i = 0; i < count; i += 1) {
    const ctx = options.billingRows[i];
    const row: (string | number)[] = [i + 1];
    if (ctx) {
      row.push(
        ctx.billing_period_start || "",
        ctx.billing_period_end || "",
        ctx.bill_no || "",
      );
    } else {
      row.push("", "", "");
    }
    for (let c = 0; c < EDITABLE_FIELDS.length; c += 1) {
      row.push("");
    }
    rows.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Solar generation");
  XLSX.writeFile(wb, filename);
}

export function parseSolarGenerationExcelBulk(
  file: File,
): Promise<(Partial<SolarGenerationExcelEditablePayload> | null)[]> {
  return new Promise((resolve, reject) => {
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
          const hasRecordCol =
            isRecordNumColumn(first) ||
            normalizeKey(first) === normalizeKey(RECORD_NUM_HEADER);
          const editableMapped = keys.filter(
            (k) => k && EDITABLE_KEY_SET.has(k),
          ).length;
          if (hasRecordCol && editableMapped >= 2) return true;
          if (editableMapped >= 4) return true;
          if (mapped >= 6) return true;
          return false;
        };

        let headerRowIndex = matrix.findIndex(
          (row) => row?.length && isLikelyBulkHeaderRow(row as unknown[]),
        );

        if (headerRowIndex < 0) {
          reject(
            new Error(
              "Could not find a header row. Use the downloaded template.",
            ),
          );
          return;
        }

        const headerRow = matrix[headerRowIndex] as unknown[];
        const colKeys = parseHeaderToColumnKeys(headerRow);

        if (!colKeys.some((k) => k && EDITABLE_KEY_SET.has(k))) {
          reject(
            new Error(
              "No import columns found (Import kWh, Export kWh, …). Use the downloaded template.",
            ),
          );
          return;
        }

        const rows: (Partial<SolarGenerationExcelEditablePayload> | null)[] =
          [];
        for (let r = headerRowIndex + 1; r < matrix.length; r += 1) {
          const row = matrix[r] as unknown[];
          if (!row || !row.length) {
            rows.push(null);
            continue;
          }
          if (!rowHasEditableData(row, colKeys)) {
            rows.push(null);
            continue;
          }
          rows.push(parseEditableDataRow(row, colKeys));
        }

        resolve(rows);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
