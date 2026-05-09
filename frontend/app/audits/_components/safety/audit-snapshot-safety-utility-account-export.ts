import type {
  FacilityAuditSafetyUtilityNest,
  FacilityAuditSnapshotSafetyData,
} from "@/store/slices/auditApiSlice";

import {
  formatAuditSnapshotCellPreview,
  humanizeNestedKey,
} from "../shared/audit-snapshot-table-utils";
import {
  getUtilityAccountNumber,
} from "./audit-snapshot-utility-sidebar";

/** One logical row width so Excel / PDF tables stay rectangular. */
const COL_COUNT = 7;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function padRow(cells: (string | number)[]): (string | number)[] {
  const out = [...cells];
  while (out.length < COL_COUNT) out.push("");
  return out.slice(0, COL_COUNT);
}

/** SheetJS `!cols`: character widths from cell content (capped; newline = longest line). */
function xlsxAutoColWidths(
  aoa: (string | number)[][],
): { wch: number }[] {
  const maxLens = Array.from({ length: COL_COUNT }, () => 0);
  for (const row of aoa) {
    for (let c = 0; c < COL_COUNT; c++) {
      const cell = row[c];
      const s = cell == null ? "" : String(cell);
      const lineMax = Math.max(
        ...s.split(/\r?\n/).map((line) => line.length),
        0,
      );
      maxLens[c] = Math.max(maxLens[c], lineMax);
    }
  }
  const minW = 6;
  const maxW = 100;
  return maxLens.map((n) => ({
    wch: Math.min(maxW, Math.max(minW, n + 2)),
  }));
}

/** Matches common `Facility` display fields (see `backend/modals/facility.js`). */
const FACILITY_BASIC_KEYS: string[] = [
  "name",
  "city",
  "address",
  "client_representative",
  "client_contact_number",
  "client_email",
  "facility_type",
  "status",
  "audit_type",
  "start_date",
  "audit_date",
  "closure_date",
];

const CHECKLIST_DOC_OMIT = new Set([
  "_id",
  "__v",
  "facility_id",
  "utility_account_id",
  "items",
  "documents",
  "created_at",
  "updated_at",
  "createdAt",
  "updatedAt",
]);

function isIdLikeKey(key: string): boolean {
  if (key.startsWith("__")) return true;
  if (key === "_id" || key === "id") return true;
  if (/_id$/i.test(key)) return true;
  return false;
}

/** Raw Mongo ObjectId hex as returned by JSON APIs. */
function isMongoObjectIdString(s: string): boolean {
  const t = s.trim();
  return t.length === 24 && /^[a-f0-9]{24}$/i.test(t);
}

/** Unpopulated ref serialized as `{ _id: "…" }` only. */
function valueLooksLikeBareId(value: unknown): boolean {
  if (!isPlainObject(value)) return false;
  const keys = Object.keys(value).filter((k) => k !== "__v");
  if (
    keys.length === 1 &&
    keys[0] === "_id" &&
    (typeof value._id === "string" || isPlainObject(value._id))
  ) {
    const raw =
      typeof value._id === "string"
        ? value._id
        : value._id != null &&
            isPlainObject(value._id) &&
            "$oid" in value._id &&
            typeof (value._id as { $oid?: unknown }).$oid === "string"
          ? (value._id as { $oid: string }).$oid
          : String(value._id ?? "");
    return isMongoObjectIdString(raw);
  }
  return false;
}

/**
 * Snapshot cell text for Excel/PDF: hide raw ObjectIds; show populated User as name/email.
 */
function formatExportCell(value: unknown): string {
  if (value == null || value === "") return "—";
  if (typeof value === "string" && isMongoObjectIdString(value.trim()))
    return "—";
  if (valueLooksLikeBareId(value)) return "—";

  const auditorLabel = formatAuditorDisplay(value);
  if (auditorLabel) return auditorLabel;

  const s = formatAuditSnapshotCellPreview(value);
  const t = s.trim();
  if (isMongoObjectIdString(t)) return "—";
  return s;
}

