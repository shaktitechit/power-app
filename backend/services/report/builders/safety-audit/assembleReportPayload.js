import { buildCoverSection } from "../shared/buildCoverSection.js";
import { SAFETY_COVER_REPORT_TYPE_LABELS } from "./coverReportTypeLabels.js";
import { buildFacilityInfoSection } from "../shared/buildFacilityInfoSection.js";
import { buildUtilityAccountsSection } from "./buildUtilityAccountsSection.js";

import { SAFETY_ALLOWED_REPORT_TYPES } from "../../constants/safety-audit/program.js";
import {
  shouldBuildAllSafetyChecklistSections,
  shouldBuildGranularSafetyChecklistSection,
  shouldBuildSafetyExecutiveOverviewSheet,
} from "../../constants/safety-audit/reportSections.js";
import {
  buildSafetyAccountMap,
  buildSafetyExecutiveSummarySheet,
  buildSafetyReportSummaryMeta,
  SAFETY_CHECKLIST_SECTION_BUILDERS,
} from "./sections/index.js";
import { createSafetySectionBuilder } from "./sections/safetyChecklistSection.js";
import { safetyReportTypeToSpecKey } from "./reportModelRegistry.js";

const throwError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

const createEmptyResult = (meta) => ({
  meta,
  cover: null,
  facility_info: null,
  utility_accounts: [],
  utility_accounts_summary: null,
  tariffs: [],
  tariff_summary: null,
  billing_records: [],
  billing_summary: null,
  solar_systems: [],
  solar_summary: null,
  dg_sets: [],
  dg_summary: null,
  transformers: [],
  transformer_summary: null,
  pumps: [],
  pump_summary: null,
  hvac_records: [],
  hvac_summary: null,
  ac_records: [],
  ac_summary: null,
  fan_records: [],
  fan_summary: null,
  lighting_records: [],
  lighting_summary: null,
  lux_records: [],
  lux_summary: null,
  misc_records: [],
  misc_summary: null,
  recommendations: [],
  summary: null,
  sections: [],
  sheet_sections: [],
});

const pushSectionIfValid = (result, section) => {
  if (!section || typeof section !== "object") return;

  if (Array.isArray(section.blocks) && section.blocks.length) {
    result.sheet_sections.push(section);
    return;
  }

  if (
    (Array.isArray(section.items) && section.items.length) ||
    (Array.isArray(section.sections) && section.sections.length) ||
    (Array.isArray(section.table_rows) && section.table_rows.length)
  ) {
    result.sections.push(section);
  }
};

const safeSection = async (builder, fallback, label = "section") => {
  try {
    const result = await builder();
    return result ?? fallback;
  } catch (error) {
    console.error(`Failed to build safety ${label}:`, error);
    return fallback;
  }
};

/**
 * Shared implementation for safety audit report payloads (facility or utility-account scope).
 *
 * @param {object} params
 * @param {"facility" | "utility_account"} params.scope
 */
export const assembleReportPayload = async ({
  report,
  facility,
  utilityAccount,
  meta,
  scope,
}) => {
  if (!report) {
    throwError("report is required in assembleReportPayload", 500);
  }
  if (!facility) {
    throwError("facility is required in assembleReportPayload", 500);
  }
  if (scope !== "facility" && scope !== "utility_account") {
    throwError(`Invalid scope for safety assembleReportPayload: ${scope}`, 500);
  }
  if (scope === "utility_account" && !utilityAccount) {
    throwError(
      "utilityAccount is required for utility_account scope report",
      500,
    );
  }

  const rawType = report.report_type || "full_audit_report";
  const reportType = SAFETY_ALLOWED_REPORT_TYPES.has(rawType)
    ? rawType
    : "full_audit_report";

  const result = createEmptyResult(meta);
  const accountMap = await buildSafetyAccountMap(facility._id);

  const scopedUtilityAccount =
    scope === "utility_account" ? utilityAccount : null;

  const checklistCtx = {
    facility,
    utilityAccount: scopedUtilityAccount,
    accountMap,
  };

  result.cover = await safeSection(
    () =>
      buildCoverSection({
        report,
        meta,
        facility,
        utilityAccount: scopedUtilityAccount,
        scope,
        reportTypeLabels: SAFETY_COVER_REPORT_TYPE_LABELS,
      }),
    null,
    "cover",
  );

  const facilityInfo = await safeSection(
    () =>
      buildFacilityInfoSection({
        report,
        meta,
        facility,
        utilityAccount: scopedUtilityAccount,
        scope,
      }),
    null,
    "facility_info",
  );
  result.facility_info = facilityInfo;
  pushSectionIfValid(result, facilityInfo);

  const utilitySection = await safeSection(
    () =>
      buildUtilityAccountsSection({
        report,
        meta,
        facility,
        utilityAccount: scopedUtilityAccount,
        scope,
      }),
    {
      key: "utility_accounts",
      title: "Utility Accounts",
      items: [],
      summary: null,
      columns: [],
    },
    "utility_accounts",
  );
  result.utility_accounts = utilitySection.items || [];
  result.utility_accounts_summary = utilitySection.summary || null;
  pushSectionIfValid(result, utilitySection);

  if (shouldBuildSafetyExecutiveOverviewSheet(reportType)) {
    const summarySheet = await buildSafetyExecutiveSummarySheet({
      facility,
      utilityAccount: scopedUtilityAccount,
    });
    result.sheet_sections.push(summarySheet);
  }

  if (shouldBuildAllSafetyChecklistSections(reportType)) {
    await Promise.all(
      SAFETY_CHECKLIST_SECTION_BUILDERS.map(async (buildSection) => {
        const section = await buildSection(checklistCtx);
        if (section) pushSectionIfValid(result, section);
      }),
    );
  } else if (shouldBuildGranularSafetyChecklistSection(reportType)) {
    const specKey = safetyReportTypeToSpecKey(reportType);
    if (specKey) {
      const buildSection = createSafetySectionBuilder(specKey);
      const section = await buildSection(checklistCtx);
      if (section) pushSectionIfValid(result, section);
    }
  }

  result.summary = await buildSafetyReportSummaryMeta({
    facility,
    utilityAccount: scopedUtilityAccount,
  });

  return result;
};

export default assembleReportPayload;
