import * as XLSX from "xlsx";

/** Checklist keys — labels must match Documents sheet column A. */
export const HVAC_AUDIT_DOCUMENT_LABEL_TO_KEY = {
  "Single Line Diagram Electrical": "single_line_diagram_electrical",
  "HVAC Layout / Piping Drawing": "hvac_layout_piping_drawing",
  "Chiller Operation & Maintenance Log": "chiller_operation_maintenance_log",
  "Water Treatment Records": "water_treatment_records",
  "Cooling Tower Maintenance Record": "cooling_tower_maintenance_record",
  "HVAC Equipment Capacity List": "hvac_equipment_capacity_list",
  "BMS Setpoints Schedule": "bms_setpoints_schedule",
} as const;

export type HVACAuditDocumentKey =
  (typeof HVAC_AUDIT_DOCUMENT_LABEL_TO_KEY)[keyof typeof HVAC_AUDIT_DOCUMENT_LABEL_TO_KEY];

export type HVACAuditExcelChecklistItem = {
  available?: boolean;
  remarks?: string;
};

export type HVACAuditExcelEquipmentRow = {
  equipment_name: string;
  type: string;
  capacity: string;
  power_rating_kW: string;
  quantity: string;
  remarks: string;
};

export type HVACAuditExcelChillerRow = {
  chiller_load_TR: string;
  power_input_kW: string;
  chilled_water_in_temp: string;
  chilled_water_out_temp: string;
  condenser_water_in_temp: string;
  condenser_water_out_temp: string;
};

export type HVACAuditExcelAuxRow = {
  name: string;
  power_kW: string;
};

export type HVACAuditExcelCoolingRow = {
  inlet_temp: string;
  outlet_temp: string;
  ambient_temp: string;
};

/** Parsed result merged into `HVACAuditFormState` in the section component. */
export type HVACAuditExcelParsed = {
  audit_date?: string;
  pre_audit_information?: {
    facility_name?: string;
    location_address?: string;
    client_contact_person?: string;
    contact_number_email?: string;
    type_of_facility?: string;
    total_operating_hours_per_day?: string;
    hvac_operating_hours_per_day?: string;
    season_ambient_conditions?: string;
    audit_dates?: string[];
    auditor_team_members_names?: string[];
  };
  documents_records_to_collect?: Partial<
    Record<HVACAuditDocumentKey, HVACAuditExcelChecklistItem>
  >;
  hvac_equipment_register?: HVACAuditExcelEquipmentRow[];
  chiller_field_test?: {
    readings?: HVACAuditExcelChillerRow[];
  };
  auxiliary_power?: {
    components?: HVACAuditExcelAuxRow[];
  };
  cooling_tower_quick_test?: {
    readings?: HVACAuditExcelCoolingRow[];
  };
  summary?: {
    average_cooling_produced_TR?: string;
    average_chiller_power_used_kW?: string;
    total_auxiliary_power_used_kW?: string;
    total_plant_power_kW?: string;
    plant_efficiency_kW_per_TR?: string;
    coefficient_of_performance?: string;
  };
};

const SHEET_PRE = "Pre_audit";
const SHEET_DOCS = "Documents";
const SHEET_EQUIP = "Equipment";
const SHEET_CHILLER = "Chiller";
const SHEET_AUX = "Auxiliary";
const SHEET_TOWER = "Cooling_tower";
const SHEET_SUMMARY = "Summary";

const PRE_AUDIT_LABELS: { label: string; key: keyof NonNullable<HVACAuditExcelParsed["pre_audit_information"]> }[] =
  [
    { label: "Facility Name", key: "facility_name" },
    { label: "Location Address", key: "location_address" },
    { label: "Client Contact Person", key: "client_contact_person" },
    { label: "Contact Number / Email", key: "contact_number_email" },
    { label: "Type of Facility", key: "type_of_facility" },
    { label: "Total Operating Hours / Day", key: "total_operating_hours_per_day" },
    { label: "HVAC Operating Hours / Day", key: "hvac_operating_hours_per_day" },
    { label: "Season / Ambient Conditions", key: "season_ambient_conditions" },
  ];

const AUDIT_RECORD_DATE_LABEL = "Audit date (record)";

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

