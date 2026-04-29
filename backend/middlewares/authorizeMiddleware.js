import { can } from "../services/authorization/index.js";

/**
 * Policy gate after `protect`. Optionally resolves { facilityId, targetUserId, ... } for scope checks.
 *
 * @param {string} resource - RESOURCES.*
 * @param {string} action - ACTIONS.*
 * @param {{ resolveContext?: (req) => Promise<object>|object }} [options]
 */
export const authorize = (resource, action, options = {}) => {
  const { resolveContext } = options;

  return async (req, res, next) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const context =
      typeof resolveContext === "function"
        ? await resolveContext(req)
        : {};

    const allowed = await can(user, resource, action, context);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    req.authz = { resource, action, context };
    next();
  };
};
