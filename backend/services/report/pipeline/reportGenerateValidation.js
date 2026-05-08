import {
  ELECTRICAL_SAFETY_AUDIT,
  ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES,
  SAFETY_ALLOWED_REPORT_TYPES,
} from "../constants/safety-audit/program.js";
import { ELECTRICAL_ENERGY_AUDIT } from "../constants/electrical-energy/program.js";
import { ELECTRICAL_ENERGY_REPORT_TYPES } from "../constants/electrical-energy/reportTypes.js";
import {
  SAFETY_GRANULAR_REPORT_TYPES,
} from "../builders/safety-audit/reportModelRegistry.js";
import { GENERATION_ALLOWED_REPORT_TYPES } from "../constants/reportGenerationPolicy.js";

export { GENERATION_ALLOWED_REPORT_TYPES };

export const REPORT_SCOPES = ["facility", "utility_account"];

const SAFETY_ONLY_GRANULAR_TYPES = new Set(SAFETY_GRANULAR_REPORT_TYPES);

export const REPORT_TYPES = [
  ...ELECTRICAL_ENERGY_REPORT_TYPES,
  ...SAFETY_GRANULAR_REPORT_TYPES,
];

/** Facility audit programs that support PDF/Excel report generation. */
export const FACILITY_AUDIT_TYPES_WITH_REPORT_SUPPORT = new Set([
  ELECTRICAL_ENERGY_AUDIT,
  ELECTRICAL_SAFETY_AUDIT,
]);

export const throwError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
};

export const normalizeReportScope = (scope) => {
  if (!scope) return "facility";

  if (!REPORT_SCOPES.includes(scope)) {
    throwError("Invalid report_scope", 400);
  }

  return scope;
};

export const normalizeReportType = (type) => {
  if (!type) return "full_audit_report";

  if (!REPORT_TYPES.includes(type)) {
    throwError("Invalid report_type", 400);
  }

  return type;
};

/** Enforces create/generate API policy — only {@link GENERATION_ALLOWED_REPORT_TYPES}. */
export const normalizeGenerationReportType = (type) => {
  const normalized = normalizeReportType(type);
  if (!GENERATION_ALLOWED_REPORT_TYPES.includes(normalized)) {
    throwError(
      `Only ${GENERATION_ALLOWED_REPORT_TYPES.join(", ")} can be generated`,
      400,
    );
  }
  return normalized;
};

export const buildDefaultTitle = ({
  facility,
  utilityAccount,
  reportType,
}) => {
  const safeType = reportType.replaceAll("_", " ");
  const date = new Date().toLocaleDateString("en-GB");

  if (utilityAccount?.account_number) {
    return `${facility.name} - ${utilityAccount.account_number} - ${safeType} - ${date}`;
  }

  return `${facility.name} - ${safeType} - ${date}`;
};

export const buildSnapshotMeta = ({
  facility,
  utilityAccount,
  snapshot_meta = {},
}) => ({
  facility_name: snapshot_meta.facility_name || facility?.name || "",
  facility_city: snapshot_meta.facility_city || facility?.city || "",
  utility_account_number:
    snapshot_meta.utility_account_number ||
    utilityAccount?.account_number ||
    "",
  report_period_from: snapshot_meta.report_period_from || null,
  report_period_to: snapshot_meta.report_period_to || null,
});

export const validateGeneratePayload = ({
  facility_id,
  utility_account_id,
  report_scope,
  report_type,
}) => {
  if (!facility_id) {
    throwError("facility_id is required", 400);
  }

  const normalizedScope = normalizeReportScope(report_scope);
  const normalizedType = normalizeGenerationReportType(report_type);

  if (normalizedScope === "utility_account" && !utility_account_id) {
    throwError(
      "utility_account_id is required when report_scope is utility_account",
      400,
    );
  }

  return {
    report_scope: normalizedScope,
    report_type: normalizedType,
  };
};

export const assertFacilityAuditTypeSupportsReports = (facility) => {
  if (!facility) return;

  const auditType = facility.audit_type;
  if (!FACILITY_AUDIT_TYPES_WITH_REPORT_SUPPORT.has(auditType)) {
    throwError(
      `Reports are only available for Electrical Energy Audit and Electrical Safety Audit facilities. This facility's audit program is "${auditType || "unknown"}".`,
      400,
    );
  }
};

export const assertReportTypeMatchesFacilityAuditProgram = (
  facility,
  reportType,
) => {
  if (!facility) return;

  assertFacilityAuditTypeSupportsReports(facility);

  if (facility.audit_type === ELECTRICAL_SAFETY_AUDIT) {
    if (!SAFETY_ALLOWED_REPORT_TYPES.has(reportType)) {
      const allowed = ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES.join(", ");
      throwError(
        `For Electrical Safety Audit facilities only these report types are supported: ${allowed}.`,
        400,
      );
    }
    return;
  }

  if (facility.audit_type === ELECTRICAL_ENERGY_AUDIT) {
    if (SAFETY_ONLY_GRANULAR_TYPES.has(reportType)) {
      throwError(
        "This report type is only available for Electrical Safety Audit facilities.",
        400,
      );
    }
    if (!ELECTRICAL_ENERGY_REPORT_TYPES.includes(reportType)) {
      const allowed = ELECTRICAL_ENERGY_REPORT_TYPES.join(", ");
      throwError(
        `For Electrical Energy Audit facilities only these report types are supported: ${allowed}.`,
        400,
      );
    }
    return;
  }

  throwError(
    `Reports are only available for Electrical Energy Audit and Electrical Safety Audit facilities. This facility's audit program is "${facility.audit_type || "unknown"}".`,
    400,
  );
};
