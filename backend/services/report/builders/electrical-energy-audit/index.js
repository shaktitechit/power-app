/**
 * Electrical Energy Audit — facility / utility-account dataset builders and domain sections
 * (tariffs, billing, solar, DG, HVAC, etc.).
 * Registry: `./reportModelRegistry.js`. Orchestration: `./assembleReportPayload.js`.
 * Shared cover / facility / recommendations live in `../shared/`.
 */
export { buildFacilityReportData } from "./buildFacilityReportData.js";
export { buildUtilityAccountReportData } from "./buildUtilityAccountReportData.js";
export {
  ELECTRICAL_ENERGY_FACILITY_REPORT_SECTION_KEYS,
  ELECTRICAL_ENERGY_REPORT_TYPES,
} from "./reportModelRegistry.js";