function formatAuditDateDisplay(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  return formatAuditSnapshotCellPreview(value);
}

/** Resolves populated `auditor_id` (and similar user refs) for export summary rows. */
function formatAuditorDisplay(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") {
    const s = value.trim();
    if (!s) return "";
    if (isMongoObjectIdString(s)) return "";
    return s;
  }
  if (isPlainObject(value)) {
    const o = value;
    if (typeof o.name === "string" && o.name.trim()) return o.name.trim();
    const first =
      typeof o.first_name === "string" ? o.first_name.trim() : "";
    const last = typeof o.last_name === "string" ? o.last_name.trim() : "";
    const full = `${first} ${last}`.trim();
    if (full) return full;
    if (typeof o.email === "string" && o.email.trim()) return o.email.trim();
    if (typeof o.username === "string" && o.username.trim()) {
      return o.username.trim();
    }
  }
  return "";
}

function collectAuditDatesAndAuditors(args: {
  facility: unknown;
  sections: Record<string, unknown[]>;
}): { dates: string[]; auditors: string[] } {
  const dateSet = new Set<string>();
  const auditorSet = new Set<string>();

  if (isPlainObject(args.facility)) {
    const ad = args.facility.audit_date;
    if (ad != null && ad !== "") {
      const s = formatAuditDateDisplay(ad);
      if (s) dateSet.add(s);
    }
    const au = args.facility.auditor_id;
    const auditorLabel = formatAuditorDisplay(au);
    if (auditorLabel) auditorSet.add(auditorLabel);
  }

  for (const arr of Object.values(args.sections)) {
    if (!Array.isArray(arr)) continue;
    for (const doc of arr) {
      if (!isPlainObject(doc)) continue;
      const ad = doc.audit_date;
      if (ad != null && ad !== "") {
        const s = formatAuditDateDisplay(ad);
        if (s) dateSet.add(s);
      }
      const au = doc.auditor_id;
      const auditorLabel = formatAuditorDisplay(au);
      if (auditorLabel) auditorSet.add(auditorLabel);
    }
  }

  const dates = [...dateSet].sort((a, b) => a.localeCompare(b));
  const auditors = [...auditorSet].sort((a, b) => a.localeCompare(b));
  return { dates, auditors };
}

function facilityBasicRows(facility: unknown): (string | number)[][] {
  const rows: (string | number)[][] = [];
  rows.push(padRow(["FACILITY", "", "", "", "", "", ""]));

  if (!isPlainObject(facility)) {
    rows.push(padRow(["(No facility payload)", "", "", "", "", "", ""]));
    return rows;
  }

  for (const key of FACILITY_BASIC_KEYS) {
    if (!(key in facility)) continue;
    const v = facility[key];
    if (v === null || v === undefined || v === "") continue;
    if (isIdLikeKey(key)) continue;
    rows.push(
      padRow([
        humanizeNestedKey(key),
        formatExportCell(v),
        "",
        "",
        "",
        "",
        "",
      ]),
    );
  }

  if (rows.length <= 1) {
    rows.push(
      padRow(["(No basic facility fields)", "", "", "", "", "", ""]),
    );
  }
  return rows;
}

function appendChecklistItemGrid(
  rows: (string | number)[][],
  items: unknown,
): void {
  if (!Array.isArray(items) || items.length === 0) return;

  rows.push(
    padRow([
      "Checklist items",
      "Sr",
      "Activity",
      "Requirement",
      "Compliance",
      "Remarks / actions",
      "Severity",
    ]),
  );

  for (const it of items) {
    if (!isPlainObject(it)) {
      rows.push(
        padRow([
          "",
          "",
          formatExportCell(it),
          "",
          "",
          "",
          "",
        ]),
      );
      continue;
    }
    const remarksLine = [formatExportCell(it.remarks), formatExportCell(it.recommendations)]
      .filter((s) => s !== "—" && s !== "")
      .join(" · ");
    rows.push(
      padRow([
        "",
        formatExportCell(it.sr_no),
        formatExportCell(it.activity_description),
        formatExportCell(it.requirement),
        formatExportCell(it.compliance),
        remarksLine || "—",
        formatExportCell(it.severity),
      ]),
    );
  }
}

