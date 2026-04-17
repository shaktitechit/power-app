import * as XLSX from "xlsx";

/** Single-form Field | Value template (utility-tariff / DG audit style). */
export type PumpAuditExcelFormState = {
  suction_head_m: string;
  discharge_static_head_m: string;
  delivery_pipe_diameter_inches: string;
  tank_or_sump_capacity: string;
  time_to_fill_tank_minutes: string;
  actual_flow_m3_per_hr: string;

  voltage_V: string;
  current_A: string;
  power_factor: string;
  input_power_kW: string;
  operating_hours_per_day: string;
  daily_energy_consumption_kWh: string;

  total_dynamic_head_m: string;
  hydraulic_output_power_kW: string;
  overall_pump_set_efficiency_percent: string;
  motor_loading_percent: string;
  specific_energy_consumption_kWh_per_m3: string;
  annual_energy_consumption_kWh: string;

  control_valve_throttling: string;
  vfd_installed: string;
  pump_condition: string;
  leakages_observed: string;

  recommendations: string;
  audit_date: string;
};

export const PUMP_AUDIT_EXCEL_FIELDS: {
  key: keyof PumpAuditExcelFormState;
  label: string;
}[] = [
  { key: "suction_head_m", label: "Suction Head (m)" },
  { key: "discharge_static_head_m", label: "Discharge Static Head (m)" },
  {
    key: "delivery_pipe_diameter_inches",
    label: "Delivery Pipe Diameter (inches)",
  },
  { key: "tank_or_sump_capacity", label: "Tank or Sump Capacity" },
  { key: "time_to_fill_tank_minutes", label: "Time to Fill Tank (minutes)" },
  { key: "actual_flow_m3_per_hr", label: "Actual Flow (m³/hr)" },

  { key: "voltage_V", label: "Voltage (V)" },
  { key: "current_A", label: "Current (A)" },
  { key: "power_factor", label: "Power Factor" },
  { key: "input_power_kW", label: "Input Power (kW)" },
  { key: "operating_hours_per_day", label: "Operating Hours / Day" },
  {
    key: "daily_energy_consumption_kWh",
    label: "Daily Energy Consumption (kWh)",
  },

  {
    key: "control_valve_throttling",
    label: "Control Valve Throttling (Yes/No)",
  },
  { key: "vfd_installed", label: "VFD Installed (Yes/No)" },
  {
    key: "pump_condition",
    label: "Pump Condition (good / moderate / poor)",
  },
  {
    key: "leakages_observed",
    label: "Leakages Observed (Yes/No)",
  },

  { key: "recommendations", label: "Recommendations" },
  { key: "audit_date", label: "Audit Date" },
];

const BOOL_KEYS = new Set<keyof PumpAuditExcelFormState>([
  "control_valve_throttling",
  "vfd_installed",
  "leakages_observed",
]);

const PUMP_CONDITION_KEY: keyof PumpAuditExcelFormState = "pump_condition";

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, keyof PumpAuditExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of PUMP_AUDIT_EXCEL_FIELDS) {
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

function parsePumpCondition(
  raw: string,
): "good" | "moderate" | "poor" | "" | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (t === "good" || t === "moderate" || t === "poor") return t;
  return undefined;
}

export function downloadPumpAuditTemplate(options?: {
  filename?: string;
  rowPrefill?: Partial<
    Record<keyof PumpAuditExcelFormState, string | boolean>
  >;
}) {
  const filename = options?.filename ?? "pump-audit-template.xlsx";
  const prefill = options?.rowPrefill;

  const header = ["Field", "Value"] as const;
  const rows: (string | number)[][] = [header];

  for (const { key, label } of PUMP_AUDIT_EXCEL_FIELDS) {
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
  XLSX.utils.book_append_sheet(wb, ws, "Pump Audit");
  XLSX.writeFile(wb, filename);
}

export function parsePumpAuditExcel(
  file: File,
): Promise<
  Partial<Record<keyof PumpAuditExcelFormState, string | boolean>>
> {
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
          Record<keyof PumpAuditExcelFormState, string | boolean>
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

          let key: keyof PumpAuditExcelFormState | undefined;
          if (keySet.has(fieldRaw)) {
            key = fieldRaw as keyof PumpAuditExcelFormState;
          } else {
            key = labelToKey.get(normalizeKey(fieldRaw));
          }

          if (!key) continue;

          if (BOOL_KEYS.has(key)) {
            const b = parseYesNo(valueRaw);
            if (b !== undefined) out[key] = b;
            continue;
          }

          if (key === PUMP_CONDITION_KEY) {
            const p = parsePumpCondition(valueRaw);
            if (p !== undefined) out[key] = p;
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
