import * as XLSX from "xlsx";

/**
 * Editable DG audit fields for Excel (single form, Field | Value columns — same pattern as utility-tariff-excel).
 * Auto-calculated fields may still be imported; the form will recompute derived values after merge.
 */
export type DGAuditExcelFormState = {
  measured_voltage_LL: string;
  measured_current_avg: string;
  measured_kW_output: string;
  measured_kVA_output: string;
  power_factor: string;
  frequency_Hz: string;

  max_load_observed_kW: string;
  min_load_observed_kW: string;
  average_loading_percent: string;
  load_factor_percent: string;
  idle_running_observed: string;
  parallel_operation: string;

  annual_fuel_consumption_liters: string;
  units_generated_per_year_kWh: string;
  total_working_hours_per_year: string;
  units_generated_per_hour_kWh: string;
  fuel_consumption_per_hour_liters: string;

  fuel_consumption_during_test_lph: string;
  units_generated_during_test_kWh: string;
  time_duration_of_the_test_hours: string;
  units_generated_per_hour_kWh_during_test: string;
  fuel_consumption_per_hour_liters_during_test: string;
  specific_fuel_consumption_l_per_kWh_during_test: string;

  specific_fuel_consumption_l_per_kWh: string;
  manufacturer_sfc_l_per_kWh: string;
  sfc_deviation_percent: string;
  sfc_deviation_percent_during_test: string;

  fuel_cost_rs_per_liter: string;
  annual_fuel_cost_rs: string;
  dg_cost_per_kWh_rs: string;
  grid_cost_per_kWh_rs: string;

  calculated_efficiency_percent: string;
  manufacturer_efficiency_percent: string;
  efficiency_deviation_percent: string;

  exhaust_temperature_C: string;
  cooling_water_temperature_C: string;
  lube_oil_pressure_bar: string;
  lube_oil_consumption_liters_per_year: string;

  total_operating_hours: string;
  hours_since_last_overhaul: string;

  air_fuel_filter_condition: string;
  visible_smoke_or_abnormal_vibration: string;

  remarks: string;
};

export const DG_AUDIT_EXCEL_FIELDS: {
  key: keyof DGAuditExcelFormState;
  label: string;
}[] = [
  { key: "measured_voltage_LL", label: "Measured Voltage L-L" },
  { key: "measured_current_avg", label: "Measured Current Avg" },
  { key: "measured_kW_output", label: "Measured kW Output" },
  { key: "measured_kVA_output", label: "Measured kVA Output" },
  { key: "frequency_Hz", label: "Frequency (Hz)" },

  { key: "max_load_observed_kW", label: "Max Load Observed (kW)" },
  { key: "min_load_observed_kW", label: "Min Load Observed (kW)" },
  { key: "average_loading_percent", label: "Average Loading (kW)" },
  {
    key: "idle_running_observed",
    label: "Idle Running Observed (Yes/No)",
  },
  { key: "parallel_operation", label: "Parallel Operation (Yes/No)" },

  { key: "annual_fuel_consumption_liters", label: "Annual Fuel Consumption (L)" },
  { key: "units_generated_per_year_kWh", label: "Units Generated / Year (kWh)" },
  { key: "total_working_hours_per_year", label: "Total Working Hours / Year" },

  { key: "fuel_consumption_during_test_lph", label: "Fuel Consumption During Test (Liters)" },
  {
    key: "units_generated_during_test_kWh",
    label: "Units Generated During Test (kWh)",
  },
  {
    key: "time_duration_of_the_test_hours",
    label: "Time Duration of the Test (Hours)",
  },

  {
    key: "manufacturer_sfc_l_per_kWh",
    label: "Manufacturer SFC (L/kWh)",
  },

  { key: "fuel_cost_rs_per_liter", label: "Fuel Cost (₹/L)" },
  { key: "grid_cost_per_kWh_rs", label: "Grid Cost / kWh (₹)" },

  {
    key: "manufacturer_efficiency_percent",
    label: "Manufacturer Efficiency (%)",
  },

  { key: "exhaust_temperature_C", label: "Exhaust Temperature (°C)" },
  {
    key: "cooling_water_temperature_C",
    label: "Cooling Water Temperature (°C)",
  },
  { key: "lube_oil_pressure_bar", label: "Lube Oil Pressure (bar)" },
  {
    key: "lube_oil_consumption_liters_per_year",
    label: "Lube Oil Consumption (L/year)",
  },

  { key: "hours_since_last_overhaul", label: "Hours Since Last Overhaul" },

  {
    key: "air_fuel_filter_condition",
    label: "Air/Fuel Filter Condition (good / moderate / poor)",
  },
  {
    key: "visible_smoke_or_abnormal_vibration",
    label: "Visible Smoke or Abnormal Vibration (Yes/No)",
  },

  { key: "remarks", label: "Remarks" },
];

const BOOL_KEYS = new Set<keyof DGAuditExcelFormState>([
  "idle_running_observed",
  "parallel_operation",
  "visible_smoke_or_abnormal_vibration",
]);

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, keyof DGAuditExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of DG_AUDIT_EXCEL_FIELDS) {
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

function parseYesNo(raw: string): boolean | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (["yes", "true", "1", "y"].includes(t)) return true;
  if (["no", "false", "0", "n"].includes(t)) return false;
  return undefined;
}

function parseAirFuelFilter(
  raw: string,
): "" | "good" | "moderate" | "poor" | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (t === "good" || t === "moderate" || t === "poor") return t;
  return undefined;
}

export function downloadDGAuditTemplate(
  options?: {
    filename?: string;
    /** Current form values prefilled in the Value column (booleans as Yes/No). */
    rowPrefill?: Partial<
      Record<keyof DGAuditExcelFormState, string | boolean>
    >;
  },
) {
  const filename = options?.filename ?? "dg-audit-template.xlsx";
  const prefill = options?.rowPrefill;

  const header = ["Field", "Value"];
  const rows: (string | number)[][] = [header];

  for (const { key, label } of DG_AUDIT_EXCEL_FIELDS) {
    let v = "";
    if (prefill && key in prefill) {
      const raw = prefill[key];
      if (typeof raw === "boolean") {
        v = raw ? "Yes" : "No";
      } else if (raw !== undefined && raw !== null) {
        v = String(raw);
      }
    }
    rows.push([label, v]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "DG Audit");
  XLSX.writeFile(wb, filename);
}

export function parseDGAuditExcel(
  file: File,
): Promise<Partial<Record<keyof DGAuditExcelFormState, string | boolean>>> {
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

        const out: Partial<
          Record<keyof DGAuditExcelFormState, string | boolean>
        > = {};
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

          let key: keyof DGAuditExcelFormState | undefined;
          if (keySet.has(fieldRaw)) {
            key = fieldRaw as keyof DGAuditExcelFormState;
          } else {
            key = labelToKey.get(normalizeKey(fieldRaw));
          }

          if (!key) continue;

          if (BOOL_KEYS.has(key)) {
            const b = parseYesNo(valueRaw);
            if (b !== undefined) out[key] = b;
            continue;
          }

          if (key === "air_fuel_filter_condition") {
            const af = parseAirFuelFilter(valueRaw);
            if (af !== undefined) out[key] = af;
            continue;
          }

          out[key] = valueRaw;
        }

        resolve(out);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
