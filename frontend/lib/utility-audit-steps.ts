/** Tab / API keys for utility account audit workflow (matches backend ALLOWED_AUDIT_STEPS) */
export const UTILITY_AUDIT_STEP_IDS = {
  TARIFF: "tarrif",
  BILLING: "utility-billing-records",
  SOLAR: "solar-plants",
  DG: "dg-sets",
  TRANSFORMER: "transformer",
  PUMP: "pump",
  HVAC: "hvac",
  AC: "ac",
  LIGHTING: "lighting",
  FAN: "fan",
  LUX: "lux",
  MISC: "misc",
  PREVIEW_SUBMIT: "preview-and-submit",
} as const;

export type UtilityAuditStepId =
  (typeof UTILITY_AUDIT_STEP_IDS)[keyof typeof UTILITY_AUDIT_STEP_IDS];

/** Load-audit tabs that may be marked "no data" (matches backend NO_DATA_AUDIT_STEPS). */
export const AUDIT_NO_DATA_STEP_IDS = [
  UTILITY_AUDIT_STEP_IDS.HVAC,
  UTILITY_AUDIT_STEP_IDS.AC,
  UTILITY_AUDIT_STEP_IDS.LIGHTING,
  UTILITY_AUDIT_STEP_IDS.FAN,
  UTILITY_AUDIT_STEP_IDS.LUX,
  UTILITY_AUDIT_STEP_IDS.MISC,
] as const;

export type AuditNoDataStepId = (typeof AUDIT_NO_DATA_STEP_IDS)[number];

export function isAuditNoDataStepId(step: string): step is AuditNoDataStepId {
  return (AUDIT_NO_DATA_STEP_IDS as readonly string[]).includes(step);
}

export const UTILITY_AUDIT_STEP_LABELS: Record<string, string> = {
  [UTILITY_AUDIT_STEP_IDS.TARIFF]: "Utility tariff",
  [UTILITY_AUDIT_STEP_IDS.BILLING]: "Utility billing records",
  [UTILITY_AUDIT_STEP_IDS.SOLAR]: "Solar audit",
  [UTILITY_AUDIT_STEP_IDS.DG]: "DG audit",
  [UTILITY_AUDIT_STEP_IDS.TRANSFORMER]: "Transformer audit",
  [UTILITY_AUDIT_STEP_IDS.PUMP]: "Pump audit",
  [UTILITY_AUDIT_STEP_IDS.HVAC]: "HVAC audit",
  [UTILITY_AUDIT_STEP_IDS.AC]: "AC audit",
  [UTILITY_AUDIT_STEP_IDS.LIGHTING]: "Lighting audit",
  [UTILITY_AUDIT_STEP_IDS.FAN]: "Fan audit",
  [UTILITY_AUDIT_STEP_IDS.LUX]: "LUX measurement",
  [UTILITY_AUDIT_STEP_IDS.MISC]: "Misc audit",
  [UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT]: "Preview and submit",
};

export function getAuditSubmission(
  submissions: Record<string, { submitted_at?: string }> | undefined,
  step: string,
): { submitted_at?: string } | undefined {
  if (!submissions || typeof submissions !== "object") return undefined;
  const entry = submissions[step];
  if (!entry || typeof entry !== "object") return undefined;
  return entry as { submitted_at?: string };
}
