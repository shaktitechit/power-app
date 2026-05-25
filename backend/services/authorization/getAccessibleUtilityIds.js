import Facility from "../../modals/facility.js";
import FacilityAuditor from "../../modals/facilityAuditor.js";
import UtilityAccount from "../../modals/utilityAccount.js";
import { isAdmin } from "./index.js";

/**
 * Resolve all utility account IDs accessible to the given user.
 *
 * Returns `null` for admin/super_admin users (meaning "no filter — see all").
 * Returns an array of ObjectIds for non-admin users.
 *
 * Complexity: 3 DB calls regardless of dataset size, replacing the previous
 * N+1 loop that issued 2 DB calls per utility account in the entire database.
 *
 * Usage in controllers:
 *   const allowedIds = await getAccessibleUtilityAccountIds(req.user);
 *   if (allowedIds === null) {
 *     // admin — no filter
 *   } else {
 *     query.utility_account_id = { $in: allowedIds };
 *   }
 */
export async function getAccessibleUtilityAccountIds(user) {
  // Admins see everything — caller should apply no filter
  if (isAdmin(user)) return null;

  // Step 1: find facility IDs the user owns or is assigned to (2 parallel calls)
  const [ownedFacilities, assignedRows] = await Promise.all([
    Facility.find({ owner_user_id: user._id }).select("_id").lean(),
    FacilityAuditor.find({ user_id: user._id }).select("facility_id").lean(),
  ]);

  const facilityIds = [
    ...ownedFacilities.map((f) => f._id),
    ...assignedRows.map((r) => r.facility_id),
  ];

  if (facilityIds.length === 0) return []; // user has no facility access at all

  // Step 2: fetch utility accounts for those facilities
  const utilities = await UtilityAccount.find({
    facility_id: { $in: facilityIds },
  })
    .select("_id")
    .lean();

  return utilities.map((u) => u._id);
}
