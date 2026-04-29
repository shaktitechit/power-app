import { SAFETY_REPORT_MODEL_SPECS } from "../reportModelRegistry.js";

import { buildQuery } from "./safetyChecklistSection.js";

export const buildSafetyReportSummaryMeta = async ({
  facility,
  utilityAccount,
}) => {
  const query = buildQuery(facility._id, utilityAccount?._id);
  let totalRecords = 0;
  let totalItems = 0;

  await Promise.all(
    SAFETY_REPORT_MODEL_SPECS.map(async ({ Model }) => {
      const docs = await Model.find(query).select("items").lean();
      totalRecords += docs.length;
      docs.forEach((d) => {
        totalItems += Array.isArray(d.items) ? d.items.length : 0;
      });
    }),
  );

  return {
    facility_name: facility?.name || "",
    facility_city: facility?.city || "",
    audit_program: "Electrical Safety Audit",
    total_safety_record_rows: totalRecords,
    total_safety_checklist_items: totalItems,
    utility_scope: utilityAccount ? "utility_account" : "facility",
    utility_account_number: utilityAccount?.account_number || "",
  };
};
