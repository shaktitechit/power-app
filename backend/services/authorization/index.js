import Facility from "../../modals/facility.js";
import FacilityAuditor from "../../modals/facilityAuditor.js";
import UtilityAccount from "../../modals/utilityAccount.js";
import { RESOURCES } from "../../constants/resources.js";
import { ACTIONS } from "../../constants/actions.js";
import { rolePolicies } from "../../policies/rolePolicies.js";

const ACTION_ALIASES = {
  [ACTIONS.EDIT]: ACTIONS.UPDATE,
  [ACTIONS.VIEW_REPORT]: ACTIONS.READ,
  [ACTIONS.GENERATE_REPORT]: ACTIONS.CREATE,
  [ACTIONS.VIEW_DOCUMENT]: ACTIONS.READ,
};

const toIdString = (value) => {
  if (value == null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && typeof value.toString === "function") {
    return value.toString();
  }
  return String(value);
};

export function getEffectivePolicies(user) {
  if (!user) return [];
  const role = user.role || "auditor";
  const fromRole = rolePolicies[role] || rolePolicies.auditor || [];
  const custom = Array.isArray(user.permissions) ? user.permissions : [];
  return [...fromRole, ...custom];
}

export function findMatchingPolicies(policies, resource, action) {
  const actionCandidates = [action, ACTION_ALIASES[action]].filter(Boolean);
  return policies.filter((policy) => {
    const resourceMatch =
      policy.resource === "*" || policy.resource === resource;
    const actionMatch =
      policy.actions?.includes("*") ||
      actionCandidates.some((candidate) => policy.actions?.includes(candidate));
    return resourceMatch && actionMatch;
  });
}

/**
 * Legacy platform administrators (full power over sensitive operations).
 * Matches previous `role === "admin"`, plus `super_admin`.
 */
export function isAdmin(user) {
  const role = user?.role;
  return role === "admin" || role === "super_admin";
}

function hasWildcardAll(user) {
  const policies = getEffectivePolicies(user);
  return policies.some(
    (p) => p.resource === "*" && p.actions?.includes("*") && p.scope === "all",
  );
}

export function hasPolicyScopeAll(user, resource, action) {
  if (!user) return false;
  if (hasWildcardAll(user)) return true;
  const matches = findMatchingPolicies(
    getEffectivePolicies(user),
    resource,
    action,
  );
  return matches.some((m) => m.scope === "all");
}

/** List / resolve all facilities (admin, super_admin, or org-wide facility read). */
export function hasOrgWideFacilityAccess(user) {
  return (
    isAdmin(user) ||
    hasPolicyScopeAll(user, RESOURCES.FACILITY, ACTIONS.READ)
  );
}

/** List all utility accounts across facilities. */
export function hasOrgWideUtilityAccountRead(user) {
  return (
    isAdmin(user) ||
    hasPolicyScopeAll(user, RESOURCES.UTILITY_ACCOUNT, ACTIONS.READ)
  );
}

/** Unscoped report listing (all reports). */
export function hasOrgWideReportListAccess(user) {
  return (
    isAdmin(user) || hasPolicyScopeAll(user, RESOURCES.REPORT, ACTIONS.READ)
  );
}

export async function isUserAssignedOrOwnerOfFacility(user, facilityId) {
  if (!user?._id || !facilityId) return false;
  const facility = await Facility.findById(facilityId).select("owner_user_id");
  if (!facility) return false;
  if (facility.owner_user_id?.toString() === user._id.toString()) return true;
  return FacilityAuditor.exists({
    facility_id: facilityId,
    user_id: user._id,
  });
}

async function scopeSatisfied(user, scope, context = {}) {
  if (scope === "all") return true;
  if (scope === "none") return false;

  if (scope === "own") {
    const facilityId = context.facilityId;
    if (facilityId) {
      const facility = await Facility.findById(facilityId).select(
        "owner_user_id",
      );
      return (
        facility &&
        facility.owner_user_id?.toString() === user._id.toString()
      );
    }
    const targetUserId = context.targetUserId;
    if (targetUserId != null) {
      return toIdString(targetUserId) === toIdString(user._id);
    }
    const ownerUserId = context.ownerUserId;
    if (ownerUserId != null) {
      return toIdString(ownerUserId) === toIdString(user._id);
    }
    return false;
  }

  if (scope === "assigned") {
    const facilityId = context.facilityId;
    if (!facilityId) return false;
    return isUserAssignedOrOwnerOfFacility(user, facilityId);
  }

  return false;
}

/**
 * Full policy check: resource + action + scope in context (facility ownership / assignment).
 */
export async function can(user, resource, action, context = {}) {
  if (!user?._id) return false;
  const policies = getEffectivePolicies(user);
  const matches = findMatchingPolicies(policies, resource, action);
  if (!matches.length) return false;

  for (const policy of matches) {
    if (await scopeSatisfied(user, policy.scope, context)) return true;
  }
  return false;
}

/**
 * Resolve a facility the user may access (matches previous controller helpers).
 */
export async function resolveAccessibleFacility(user, facilityId) {
  if (!user?._id || !facilityId) return null;

  if (hasOrgWideFacilityAccess(user)) {
    return Facility.findById(facilityId);
  }

  const owned = await Facility.findOne({
    _id: facilityId,
    owner_user_id: user._id,
  });
  if (owned) return owned;

  const assigned = await FacilityAuditor.exists({
    facility_id: facilityId,
    user_id: user._id,
  });
  if (assigned) return Facility.findById(facilityId);

  return null;
}

/**
 * Resolve a utility account the user may access (admin / org-wide / assigned / owner).
 */
export async function resolveAccessibleUtilityAccount(user, utilityAccountId) {
  const utilityAccount = await UtilityAccount.findById(utilityAccountId);
  if (!utilityAccount) return null;

  if (isAdmin(user) || hasOrgWideUtilityAccountRead(user)) {
    return utilityAccount;
  }

  const facility = await Facility.findById(utilityAccount.facility_id);
  if (!facility) return null;

  const ok = await isUserAssignedOrOwnerOfFacility(
    user,
    utilityAccount.facility_id,
  );
  if (ok) return utilityAccount;

  return null;
}
