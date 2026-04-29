/**
 * Valid `report_type` values for Electrical Energy Audit facilities.
 * Excludes safety-only granular types (`safety_*_report`).
 * Combined with `SAFETY_GRANULAR_REPORT_TYPES` for the full API allow-list.
 */
export const ELECTRICAL_ENERGY_REPORT_TYPES = Object.freeze([
  "full_audit_report",
  "executive_summary",
  "solar_report",
  "dg_report",
  "transformer_report",
  "pump_report",
  "hvac_report",
  "ac_report",
  "fan_report",
  "lighting_report",
  "lux_report",
  "misc_report",
]);
