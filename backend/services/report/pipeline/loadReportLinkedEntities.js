import Facility from "../../../modals/facility.js";
import UtilityAccount from "../../../modals/utilityAccount.js";

/**
 * Loads facility and optional utility account for a persisted report (worker / internal).
 */
export async function loadFacilityAndUtilityForReport(report) {
  const facility = await Facility.findById(report.facility_id);

  if (!facility) {
    throw new Error("Facility not found");
  }

  let utilityAccount = null;

  if (report.utility_account_id) {
    utilityAccount = await UtilityAccount.findById(report.utility_account_id);

    if (!utilityAccount) {
      throw new Error("Utility account not found");
    }

    if (String(utilityAccount.facility_id) !== String(facility._id)) {
      throw new Error("Utility account does not belong to facility");
    }
  }

  return { facility, utilityAccount };
}
