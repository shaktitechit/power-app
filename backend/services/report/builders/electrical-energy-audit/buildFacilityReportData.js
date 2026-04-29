import { assembleReportPayload } from "./assembleReportPayload.js";

/**
 * Electrical Energy Audit — facility-scoped report dataset.
 */
export const buildFacilityReportData = async ({ report, facility, meta }) =>
  assembleReportPayload({
    report,
    facility,
    utilityAccount: null,
    meta,
    scope: "facility",
  });

export default buildFacilityReportData;
