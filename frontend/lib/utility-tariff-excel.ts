import * as XLSX from "xlsx";

export type TariffFormState = {
  effective_from: string;
  effective_to: string;
  basic_energy_charges_rs_per_unit: string;
  fixed_charges_rs_per_kW_or_per_kVA: string;
  ed_percent: string;
  octroi_rs_per_unit: string;
  surcharge_rs: string;
  cow_cess_rs: string;
  rental_rs: string;
  infracess_rs: string;
  other_charges_or_rebates_rs: string;
  any_other_rs: string;
};

export const UTILITY_TARIFF_EXCEL_FIELDS: {
  key: keyof TariffFormState;
  label: string;
}[] = [
  { key: "effective_from", label: "Effective From" },
  { key: "effective_to", label: "Effective To" },
  { key: "basic_energy_charges_rs_per_unit", label: "Basic Energy Charges (₹/unit)" },
  {
    key: "fixed_charges_rs_per_kW_or_per_kVA",
    label: "Fixed Charges (₹/kW or kVA)",
  },
  { key: "ed_percent", label: "ED (%)" },
  { key: "octroi_rs_per_unit", label: "Octroi (₹/unit)" },
  { key: "surcharge_rs", label: "Surcharge (₹)" },
  { key: "cow_cess_rs", label: "Cow Cess (₹)" },
  { key: "rental_rs", label: "Rental (₹)" },
  { key: "infracess_rs", label: "Infra Cess (₹)" },
  { key: "other_charges_or_rebates_rs", label: "Other Charges / Rebates (₹)" },
  { key: "any_other_rs", label: "Any Other (₹)" },
];

function normalizeKey(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildLookupMaps() {
  const labelToKey = new Map<string, keyof TariffFormState>();
  const keySet = new Set<string>();
  for (const { key, label } of UTILITY_TARIFF_EXCEL_FIELDS) {
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

export function downloadUtilityTariffTemplate(filename = "utility-tariff-template.xlsx") {
  const header = ["Field", "Value"] as const;
  const rows: (string | number)[][] = [header];
  for (const { label } of UTILITY_TARIFF_EXCEL_FIELDS) {
    rows.push([label, ""]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tariff");
  XLSX.writeFile(wb, filename);
}

export function parseUtilityTariffExcel(
  file: File,
): Promise<Partial<TariffFormState>> {
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
        const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null | undefined)[]>(
          sheet,
          { header: 1, defval: "", raw: false },
        ) as unknown[][];

        const out: Partial<TariffFormState> = {};
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

          let key: keyof TariffFormState | undefined;
          if (keySet.has(fieldRaw as keyof TariffFormState)) {
            key = fieldRaw as keyof TariffFormState;
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
  });
}
