import * as XLSX from "xlsx";

export type FanAuditExcelFormState = {
  building_block: string;
  area_location: string;
  fan_type: string;
  make_model: string;
  rated_power_W: string;
  measured_power_W: string;
  quantity_nos: string;
  speed_control_type: string;
  operating_hours_per_day: string;
  operating_days_per_year: string;
  condition: string;
  remarks: string;
  audit_date: string;
  auditor_id: string;

  loading_factor_percent: string;
  connected_load_kW: string;
  annual_energy_consumption_kWh: string;
};

export const FAN_AUDIT_DETAIL_FIELDS: {
  key: keyof FanAuditExcelFormState;
  label: string;
}[] = [
  { key: "building_block", label: "Building / Block" },
  { key: "area_location", label: "Area / Location" },
  {
    key: "fan_type",
    label:
      "Fan Type (ceiling / exhaust / pedestal / wall / industrial / other)",
  },
  { key: "make_model", label: "Make & Model" },
  { key: "rated_power_W", label: "Rated Power (W)" },
  { key: "measured_power_W", label: "Measured Power (W)" },
  { key: "quantity_nos", label: "Quantity (Nos)" },
  {
    key: "speed_control_type",
    label: "Speed Control (regulator / electronic / vfd / none)",
  },
  { key: "operating_hours_per_day", label: "Operating Hours / Day" },
  { key: "operating_days_per_year", label: "Operating Days / Year" },
  {
    key: "condition",
    label: "Condition (good / old / inefficient)",
  },
  { key: "remarks", label: "Remarks" },
  { key: "audit_date", label: "Audit Date" },
  { key: "auditor_id", label: "Auditor ID" },
];

export const FAN_AUDIT_CALC_FIELDS: {
  key: keyof FanAuditExcelFormState;
  label: string;
}[] = [];

export const FAN_AUDIT_ALL_EXCEL_KEYS: (keyof FanAuditExcelFormState)[] =
  Array.from(
    new Set<keyof FanAuditExcelFormState>([
      ...FAN_AUDIT_DETAIL_FIELDS.map((x) => x.key),
    ]),
  );

const SHEET_DETAILS = "Fan_details";
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
  const labelToKey = new Map<string, keyof FanAuditExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of [
    ...FAN_AUDIT_DETAIL_FIELDS,
    ...FAN_AUDIT_CALC_FIELDS,
  ]) {
    keySet.add(key);
    labelToKey.set(normalizeKey(label), key);
    labelToKey.set(normalizeKey(key.replace(/_/g, " ")), key);
  }
  return { labelToKey, keySet };
}

const { labelToKey, keySet } = buildLookups();

function buildFieldValueSheet(
  fields: { key: keyof FanAuditExcelFormState; label: string }[],
  getValue: (key: keyof FanAuditExcelFormState) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = [["Field", "Value"]];
  for (const { key, label } of fields) {
    rows.push([label, getValue(key)]);
  }
  return rows;
}

export function fanAuditFormToExcelPrefill(
  form: Record<string, unknown>,
): Partial<Record<keyof FanAuditExcelFormState, string>> {
  const out: Partial<Record<keyof FanAuditExcelFormState, string>> = {};
  for (const k of FAN_AUDIT_ALL_EXCEL_KEYS) {
    const v = form[k as string];
    out[k] = v !== undefined && v !== null ? String(v) : "";
  }
  return out;
}

export function downloadFanAuditExcelTemplate(
  form: Partial<Record<keyof FanAuditExcelFormState, string>>,
  filename = "fan-audit-template.xlsx",
) {
  const val = (k: keyof FanAuditExcelFormState) => String(form[k] ?? "");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(
      buildFieldValueSheet(FAN_AUDIT_DETAIL_FIELDS, val),
    ),
    SHEET_DETAILS,
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(buildFieldValueSheet(FAN_AUDIT_CALC_FIELDS, val)),
    SHEET_CALC,
  );

  XLSX.writeFile(wb, filename);
}

function parseFieldValueSheet(
  matrix: unknown[][],
): Partial<Record<keyof FanAuditExcelFormState, string>> {
  const out: Partial<Record<keyof FanAuditExcelFormState, string>> = {};
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

    let key: keyof FanAuditExcelFormState | undefined;
    if (keySet.has(fieldRaw)) {
      key = fieldRaw as keyof FanAuditExcelFormState;
    } else {
      key = labelToKey.get(normalizeKey(fieldRaw));
    }
    if (key) out[key] = valueRaw;
  }
  return out;
}

export function parseFanAuditExcel(
  file: File,
): Promise<Partial<Record<keyof FanAuditExcelFormState, string>>> {
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
        const merged: Partial<Record<keyof FanAuditExcelFormState, string>> =
          {};

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
