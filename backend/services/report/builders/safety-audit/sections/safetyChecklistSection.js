import mongoose from "mongoose";

import UtilityAccount from "../../../../../modals/utilityAccount.js";

import { SAFETY_REPORT_MODEL_SPECS } from "../reportModelRegistry.js";

export const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  return String(value);
};

export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

export const ITEM_COLUMNS = [
  { key: "sr_no", label: "Sr No", type: "integer" },
  { key: "activity_description", label: "Activity / Description" },
  { key: "requirement", label: "Requirement" },
  { key: "compliance", label: "Compliance" },
  { key: "severity", label: "Severity" },
  { key: "remarks", label: "Remarks" },
  { key: "recommendations", label: "Recommendations" },
];

export const itemRows = (items = []) =>
  (Array.isArray(items) ? items : []).map((item) => ({
    sr_no: item?.sr_no ?? "",
    activity_description: item?.activity_description ?? "",
    requirement: item?.requirement ?? "",
    compliance: item?.compliance ?? "",
    severity: item?.severity ?? "",
    remarks: item?.remarks ?? "",
    recommendations: item?.recommendations ?? "",
  }));

export const resolveAccountLabel = (doc, accountMap) => {
  const populated = doc?.utility_account_id;
  if (populated && typeof populated === "object" && populated.account_number) {
    return populated.account_number;
  }
  const id = getId(populated);
  return accountMap.get(id) || id || "—";
};

export const recordHeadingExtras = (doc) => {
  const parts = [];
  if (doc?.name) parts.push(String(doc.name));
  if (doc?.equipment_name) parts.push(String(doc.equipment_name));
  if (doc?.location) parts.push(String(doc.location));
  if (doc?.capacity_kva != null && doc?.capacity_kva !== "") {
    parts.push(`${doc.capacity_kva} kVA`);
  }
  return parts.length ? ` | ${parts.join(" · ")}` : "";
};

export const buildQuery = (facilityId, utilityAccountId) => {
  const q = { facility_id: new mongoose.Types.ObjectId(getId(facilityId)) };
  if (utilityAccountId) {
    q.utility_account_id = new mongoose.Types.ObjectId(
      getId(utilityAccountId),
    );
  }
  return q;
};

export const fetchDocsForModel = (Model, facility, utilityAccount) =>
  Model.find(buildQuery(facility._id, utilityAccount?._id))
    .populate("utility_account_id", "account_number")
    .sort({ updated_at: -1, audit_date: -1 })
    .lean();

export const aggregateDocStats = (docs = []) => {
  let itemsTotal = 0;
  let yes = 0;
  let no = 0;
  let partial = 0;
  let na = 0;
  let empty = 0;
  let critical = 0;
  let high = 0;

  docs.forEach((doc) => {
    const items = Array.isArray(doc?.items) ? doc.items : [];
    itemsTotal += items.length;
    items.forEach((item) => {
      const c = String(item?.compliance || "").toLowerCase();
      if (c === "yes") yes += 1;
      else if (c === "no") no += 1;
      else if (c === "partial") partial += 1;
      else if (c === "na") na += 1;
      else empty += 1;

      const s = String(item?.severity || "").toLowerCase();
      if (s === "critical") critical += 1;
      else if (s === "high") high += 1;
    });
  });

  return {
    records: docs.length,
    items_total: itemsTotal,
    compliance_yes: yes,
    compliance_no: no,
    compliance_partial: partial,
    compliance_na: na,
    compliance_blank: empty,
    severity_critical: critical,
    severity_high: high,
  };
};

export const buildSafetyAccountMap = async (facilityId) => {
  const accounts = await UtilityAccount.find({
    facility_id: new mongoose.Types.ObjectId(getId(facilityId)),
  })
    .select("account_number")
    .lean();

  const map = new Map();
  accounts.forEach((a) => {
    if (a?._id) map.set(String(a._id), a.account_number || String(a._id));
  });
  return map;
};

/**
 * Turns a checklist section `{ sections: [{ heading, columns, rows }] }` into
 * Excel/PDF `table` blocks (same column definitions as the subsection rows).
 *
 * @param {{ sections?: Array<{ heading?: string; rows?: object[] }> } | null} section
 * @returns {Array<{ type: 'table'; heading?: string; columns: typeof ITEM_COLUMNS; items: object[] }>}
 */
export const safetyChecklistSectionToTableBlocks = (section) => {
  if (!section || !Array.isArray(section.sections) || !section.sections.length) {
    return [];
  }
  return section.sections.map((sub) => ({
    type: "table",
    heading: sub.heading,
    columns: ITEM_COLUMNS,
    items: Array.isArray(sub.rows) ? sub.rows : [],
  }));
};

/**
 * @param {{ key: string; title: string; Model: import("mongoose").Model }} spec
 * @param {{ facility: object; utilityAccount?: object | null; accountMap: Map }} ctx
 */
export const buildSafetyChecklistSection = async (spec, ctx) => {
  const { facility, utilityAccount, accountMap } = ctx;
  const docs = await fetchDocsForModel(spec.Model, facility, utilityAccount);
  if (!docs.length) return null;

  const subsections = docs.map((doc) => {
    const acc = resolveAccountLabel(doc, accountMap);
    // Match electrical-energy subsection pattern `{prefix} - …` so Excel/PDF apply the same account-based row tints.
    const heading =
      `${acc} - ${spec.title} — ${formatDate(doc.audit_date)} — ${doc.status || "draft"}${recordHeadingExtras(doc)}`;

    return {
      heading,
      columns: ITEM_COLUMNS.map((c) => c.key),
      rows: itemRows(doc.items),
    };
  });

  return {
    key: spec.key,
    title: spec.title,
    sections: subsections,
  };
};

/**
 * @param {string} specKey
 * @returns {(ctx: { facility: object; utilityAccount?: object | null; accountMap: Map }) => ReturnType<typeof buildSafetyChecklistSection>}
 */
export const createSafetySectionBuilder = (specKey) => {
  const spec = SAFETY_REPORT_MODEL_SPECS.find((s) => s.key === specKey);
  if (!spec) {
    throw new Error(`Unknown safety report section key: ${specKey}`);
  }
  return (ctx) => buildSafetyChecklistSection(spec, ctx);
};
