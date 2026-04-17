import * as XLSX from "xlsx";

/** Single-form Field | Value template (same pattern as utility-tariff / dg-audit Excel). */
export type TransformerAuditExcelFormState = {
  total_losses_kW: string;
  average_load_kVA: string;
  percent_loading: string;
  max_load_kVA: string;
  load_factor_percent: string;

  operating_hours_per_year: string;
  annual_energy_supplied_kWh: string;
  annual_energy_losses_kWh: string;

  per_unit_cost_rs: string;
  cost_of_losses_rs: string;

  power_factor_LT: string;
  harmonics_THD_percent: string;

  neutral_earth_resistance_ohms: string;
  body_to_earth_resistance_ohms: string;

  silica_gel_cobalt_type: string;
  silica_gel_non_cobalt_type: string;
  oil_level: string;

  line_voltage_Vr: string;
  line_voltage_Vy: string;
  line_voltage_Vb: string;

  phase_voltage_Vr_n: string;
  phase_voltage_Vy_n: string;
  phase_voltage_Vb_n: string;

  line_current_Ir: string;
  line_current_Iy: string;
  line_current_Ib: string;

  audit_date: string;
};

export const TRANSFORMER_AUDIT_EXCEL_FIELDS: {
  key: keyof TransformerAuditExcelFormState;
  label: string;
}[] = [
  { key: "average_load_kVA", label: "Average Load Measured (kVA)" },
  { key: "max_load_kVA", label: "Max Load (kVA)" },

  { key: "operating_hours_per_year", label: "Operating Hours / Year" },
  {
    key: "annual_energy_supplied_kWh",
    label: "Annual Energy Supplied (kWh)",
  },

  { key: "per_unit_cost_rs", label: "Per Unit Cost (₹)" },

  { key: "power_factor_LT", label: "Power Factor (LT)" },
  { key: "harmonics_THD_percent", label: "Harmonics THD (%)" },

  {
    key: "neutral_earth_resistance_ohms",
    label: "Neutral Earth Resistance (Ω)",
  },
  {
    key: "body_to_earth_resistance_ohms",
    label: "Body to Earth Resistance (Ω)",
  },

  {
    key: "silica_gel_cobalt_type",
    label: "Silica Gel Cobalt Type (good / moderate / poor)",
  },
  {
    key: "silica_gel_non_cobalt_type",
    label: "Silica Gel Non-Cobalt Type (good / moderate / poor)",
  },
  {
    key: "oil_level",
    label: "Oil Level (low / normal / high)",
  },

  { key: "line_voltage_Vr", label: "Line Voltage Vr" },
  { key: "line_voltage_Vy", label: "Line Voltage Vy" },
  { key: "line_voltage_Vb", label: "Line Voltage Vb" },

  { key: "phase_voltage_Vr_n", label: "Phase Voltage Vr-n" },
  { key: "phase_voltage_Vy_n", label: "Phase Voltage Vy-n" },
  { key: "phase_voltage_Vb_n", label: "Phase Voltage Vb-n" },

  { key: "line_current_Ir", label: "Line Current Ir" },
  { key: "line_current_Iy", label: "Line Current Iy" },
  { key: "line_current_Ib", label: "Line Current Ib" },

  { key: "audit_date", label: "Audit Date" },
];

const GMP_KEYS = new Set<keyof TransformerAuditExcelFormState>([
  "silica_gel_cobalt_type",
  "silica_gel_non_cobalt_type",
]);

const OIL_KEY: keyof TransformerAuditExcelFormState = "oil_level";

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, keyof TransformerAuditExcelFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of TRANSFORMER_AUDIT_EXCEL_FIELDS) {
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

function parseGoodModeratePoor(
  raw: string,
): "good" | "moderate" | "poor" | "" | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (t === "good" || t === "moderate" || t === "poor") return t;
  return undefined;
}

function parseOilLevel(
  raw: string,
): "low" | "normal" | "high" | "" | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return "";
  if (t === "low" || t === "normal" || t === "high") return t;
  return undefined;
}

export function downloadTransformerAuditTemplate(options?: {
  filename?: string;
  rowPrefill?: Partial<Record<keyof TransformerAuditExcelFormState, string>>;
}) {
  const filename = options?.filename ?? "transformer-audit-template.xlsx";
  const prefill = options?.rowPrefill;

  const header = ["Field", "Value"] as const;
  const rows: (string | number)[][] = [header];

  for (const { key, label } of TRANSFORMER_AUDIT_EXCEL_FIELDS) {
    let v = "";
    if (prefill && key in prefill && prefill[key] !== undefined) {
      v = String(prefill[key]);
    }
    rows.push([label, v]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transformer Audit");
  XLSX.writeFile(wb, filename);
}

export function parseTransformerAuditExcel(
  file: File,
): Promise<
  Partial<Record<keyof TransformerAuditExcelFormState, string>>
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
          Record<keyof TransformerAuditExcelFormState, string>
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

          let key: keyof TransformerAuditExcelFormState | undefined;
          if (keySet.has(fieldRaw)) {
            key = fieldRaw as keyof TransformerAuditExcelFormState;
          } else {
            key = labelToKey.get(normalizeKey(fieldRaw));
          }

          if (!key) continue;

          if (GMP_KEYS.has(key)) {
            const g = parseGoodModeratePoor(valueRaw);
            if (g !== undefined) out[key] = g;
            continue;
          }

          if (key === OIL_KEY) {
            const o = parseOilLevel(valueRaw);
            if (o !== undefined) out[key] = o;
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
