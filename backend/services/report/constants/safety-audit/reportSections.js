/**
 * Electrical Safety Audit report payloads:
 * - `full_audit_report` & `executive_summary`: every checklist section (+ executive overview sheet for executive).
 * - `{specKey}_report`: cover, facility, utilities, and that checklist area only.
 */

import {
  safetyReportTypeToSpecKey,
} from "../../builders/safety-audit/reportModelRegistry.js";

/** @type {readonly string[]} */
const FULL_SAFETY_CHECKLIST_REPORT_TYPES = Object.freeze([
  "full_audit_report",
  "executive_summary",
]);

/**
 * @param {string} reportType
 * @returns {boolean}
 */
export const shouldBuildAllSafetyChecklistSections = (reportType) =>
  FULL_SAFETY_CHECKLIST_REPORT_TYPES.includes(reportType);

/**
 * @param {string} reportType
 * @returns {boolean}
 */
export const shouldBuildSafetyExecutiveOverviewSheet = (reportType) =>
  reportType === "executive_summary";

/**
 * @param {string} reportType
 * @returns {boolean}
 */
export const shouldBuildGranularSafetyChecklistSection = (reportType) =>
  Boolean(safetyReportTypeToSpecKey(reportType));

/**
 * @param {string} reportType
 * @returns {string | null}
 */
export { safetyReportTypeToSpecKey };
