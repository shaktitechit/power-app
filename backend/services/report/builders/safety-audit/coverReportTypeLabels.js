import {
  SAFETY_REPORT_MODEL_SPECS,
  SAFETY_SECTION_REPORT_TYPE_SUFFIX,
} from "./reportModelRegistry.js";

/**
 * Cover / PDF display names for Electrical Safety Audit `report_type` values.
 * Granular keys follow `{specKey}${SAFETY_SECTION_REPORT_TYPE_SUFFIX}` (e.g. `safety_general_report`).
 */
const granular = Object.fromEntries(
  SAFETY_REPORT_MODEL_SPECS.map((s) => [
    `${s.key}${SAFETY_SECTION_REPORT_TYPE_SUFFIX}`,
    `${s.title} — Report`,
  ]),
);

export const SAFETY_COVER_REPORT_TYPE_LABELS = Object.freeze({
  full_audit_report: "Full Electrical Safety Audit Report",
  executive_summary:
    "Electrical Safety Executive Summary (all areas + overview)",
  ...granular,
});
