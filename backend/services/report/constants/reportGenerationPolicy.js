/**
 * Report types accepted by POST `/reports/generate` and POST `/reports`.
 * Scope (`facility` vs `utility_account`) is orthogonal — both use this list.
 *
 * Regeneration and queued jobs may still reference historical `report_type`
 * values; those remain valid via {@link REPORT_TYPES} / program checks.
 */
export const GENERATION_ALLOWED_REPORT_TYPES = Object.freeze([
  "full_audit_report",
]);