function appendOtherDocFields(
  rows: (string | number)[][],
  doc: Record<string, unknown>,
): void {
  const keys = Object.keys(doc)
    .filter((k) => !CHECKLIST_DOC_OMIT.has(k) && !isIdLikeKey(k))
    .sort((a, b) => a.localeCompare(b));

  let any = false;
  for (const k of keys) {
    const v = doc[k];
    if (valueLooksLikeBareId(v)) continue;
    if (typeof v === "string" && isMongoObjectIdString(v.trim())) continue;
    any = true;
    rows.push(
      padRow([
        humanizeNestedKey(k),
        formatExportCell(v),
        "",
        "",
        "",
        "",
        "",
      ]),
    );
  }
  if (!any) {
    rows.push(padRow(["(No extra fields)", "", "", "", "", "", ""]));
  }
}

/**
 * Single-sheet rows: facility basics → utility account → audit summary → each checklist with sub-headings.
 */
export function buildSafetyUtilityAccountSingleSheetAoa(
  snapshot: FacilityAuditSnapshotSafetyData,
  utilityNest: FacilityAuditSafetyUtilityNest,
): (string | number)[][] {
  const sections = utilityNest.safety_sections || {};
  const sectionKeys = Object.keys(sections).sort((a, b) => a.localeCompare(b));

  const rows: (string | number)[][] = [];

  rows.push(
    padRow([
      "Electrical safety audit — utility account export",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(padRow(["", "", "", "", "", "", ""]));

  const facilityName =
    isPlainObject(snapshot.facility) &&
    typeof snapshot.facility.name === "string"
      ? snapshot.facility.name
      : "—";
  rows.push(padRow(["Facility name", facilityName, "", "", "", "", ""]));

  rows.push(...facilityBasicRows(snapshot.facility));
  rows.push(padRow(["", "", "", "", "", "", ""]));

  rows.push(padRow(["UTILITY ACCOUNT", "", "", "", "", "", ""]));
  rows.push(
    padRow([
      "Account number",
      getUtilityAccountNumber(utilityNest.utility_account),
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(padRow(["", "", "", "", "", "", ""]));

  const { dates, auditors } = collectAuditDatesAndAuditors({
    facility: snapshot.facility,
    sections,
  });
  rows.push(padRow(["AUDIT SUMMARY", "", "", "", "", "", ""]));
  rows.push(
    padRow([
      "Audit date(s)",
      dates.length ? dates.join("; ") : "—",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(
    padRow([
      "Auditor(s)",
      auditors.length ? auditors.join("; ") : "—",
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(
    padRow([
      "Program",
      snapshot.audit_type,
      "",
      "",
      "",
      "",
      "",
    ]),
  );
  rows.push(padRow(["", "", "", "", "", "", ""]));

  rows.push(padRow(["CHECKLISTS", "", "", "", "", "", ""]));
  rows.push(padRow(["", "", "", "", "", "", ""]));

  for (const key of sectionKeys) {
    const arr = sections[key];
    const list = Array.isArray(arr) ? arr : [];
    const title = humanizeNestedKey(key);

    rows.push(padRow([`▸ ${title}`, "", "", "", "", "", ""]));

    if (list.length === 0) {
      rows.push(
        padRow(["(No records for this checklist)", "", "", "", "", "", ""]),
      );
      rows.push(padRow(["", "", "", "", "", "", ""]));
      continue;
    }

    list.forEach((rec, idx) => {
      if (list.length > 1) {
        rows.push(
          padRow([
            `Record ${idx + 1} of ${list.length}`,
            "",
            "",
            "",
            "",
            "",
            "",
          ]),
        );
      }

      if (!isPlainObject(rec)) {
        rows.push(
          padRow([
            "Content",
            formatExportCell(rec),
            "",
            "",
            "",
            "",
            "",
          ]),
        );
        rows.push(padRow(["", "", "", "", "", "", ""]));
        return;
      }

      appendChecklistItemGrid(rows, rec.items);
      appendOtherDocFields(rows, rec);
      rows.push(padRow(["", "", "", "", "", "", ""]));
    });
  }

  return rows;
}

export function buildSafetyUtilityAccountExportFileBase(
  snapshot: FacilityAuditSnapshotSafetyData,
  utilityNest: FacilityAuditSafetyUtilityNest,
): string {
  const facilityName =
    isPlainObject(snapshot.facility) &&
    typeof snapshot.facility.name === "string"
      ? snapshot.facility.name.trim().replace(/[^a-z0-9]+/gi, "-").slice(0, 40)
      : "facility";
  const accountLabel = getUtilityAccountNumber(utilityNest.utility_account)
    .replace(/[^a-z0-9]+/gi, "-")
    .slice(0, 32);
  const date = new Date().toISOString().slice(0, 10);
  return `safety-audit_${facilityName}_${accountLabel}_${date}`
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
}

export async function downloadSafetyUtilityAccountExcel(
  snapshot: FacilityAuditSnapshotSafetyData,
  utilityNest: FacilityAuditSafetyUtilityNest,
): Promise<void> {
  const { utils, writeFile } = await import("xlsx");
  const aoa = buildSafetyUtilityAccountSingleSheetAoa(snapshot, utilityNest);
  const ws = utils.aoa_to_sheet(aoa);
  ws["!cols"] = xlsxAutoColWidths(aoa);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Safety audit export");
  const base = buildSafetyUtilityAccountExportFileBase(snapshot, utilityNest);
  writeFile(wb, `${base}.xlsx`, { compression: true });
}

export async function downloadSafetyUtilityAccountPdf(
  snapshot: FacilityAuditSnapshotSafetyData,
  utilityNest: FacilityAuditSafetyUtilityNest,
): Promise<void> {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableMod.default;

  const aoa = buildSafetyUtilityAccountSingleSheetAoa(snapshot, utilityNest);
  const body = aoa.map((r) => r.map((c) => String(c ?? "")));

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "pt",
    format: "a4",
  });
  const margin = { top: 36, left: 28, right: 28, bottom: 36 };

  doc.setFontSize(11);
  doc.text(
    "Electrical safety audit — single export (facility, account, dates, auditors, checklists)",
    margin.left,
    margin.top - 8,
  );

  autoTable(doc, {
    startY: margin.top + 6,
    body,
    theme: "grid",
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: "linebreak",
      valign: "top",
    },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { cellWidth: 200 },
      2: { cellWidth: 55 },
      3: { cellWidth: 120 },
      4: { cellWidth: 55 },
      5: { cellWidth: 120 },
      6: { cellWidth: 55 },
    },
    headStyles: { fillColor: [120, 53, 15] },
    margin,
    didParseCell: (data) => {
      const raw = data.cell.raw;
      const text = typeof raw === "string" ? raw : String(raw ?? "");
      if (
        text.startsWith("▸ ") ||
        text === "FACILITY" ||
        text === "UTILITY ACCOUNT" ||
        text === "AUDIT SUMMARY" ||
        text === "CHECKLISTS" ||
        text === "Checklist items" ||
        /^Record \d+ of \d+$/.test(text)
      ) {
        data.cell.styles.fontStyle = "bold";
        data.cell.styles.fillColor = [254, 243, 199];
      }
    },
  });

  doc.save(
    `${buildSafetyUtilityAccountExportFileBase(snapshot, utilityNest)}.pdf`,
  );
}
