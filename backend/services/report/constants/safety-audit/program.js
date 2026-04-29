import { SAFETY_GRANULAR_REPORT_TYPES } from "../../builders/safety-audit/reportModelRegistry.js";

/** Matches `facility.audit_type` enum in `modals/facility.js`. */
export const ELECTRICAL_SAFETY_AUDIT = "Electrical Safety Audit";

export const isElectricalSafetyAuditFacility = (facility) =>
  facility?.audit_type === ELECTRICAL_SAFETY_AUDIT;

/**
 * Report types allowed when `facility.audit_type` is Electrical Safety Audit.
 * Includes program-wide types plus one type per checklist model (`{registryKey}_report`).
 */
export const ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES = Object.freeze([
  "full_audit_report",
  "executive_summary",
  ...SAFETY_GRANULAR_REPORT_TYPES,
]);

export const SAFETY_ALLOWED_REPORT_TYPES = new Set(
  ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES,
);
