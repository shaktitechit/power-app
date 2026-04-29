/**
 * Electrical energy audit — section ordering and report-type reference.
 * Per–`report_type` inclusion: `../../constants/electrical-energy/sectionInclusion.js`.
 * Builder functions: `./sections/index.js`.
 */
import { ELECTRICAL_ENERGY_REPORT_TYPES } from "../../constants/electrical-energy/reportTypes.js";

export { ELECTRICAL_ENERGY_REPORT_TYPES };

/**
 * Ordered domain section keys used in facility-level full reports (after cover / facility / utilities).
 * Align with `buildFacilityReportData.js` when adding sections.
 */
export const ELECTRICAL_ENERGY_FACILITY_REPORT_SECTION_KEYS = Object.freeze([
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
