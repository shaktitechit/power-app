import * as XLSX from "xlsx";

export type LuxMeasurementExcelFormState = {
  area_location: string;
  room_type: string;
  required_lux: string;
  measured_lux_point_1: string;
  measured_lux_point_2: string;
  measured_lux_point_3: string;
  remarks: string;

  average_lux: string;
  /** Serialized for Excel; use `luxComplianceExcelToBoolean` on import */
  compliance: string;
};

export const LUX_MEASUREMENT_DETAIL_FIELDS: {
  key: keyof LuxMeasurementExcelFormState;
  label: string;
}[] = [
  { key: "area_location", label: "Area / Location" },
  {
    key: "room_type",
    label:
      "Room Type (office / corridor / warehouse / hospital / classroom / outdoor / other)",
  },
  { key: "required_lux", label: "Required Lux" },
  { key: "measured_lux_point_1", label: "Measured Lux Point 1" },
  { key: "measured_lux_point_2", label: "Measured Lux Point 2" },
  { key: "measured_lux_point_3", label: "Measured Lux Point 3" },
  { key: "remarks", label: "Remarks" },
];

export const LUX_MEASUREMENT_CALC_FIELDS: {
  key: keyof LuxMeasurementExcelFormState;
  label: string;
}[] = [];

export const LUX_MEASUREMENT_ALL_EXCEL_KEYS: (keyof LuxMeasurementExcelFormState)[] =
  Array.from(
    new Set<keyof LuxMeasurementExcelFormState>([
      ...LUX_MEASUREMENT_DETAIL_FIELDS.map((x) => x.key),
    ]),
  );

const SHEET_DETAILS = "Lux_details";
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
  const labelToKey = new Map<string, keyof LuxMeasurementExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of [
    ...LUX_MEASUREMENT_DETAIL_FIELDS,
    ...LUX_MEASUREMENT_CALC_FIELDS,
  ]) {
    keySet.add(key);
    labelToKey.set(normalizeKey(label), key);
    labelToKey.set(normalizeKey(key.replace(/_/g, " ")), key);
  }
  return { labelToKey, keySet };
}

const { labelToKey, keySet } = buildLookups();

function buildFieldValueSheet(
  fields: { key: keyof LuxMeasurementExcelFormState; label: string }[],
  getValue: (key: keyof LuxMeasurementExcelFormState) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = [["Field", "Value"]];
  for (const { key, label } of fields) {
    rows.push([label, getValue(key)]);
  }
  return rows;
}

export function luxComplianceExcelToBoolean(
  raw: string,
): boolean | undefined {
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  if (
    s === "true" ||
    s === "yes" ||
    s === "1" ||
    s === "compliant" ||
    s === "pass"
  ) {
    return true;
  }
  if (
    s === "false" ||
    s === "no" ||
    s === "0" ||
    s === "non-compliant" ||
    s === "noncompliant" ||
    s === "fail"
  ) {
    return false;
  }
  return undefined;
}

export function luxMeasurementFormToExcelPrefill(
  form: Record<string, unknown>,
): Partial<Record<keyof LuxMeasurementExcelFormState, string>> {
  const out: Partial<Record<keyof LuxMeasurementExcelFormState, string>> = {};
  for (const k of LUX_MEASUREMENT_ALL_EXCEL_KEYS) {
    if (k === "compliance") {
      const c = form.compliance;
      if (c === undefined || c === null) {
        out.compliance = "";
      } else if (typeof c === "boolean") {
        out.compliance = c ? "Compliant" : "Non-compliant";
      } else {
        out.compliance = String(c);
      }
      continue;
    }
    const v = form[k as string];
    out[k] = v !== undefined && v !== null ? String(v) : "";
  }
  return out;
}

export function downloadLuxMeasurementExcelTemplate(
  form: Partial<Record<keyof LuxMeasurementExcelFormState, string>>,
  filename = "lux-measurement-template.xlsx",
) {
  const val = (k: keyof LuxMeasurementExcelFormState) => String(form[k] ?? "");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(
      buildFieldValueSheet(LUX_MEASUREMENT_DETAIL_FIELDS, val),
    ),
    SHEET_DETAILS,
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(buildFieldValueSheet(LUX_MEASUREMENT_CALC_FIELDS, val)),
    SHEET_CALC,
  );

  XLSX.writeFile(wb, filename);
}

function parseFieldValueSheet(
  matrix: unknown[][],
): Partial<Record<keyof LuxMeasurementExcelFormState, string>> {
  const out: Partial<Record<keyof LuxMeasurementExcelFormState, string>> = {};
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

    let key: keyof LuxMeasurementExcelFormState | undefined;
    if (keySet.has(fieldRaw)) {
      key = fieldRaw as keyof LuxMeasurementExcelFormState;
    } else {
      key = labelToKey.get(normalizeKey(fieldRaw));
    }
    if (key) out[key] = valueRaw;
  }
  return out;
}

export function parseLuxMeasurementExcel(
  file: File,
): Promise<Partial<Record<keyof LuxMeasurementExcelFormState, string>>> {
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
        const merged: Partial<Record<keyof LuxMeasurementExcelFormState, string>> =
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
