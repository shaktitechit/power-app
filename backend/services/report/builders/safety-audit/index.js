/**
 * Electrical Safety Audit — facility / utility-account dataset builders and checklist sections.
 * Registry: `./reportModelRegistry.js`. Internal orchestration: `./assembleReportPayload.js`.
 * Shared cover / facility snapshot / utility list live in `../shared/`.
 */
export { buildFacilityReportData } from "./buildFacilityReportData.js";
export { buildUtilityAccountReportData } from "./buildUtilityAccountReportData.js";
export {
  SAFETY_GRANULAR_REPORT_TYPES,
  SAFETY_REPORT_MODEL_SPECS,
  SAFETY_SECTION_REPORT_TYPE_SUFFIX,
  safetyReportTypeToSpecKey,
} from "./reportModelRegistry.js";
