/** Matches backend `facility.audit_type` enum. */
export const ELECTRICAL_SAFETY_AUDIT = "Electrical Safety Audit" as const;

export const AUDIT_TYPE_OPTIONS = [
  "Electrical Energy Audit",
  ELECTRICAL_SAFETY_AUDIT,
  "Thermal Audit",
  "Lightning Arrester Audit",
] as const;

export type AuditTypeOption = (typeof AUDIT_TYPE_OPTIONS)[number];