function normalizeLabel(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseYesNo(raw: string): boolean | undefined {
  const t = raw.trim().toLowerCase();
  if (!t) return undefined;
  if (["yes", "true", "1", "y"].includes(t)) return true;
  if (["no", "false", "0", "n"].includes(t)) return false;
  return undefined;
}

function getMatrix(sheet: XLSX.WorkSheet): unknown[][] {
  return XLSX.utils.sheet_to_json<(string | number | Date | null | undefined)[]>(
    sheet,
    { header: 1, defval: "", raw: false },
  ) as unknown[][];
}

/** Build multi-sheet workbook from one HVAC audit form (single card). */
export function downloadHVACAuditExcelTemplate(
  form: {
    audit_date: string;
    pre_audit_information: {
      facility_name: string;
      location_address: string;
      client_contact_person: string;
      contact_number_email: string;
      type_of_facility: string;
      audit_dates: string[];
      auditor_team_members_names: string[];
      total_operating_hours_per_day: string;
      hvac_operating_hours_per_day: string;
      season_ambient_conditions: string;
    };
    documents_records_to_collect: Record<
      HVACAuditDocumentKey,
      { available: boolean; remarks: string }
    >;
    hvac_equipment_register: HVACAuditExcelEquipmentRow[];
    chiller_field_test: { readings: HVACAuditExcelChillerRow[] };
    auxiliary_power: { components: HVACAuditExcelAuxRow[] };
    cooling_tower_quick_test: { readings: HVACAuditExcelCoolingRow[] };
    summary: {
      average_cooling_produced_TR: string;
      average_chiller_power_used_kW: string;
      total_auxiliary_power_used_kW: string;
      total_plant_power_kW: string;
      plant_efficiency_kW_per_TR: string;
      coefficient_of_performance: string;
    };
  },
  filename = "hvac-audit-template.xlsx",
) {
  const wb = XLSX.utils.book_new();

  // --- Pre_audit: Field | Value + numbered visit dates / auditors
  const preRows: (string | number)[][] = [["Field", "Value"]];
  const pre = form.pre_audit_information;
  for (const { label, key } of PRE_AUDIT_LABELS) {
    const v = (pre as Record<string, string>)[key] ?? "";
    preRows.push([label, v]);
  }
  preRows.push([AUDIT_RECORD_DATE_LABEL, form.audit_date || ""]);

  const maxVisit = Math.max(pre.audit_dates?.length || 0, 1);
  for (let i = 1; i <= maxVisit; i += 1) {
    preRows.push([
      `Audit date (visit) ${i}`,
      pre.audit_dates[i - 1] ?? "",
    ]);
  }
  const maxAud = Math.max(pre.auditor_team_members_names?.length || 0, 1);
  for (let i = 1; i <= maxAud; i += 1) {
    preRows.push([
      `Auditor team member ${i}`,
      pre.auditor_team_members_names[i - 1] ?? "",
    ]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(preRows),
    SHEET_PRE,
  );

  // --- Documents
  const docRows: (string | number)[][] = [
    ["Document", "Available (Yes/No)", "Remarks"],
  ];
  for (const [label, key] of Object.entries(HVAC_AUDIT_DOCUMENT_LABEL_TO_KEY)) {
    const item = form.documents_records_to_collect[key];
    docRows.push([
      label,
      item?.available ? "Yes" : "No",
      item?.remarks ?? "",
    ]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(docRows),
    SHEET_DOCS,
  );

  // --- Equipment
  const eqHeader = [
    "Equipment name",
    "Type",
    "Capacity",
    "Power rating kW",
    "Quantity",
    "Remarks",
  ];
  const eqRows: (string | number)[][] = [eqHeader];
  for (const row of form.hvac_equipment_register) {
    eqRows.push([
      row.equipment_name,
      row.type,
      row.capacity,
      row.power_rating_kW,
      row.quantity,
      row.remarks,
    ]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(eqRows),
    SHEET_EQUIP,
  );

  // --- Chiller readings
  const chHeader = [
    "Chiller load (TR)",
    "Power input (kW)",
    "Chilled water in temp",
    "Chilled water out temp",
    "Condenser water in temp",
    "Condenser water out temp",
  ];
  const chRows: (string | number)[][] = [chHeader];
  for (const row of form.chiller_field_test.readings) {
    chRows.push([
      row.chiller_load_TR,
      row.power_input_kW,
      row.chilled_water_in_temp,
      row.chilled_water_out_temp,
      row.condenser_water_in_temp,
      row.condenser_water_out_temp,
    ]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(chRows),
    SHEET_CHILLER,
  );

  // --- Auxiliary
  const auxHeader = ["Name", "Power (kW)"];
  const auxRows: (string | number)[][] = [auxHeader];
  for (const row of form.auxiliary_power.components) {
    auxRows.push([row.name, row.power_kW]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(auxRows),
    SHEET_AUX,
  );

  // --- Cooling tower
  const ctHeader = ["Inlet temp", "Outlet temp", "Ambient temp"];
  const ctRows: (string | number)[][] = [ctHeader];
  for (const row of form.cooling_tower_quick_test.readings) {
    ctRows.push([row.inlet_temp, row.outlet_temp, row.ambient_temp]);
  }
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(ctRows),
    SHEET_TOWER,
  );

  XLSX.writeFile(wb, filename);
}

function parsePreAuditSheetClean(matrix: unknown[][]): Partial<HVACAuditExcelParsed> {
  let startRow = 0;
  if (matrix.length > 0) {
    const r0 = matrix[0];
    if (
      cellToString(r0?.[0]).toLowerCase() === "field" &&
      cellToString(r0?.[1]).toLowerCase() === "value"
    ) {
      startRow = 1;
    }
  }

  const labelToKey = new Map(
    PRE_AUDIT_LABELS.map((x) => [normalizeLabel(x.label), x.key]),
  );

  const pre: Record<string, string> = {};
  let auditDateRecord: string | undefined;
  const visitByIndex = new Map<number, string>();
  const auditorByIndex = new Map<number, string>();

  const visitRe = /^audit date \(visit\) (\d+)$/i;
  const auditorRe = /^auditor team member (\d+)$/i;

  for (let i = startRow; i < matrix.length; i += 1) {
    const row = matrix[i];
    if (!row || row.length < 2) continue;
    const fieldRaw = cellToString(row[0]);
    const valueRaw = cellToString(row[1]);
    if (!fieldRaw) continue;

    const n = normalizeLabel(fieldRaw);

    if (n === normalizeLabel(AUDIT_RECORD_DATE_LABEL)) {
      auditDateRecord = valueRaw;
      continue;
    }

    const vk = labelToKey.get(n);
    if (vk) {
      pre[vk as string] = valueRaw;
      continue;
    }

    let m = fieldRaw.match(visitRe);
    if (m) {
      visitByIndex.set(Number(m[1]), valueRaw);
      continue;
    }
    m = fieldRaw.match(auditorRe);
    if (m) {
      auditorByIndex.set(Number(m[1]), valueRaw);
      continue;
    }
  }

  const visitSorted = [...visitByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);
  const auditorSorted = [...auditorByIndex.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, v]) => v);

  const result: Partial<HVACAuditExcelParsed> = {};
  if (auditDateRecord !== undefined && auditDateRecord !== "") {
    result.audit_date = auditDateRecord;
  }

  const preInfo: HVACAuditExcelParsed["pre_audit_information"] = {
    ...pre,
  };

  if (visitSorted.some((x) => x.trim())) {
    preInfo.audit_dates = visitSorted.map((x) => x.trim()).filter(Boolean);
  }
  if (auditorSorted.some((x) => x.trim())) {
    preInfo.auditor_team_members_names = auditorSorted
      .map((x) => x.trim())
      .filter(Boolean);
  }

  if (Object.keys(preInfo).length > 0) {
    result.pre_audit_information = preInfo;
  }
  return result;
}

function parseDocumentsSheet(matrix: unknown[][]): Partial<HVACAuditExcelParsed> {
  if (matrix.length < 2) return {};
  const header = matrix[0].map((c) => cellToString(c).toLowerCase());
  const docIdx = header.findIndex((h) => h.includes("document"));
  const availIdx = header.findIndex(
    (h) => h.includes("available") || h.includes("yes"),
  );
  const remIdx = header.findIndex((h) => h.includes("remark"));
  if (docIdx < 0 || availIdx < 0) return {};

  const docs: Partial<
    Record<HVACAuditDocumentKey, HVACAuditExcelChecklistItem>
  > = {};

  const labelToKeyNorm = new Map(
    Object.entries(HVAC_AUDIT_DOCUMENT_LABEL_TO_KEY).map(([label, key]) => [
      normalizeLabel(label),
      key,
    ]),
  );

  for (let i = 1; i < matrix.length; i += 1) {
    const row = matrix[i];
    if (!row) continue;
    const docLabel = cellToString(row[docIdx]);
    const availRaw = cellToString(row[availIdx]);
    const remarks = remIdx >= 0 ? cellToString(row[remIdx]) : "";

    if (!docLabel) continue;
    const key = labelToKeyNorm.get(normalizeLabel(docLabel));
    if (!key) continue;

    const available = parseYesNo(availRaw);
    docs[key] = {
      ...(available !== undefined ? { available } : {}),
      remarks,
    };
  }

  return Object.keys(docs).length
    ? { documents_records_to_collect: docs }
    : {};
}

function parseTableSheet(matrix: unknown[][], headers: string[]): string[][] {
  if (matrix.length < 2) return [];
  const headerRow = matrix[0].map((c) => normalizeLabel(cellToString(c)));
  const idx = headers.map((h) =>
    headerRow.findIndex((cell) => cell === normalizeLabel(h)),
  );
  if (idx.some((i) => i < 0)) return [];

  const rows: string[][] = [];
  for (let r = 1; r < matrix.length; r += 1) {
    const row = matrix[r];
    if (!row) continue;
    const cells = idx.map((i) => cellToString(row[i]));
    if (cells.every((c) => !c.trim())) continue;
    rows.push(cells);
  }
  return rows;
}

export function parseHVACAuditExcel(file: File): Promise<HVACAuditExcelParsed> {
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
        const merged: HVACAuditExcelParsed = {};

        const readSheet = (name: string) =>
          workbook.Sheets[name] ? getMatrix(workbook.Sheets[name]) : null;

        const preM = readSheet(SHEET_PRE);
        if (preM) Object.assign(merged, parsePreAuditSheetClean(preM));

        const docM = readSheet(SHEET_DOCS);
        if (docM) Object.assign(merged, parseDocumentsSheet(docM));

        const eqM = readSheet(SHEET_EQUIP);
        if (eqM) {
          const hdr = [
            "equipment name",
            "type",
            "capacity",
            "power rating kw",
            "quantity",
            "remarks",
          ];
          const body = parseTableSheet(eqM, hdr);
          if (body.length) {
            merged.hvac_equipment_register = body.map((cells) => ({
              equipment_name: cells[0] || "",
              type: cells[1] || "",
              capacity: cells[2] || "",
              power_rating_kW: cells[3] || "",
              quantity: cells[4] || "",
              remarks: cells[5] || "",
            }));
          }
        }

        const chM = readSheet(SHEET_CHILLER);
        if (chM) {
          const hdr = [
            "chiller load (tr)",
            "power input (kw)",
            "chilled water in temp",
            "chilled water out temp",
            "condenser water in temp",
            "condenser water out temp",
          ];
          const body = parseTableSheet(chM, hdr);
          if (body.length) {
            merged.chiller_field_test = {
              readings: body.map((cells) => ({
                chiller_load_TR: cells[0] || "",
                power_input_kW: cells[1] || "",
                chilled_water_in_temp: cells[2] || "",
                chilled_water_out_temp: cells[3] || "",
                condenser_water_in_temp: cells[4] || "",
                condenser_water_out_temp: cells[5] || "",
              })),
            };
          }
        }

        const auxM = readSheet(SHEET_AUX);
        if (auxM) {
          const hdr = ["name", "power (kw)"];
          const body = parseTableSheet(auxM, hdr);
          if (body.length) {
            merged.auxiliary_power = {
              components: body.map((cells) => ({
                name: cells[0] || "",
                power_kW: cells[1] || "",
              })),
            };
          }
        }

        const ctM = readSheet(SHEET_TOWER);
        if (ctM) {
          const hdr = ["inlet temp", "outlet temp", "ambient temp"];
          const body = parseTableSheet(ctM, hdr);
          if (body.length) {
            merged.cooling_tower_quick_test = {
              readings: body.map((cells) => ({
                inlet_temp: cells[0] || "",
                outlet_temp: cells[1] || "",
                ambient_temp: cells[2] || "",
              })),
            };
          }
        }

        const sumM = readSheet(SHEET_SUMMARY);
        if (sumM) {
          let start = 0;
          if (sumM.length > 0) {
            const a0 = cellToString(sumM[0]?.[0]).toLowerCase();
            const b0 = cellToString(sumM[0]?.[1]).toLowerCase();
            if (a0 === "field" && b0 === "value") start = 1;
          }
          const summaryMap: Record<string, keyof NonNullable<HVACAuditExcelParsed["summary"]>> =
            {
              "average cooling produced (tr)": "average_cooling_produced_TR",
              "average chiller power used (kw)": "average_chiller_power_used_kW",
              "total auxiliary power used (kw)": "total_auxiliary_power_used_kW",
              "total plant power (kw)": "total_plant_power_kW",
              "plant efficiency (kw/tr)": "plant_efficiency_kW_per_TR",
              "coefficient of performance": "coefficient_of_performance",
            };
          const sum: NonNullable<HVACAuditExcelParsed["summary"]> = {};
          for (let i = start; i < sumM.length; i += 1) {
            const row = sumM[i];
            if (!row || row.length < 2) continue;
            const k = normalizeLabel(cellToString(row[0]));
            const v = cellToString(row[1]);
            const sk = summaryMap[k];
            if (sk) (sum as Record<string, string>)[sk] = v;
          }
          if (Object.keys(sum).length) merged.summary = sum;
        }

        resolve(merged);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsArrayBuffer(file);
  });
}
