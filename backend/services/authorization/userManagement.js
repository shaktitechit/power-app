import { RESOURCES } from "../../constants/resources.js";
import { ACTIONS } from "../../constants/actions.js";

const ADMIN_MANAGEABLE_ROLES = ["manager", "auditor"];

export const ALL_MANAGEABLE_ROLES = [
  "super_admin",
  "admin",
  "manager",
  "auditor",
];

export const getRequesterRole = (req) => req.user?.role || "auditor";

export const getAllowedRolesForRequester = (requesterRole) => {
  if (requesterRole === "super_admin") {
    return ALL_MANAGEABLE_ROLES;
  }
  if (requesterRole === "admin") {
    return ADMIN_MANAGEABLE_ROLES;
  }
  return [];
};

export const sanitizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];
  const allowedResources = new Set(Object.values(RESOURCES));
  const allowedActions = new Set(Object.values(ACTIONS));

  return permissions
    .map((permission) => ({
      resource: String(permission?.resource || "").trim(),
      actions: Array.from(
        new Set(
          Array.isArray(permission?.actions)
            ? permission.actions
              .map((action) => String(action || "").trim())
              .filter((action) => allowedActions.has(action))
              .filter(Boolean)
            : [],
        ),
      ),
      scope: ["all", "assigned", "own", "none"].includes(permission?.scope)
        ? permission.scope
        : "none",
    }))
    .filter(
      (permission) =>
        permission.resource &&
        allowedResources.has(permission.resource) &&
        permission.actions.length > 0,
    );
};
