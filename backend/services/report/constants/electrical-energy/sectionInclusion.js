/**
 * Which dataset sections are built for Electrical Energy Audit reports.
 * All `report_type` values except `executive_summary` use the full list (same sheets as
 * `full_audit_report`) so thematic types (e.g. solar_report) still ship the complete workbook.
 */

/** @type {readonly string[]} */
export const ELECTRICAL_ENERGY_FULL_REPORT_SECTIONS = Object.freeze([
  "cover",
  "facility_info",
  "utility_accounts",
  "tariffs",
  "billing_records",
  "solar_systems",
  "dg_sets",
  "transformers",
  "pumps",
  "hvac_records",
  "ac_records",
  "fan_records",
  "lighting_records",
  "lux_records",
  "misc_records",
  "recommendations",
  "summary",
]);

/** @type {readonly string[]} */
export const ELECTRICAL_ENERGY_EXECUTIVE_SUMMARY_SECTIONS = Object.freeze([
  "cover",
  "facility_info",
  "utility_accounts",
  "tariffs",
  "billing_records",
  "recommendations",
  "summary",
]);

/**
 * @param {string} reportType
 * @param {string} sectionKey
 */
export const shouldIncludeElectricalEnergyReportSection = (
  reportType,
  sectionKey,
) => {
  if (reportType === "executive_summary") {
    return ELECTRICAL_ENERGY_EXECUTIVE_SUMMARY_SECTIONS.includes(sectionKey);
  }
  return ELECTRICAL_ENERGY_FULL_REPORT_SECTIONS.includes(sectionKey);
};
