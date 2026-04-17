import * as XLSX from "xlsx";

/**
 * AC audit: one unit per card, three logical sections → three worksheets (Field | Value).
 */

export type ACAuditExcelFormState = {
  unit_id: string;
  building_block: string;
  area_location: string;
  ac_type: string;
  make: string;
  model: string;
  cooling_capacity_TR: string;
  rated_input_power_kW: string;
  bee_star_rating: string;
  refrigerant: string;
  year_of_installation: string;
  control_type: string;
  quantity_nos: string;
  running_status: string;
  condition: string;
  audit_date: string;
  remarks: string;

  voltage_V: string;
  current_A: string;
  power_factor: string;
  measured_power_kW: string;
  return_air_temp_C: string;
  supply_air_temp_C: string;
  ambient_temp_C: string;
  thermostat_set_temp_C: string;
  operating_hours_per_day: string;
  operating_days_per_year: string;
  compressor_fan_cycling: string;
  filter_evaporator_condition: string;
  condenser_condition: string;
  airflow_noise_leakage: string;
  measurement_remarks: string;

  airside_delta_T: string;
  loading_factor_percent: string;
  connected_load_kW: string;
  annual_energy_consumption_kWh: string;
  specific_power_kW_per_TR: string;
  age_years: string;
  om_flag: string;
  replacement_flag: string;
  control_flag: string;
  overall_ecm_suggestion: string;
  priority: string;
  indicative_basis: string;
};

export const AC_AUDIT_BASIC_FIELDS: {
  key: keyof ACAuditExcelFormState;
  label: string;
}[] = [
  { key: "unit_id", label: "Unit ID" },
  { key: "building_block", label: "Building / Block" },
  { key: "area_location", label: "Area / Location" },
  {
    key: "ac_type",
    label: "AC Type (window / split / ductable)",
  },
  { key: "make", label: "Make" },
  { key: "model", label: "Model" },
  { key: "cooling_capacity_TR", label: "Cooling Capacity (TR)" },
  { key: "rated_input_power_kW", label: "Rated Input Power (kW)" },
  { key: "bee_star_rating", label: "BEE Star Rating" },
  { key: "refrigerant", label: "Refrigerant" },
  { key: "year_of_installation", label: "Year of Installation" },
  {
    key: "control_type",
    label:
      "Control Type (manual / thermostat / bms / timer / inverter / other)",
  },
  { key: "quantity_nos", label: "Quantity (Nos)" },
  {
    key: "running_status",
    label: "Running Status (running / not_running / standby)",
  },
  { key: "condition", label: "Condition (good / average / poor)" },
  { key: "audit_date", label: "Audit Date" },
  { key: "remarks", label: "Remarks" },
];

export const AC_AUDIT_MEASUREMENT_FIELDS: {
  key: keyof ACAuditExcelFormState;
  label: string;
}[] = [
  { key: "voltage_V", label: "Voltage (V)" },
  { key: "current_A", label: "Current (A)" },
  { key: "power_factor", label: "Power Factor" },
  { key: "measured_power_kW", label: "Measured Power (kW)" },
  { key: "return_air_temp_C", label: "Return Air Temp (°C)" },
  { key: "supply_air_temp_C", label: "Supply Air Temp (°C)" },
  { key: "ambient_temp_C", label: "Ambient Temp (°C)" },
  { key: "thermostat_set_temp_C", label: "Thermostat Set Temp (°C)" },
  { key: "operating_hours_per_day", label: "Operating Hrs / Day" },
  { key: "operating_days_per_year", label: "Operating Days / Year" },
  {
    key: "compressor_fan_cycling",
    label: "Compressor / Fan Cycling (normal / frequent / continuous)",
  },
  {
    key: "filter_evaporator_condition",
    label: "Filter / Evaporator Condition (clean / moderate / dirty)",
  },
  {
    key: "condenser_condition",
    label: "Condenser Condition (clean / moderate / dirty)",
  },
  {
    key: "airflow_noise_leakage",
    label: "Airflow / Noise / Leakage Observation",
  },
  { key: "measurement_remarks", label: "Measurement Remarks" },
];

