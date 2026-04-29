import { SAFETY_REPORT_MODEL_SPECS } from "../reportModelRegistry.js";

import { aggregateDocStats, fetchDocsForModel } from "./safetyChecklistSection.js";

export const buildSafetyExecutiveSummarySheet = async ({
  facility,
  utilityAccount,
}) => {
  const headingPrefix =
    (utilityAccount?.account_number && String(utilityAccount.account_number).trim()) ||
    (facility?.name && String(facility.name).trim()) ||
    "Facility";

  const rows = await Promise.all(
    SAFETY_REPORT_MODEL_SPECS.map(async (spec) => {
      const docs = await fetchDocsForModel(spec.Model, facility, utilityAccount);
      const stats = aggregateDocStats(docs);
      return {
        area: spec.title,
        records: stats.records,
        checklist_items: stats.items_total,
        yes: stats.compliance_yes,
        no: stats.compliance_no,
        partial: stats.compliance_partial,
        na: stats.compliance_na,
        unanswered: stats.compliance_blank,
        critical_findings: stats.severity_critical,
        high_findings: stats.severity_high,
      };
    }),
  );

  return {
    title: "Electrical Safety — Summary",
    blocks: [
      {
        type: "table",
        heading: `${headingPrefix} - Checklist overview by area`,
        columns: [
          { key: "area", label: "Area" },
          { key: "records", label: "Records", type: "integer" },
          { key: "checklist_items", label: "Checklist items", type: "integer" },
          { key: "yes", label: "Yes", type: "integer" },
          { key: "no", label: "No", type: "integer" },
          { key: "partial", label: "Partial", type: "integer" },
          { key: "na", label: "N/A", type: "integer" },
          { key: "unanswered", label: "Blank", type: "integer" },
          { key: "critical_findings", label: "Critical", type: "integer" },
          { key: "high_findings", label: "High", type: "integer" },
        ],
        items: rows,
      },
    ],
  };
};
