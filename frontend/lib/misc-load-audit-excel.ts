import * as XLSX from "xlsx";

export type MiscLoadAuditExcelFormState = {
  equipment_name: string;
  category: string;
  location_department: string;
  quantity: string;
  rated_power_kW: string;
  average_operating_hours_per_day: string;
  operating_days_per_year: string;
  load_factor_percent: string;

  estimated_annual_energy_kWh: string;
};

export const MISC_LOAD_AUDIT_DETAIL_FIELDS: {
  key: keyof MiscLoadAuditExcelFormState;
  label: string;
}[] = [
  { key: "equipment_name", label: "Equipment Name" },
  { key: "category", label: "Category" },
  { key: "location_department", label: "Location / Department" },
  { key: "quantity", label: "Quantity" },
  { key: "rated_power_kW", label: "Rated Power (kW)" },
  {
    key: "average_operating_hours_per_day",
    label: "Average Operating Hours / Day",
  },
  { key: "operating_days_per_year", label: "Operating Days / Year" },
  { key: "load_factor_percent", label: "Load Factor (%)" },
];

export const MISC_LOAD_AUDIT_CALC_FIELDS: {
  key: keyof MiscLoadAuditExcelFormState;
  label: string;
}[] = [];

export const MISC_LOAD_AUDIT_ALL_EXCEL_KEYS: (keyof MiscLoadAuditExcelFormState)[] =
  Array.from(
    new Set<keyof MiscLoadAuditExcelFormState>([
      ...MISC_LOAD_AUDIT_DETAIL_FIELDS.map((x) => x.key),
    ]),
  );

const SHEET_DETAILS = "Misc_load_details";
const SHEET_CALC = "Calculations";

function getMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<
    (string | number | Date | null | undefined)[]
  >(sheet, { header: 1, defval: "", raw: false }) as unknown[][];
}

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

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookups() {
  const labelToKey = new Map<string, keyof MiscLoadAuditExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of [
    ...MISC_LOAD_AUDIT_DETAIL_FIELDS,
    ...MISC_LOAD_AUDIT_CALC_FIELDS,
  ]) {
    keySet.add(key);
    labelToKey.set(normalizeKey(label), key);
    labelToKey.set(normalizeKey(key.replace(/_/g, " ")), key);
  }
  return { labelToKey, keySet };
}

const { labelToKey, keySet } = buildLookups();

function buildFieldValueSheet(
  fields: { key: keyof MiscLoadAuditExcelFormState; label: string }[],
  getValue: (key: keyof MiscLoadAuditExcelFormState) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = [["Field", "Value"]];
  for (const { key, label } of fields) {
    rows.push([label, getValue(key)]);
  }
  return rows;
}

export function miscLoadAuditFormToExcelPrefill(
  form: Record<string, unknown>,
): Partial<Record<keyof MiscLoadAuditExcelFormState, string>> {
  const out: Partial<Record<keyof MiscLoadAuditExcelFormState, string>> = {};
  for (const k of MISC_LOAD_AUDIT_ALL_EXCEL_KEYS) {
    const v = form[k as string];
    out[k] = v !== undefined && v !== null ? String(v) : "";
  }
  return out;
}

export function downloadMiscLoadAuditExcelTemplate(
  form: Partial<Record<keyof MiscLoadAuditExcelFormState, string>>,
  filename = "misc-load-audit-template.xlsx",
) {
  const val = (k: keyof MiscLoadAuditExcelFormState) => String(form[k] ?? "");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(
      buildFieldValueSheet(MISC_LOAD_AUDIT_DETAIL_FIELDS, val),
    ),
    SHEET_DETAILS,
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(
      buildFieldValueSheet(MISC_LOAD_AUDIT_CALC_FIELDS, val),
    ),
    SHEET_CALC,
  );

  XLSX.writeFile(wb, filename);
}

function parseFieldValueSheet(
  matrix: unknown[][],
): Partial<Record<keyof MiscLoadAuditExcelFormState, string>> {
  const out: Partial<Record<keyof MiscLoadAuditExcelFormState, string>> = {};
  let startRow = 0;
  if (matrix.length > 0) {
    const r0 = matrix[0];
    const a0 = cellToString(r0?.[0]).toLowerCase();
    const b0 = cellToString(r0?.[1]).toLowerCase();
    if (a0 === "field" && b0 === "value") startRow = 1;
  }

  for (let i = startRow; i < matrix.length; i += 1) {
    const row = matrix[i];
    if (!row || row.length < 2) continue;
    const fieldRaw = cellToString(row[0]);
    const valueRaw = cellToString(row[1]);
    if (!fieldRaw) continue;

    let key: keyof MiscLoadAuditExcelFormState | undefined;
    if (keySet.has(fieldRaw)) {
      key = fieldRaw as keyof MiscLoadAuditExcelFormState;
    } else {
      key = labelToKey.get(normalizeKey(fieldRaw));
    }
    if (key) out[key] = valueRaw;
  }
  return out;
}

export function parseMiscLoadAuditExcel(
  file: File,
): Promise<Partial<Record<keyof MiscLoadAuditExcelFormState, string>>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data || !(data instanceof ArrayBuffer)) {
          reject(new Error("Could not read file."));
          return;
        }

        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const merged: Partial<
          Record<keyof MiscLoadAuditExcelFormState, string>
        > = {};

        const read = (name: string) =>
          workbook.Sheets[name]
            ? parseFieldValueSheet(getMatrix(workbook.Sheets[name]))
            : {};

        Object.assign(merged, read(SHEET_DETAILS));
        Object.assign(merged, read(SHEET_CALC));

        resolve(merged);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