export const AC_AUDIT_CALC_FIELDS: {
  key: keyof ACAuditExcelFormState;
  label: string;
}[] = [];

export const AC_AUDIT_ALL_EXCEL_KEYS: (keyof ACAuditExcelFormState)[] =
  Array.from(
    new Set<keyof ACAuditExcelFormState>([
      ...AC_AUDIT_BASIC_FIELDS.map((x) => x.key),
      ...AC_AUDIT_MEASUREMENT_FIELDS.map((x) => x.key),
    ]),
  );

/** Map current form → Excel prefill (scalar fields only). */
export function acAuditFormToExcelPrefill(
  form: Record<string, unknown>,
): Partial<Record<keyof ACAuditExcelFormState, string>> {
  const out: Partial<Record<keyof ACAuditExcelFormState, string>> = {};
  for (const k of AC_AUDIT_ALL_EXCEL_KEYS) {
    const v = form[k as string];
    out[k] = v !== undefined && v !== null ? String(v) : "";
  }
  return out;
}

const SHEET_BASIC = "Basic_details";
const SHEET_MEAS = "Measurements";
const SHEET_CALC = "Calculations";

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildAllLookups() {
  const labelToKey = new Map<string, keyof ACAuditExcelFormState>();
  const keySet = new Set<string>();
  const all = [
    ...AC_AUDIT_BASIC_FIELDS,
    ...AC_AUDIT_MEASUREMENT_FIELDS,
    ...AC_AUDIT_CALC_FIELDS,
  ];
  for (const { key, label } of all) {
    keySet.add(key);
    labelToKey.set(normalizeKey(label), key);
    labelToKey.set(normalizeKey(key.replace(/_/g, " ")), key);
  }
  return { labelToKey, keySet };
}

const { labelToKey, keySet } = buildAllLookups();

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

function buildFieldValueSheet(
  fields: { key: keyof ACAuditExcelFormState; label: string }[],
  getValue: (key: keyof ACAuditExcelFormState) => string,
): (string | number)[][] {
  const rows: (string | number)[][] = [["Field", "Value"]];
  for (const { key, label } of fields) {
    rows.push([label, getValue(key)]);
  }
  return rows;
}

export function downloadACAuditExcelTemplate(
  form: Partial<Record<keyof ACAuditExcelFormState, string>>,
  filename = "ac-audit-template.xlsx",
) {
  const val = (k: keyof ACAuditExcelFormState) => String(form[k] ?? "");
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(buildFieldValueSheet(AC_AUDIT_BASIC_FIELDS, val)),
    SHEET_BASIC,
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(
      buildFieldValueSheet(AC_AUDIT_MEASUREMENT_FIELDS, val),
    ),
    SHEET_MEAS,
  );

  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(buildFieldValueSheet(AC_AUDIT_CALC_FIELDS, val)),
    SHEET_CALC,
  );

  XLSX.writeFile(wb, filename);
}

function parseFieldValueSheet(matrix: unknown[][]): Partial<
  Record<keyof ACAuditExcelFormState, string>
> {
  const out: Partial<Record<keyof ACAuditExcelFormState, string>> = {};
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

    let key: keyof ACAuditExcelFormState | undefined;
    if (keySet.has(fieldRaw)) {
      key = fieldRaw as keyof ACAuditExcelFormState;
    } else {
      key = labelToKey.get(normalizeKey(fieldRaw));
    }
    if (key) out[key] = valueRaw;
  }
  return out;
}

export function parseACAuditExcel(
  file: File,
): Promise<Partial<Record<keyof ACAuditExcelFormState, string>>> {
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
        const merged: Partial<Record<keyof ACAuditExcelFormState, string>> =
          {};

        const read = (name: string) =>
          workbook.Sheets[name]
            ? parseFieldValueSheet(getMatrix(workbook.Sheets[name]))
            : {};

        Object.assign(merged, read(SHEET_BASIC));
        Object.assign(merged, read(SHEET_MEAS));
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
