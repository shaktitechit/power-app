export const FINAL_UTILITY_AUDIT_STEP = "preview-and-submit";
export const LEGACY_FINAL_UTILITY_AUDIT_STEP = "preview_and_submit";

export const hasValidDate = (value) => {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
};

export const isFacilityAuditClosed = (facility) =>
  // IMPORTANT: `closure_date` on Facility is a planned/business closure date,
  // not the audit lock state. Audit lock must only follow `audit_closure.closed_at`.
  hasValidDate(facility?.audit_closure?.closed_at);

export const isUtilityAuditCompleted = (utility) =>
  hasValidDate(
    utility?.audit_step_submissions?.[FINAL_UTILITY_AUDIT_STEP]?.submitted_at,
  ) ||
  hasValidDate(
    utility?.audit_step_submissions?.[LEGACY_FINAL_UTILITY_AUDIT_STEP]
      ?.submitted_at,
  );
