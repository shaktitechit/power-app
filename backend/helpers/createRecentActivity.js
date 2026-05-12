import RecentActivity from "../modals/recentActivity.js";
import { VALID_MODES } from "../constants/modes.js";
import { getModeFromContext } from "../lib/requestContext.js";

/**
 * Resolves the active mode for an activity record.
 *
 * Priority:
 *  1. Explicit `mode` argument passed by the caller
 *  2. `mode` httpOnly cookie from the current request (via AsyncLocalStorage)
 *  3. null (unknown / not set)
 *
 * @param {string|null|undefined} explicitMode
 * @returns {"onsite"|"offsite"|null}
 */
function resolveMode(explicitMode) {
  if (explicitMode && VALID_MODES.includes(explicitMode)) return explicitMode;
  const cookieMode = getModeFromContext();
  if (cookieMode && VALID_MODES.includes(cookieMode)) return cookieMode;
  return null;
}

/**
 * Creates a RecentActivity record.
 * The active mode is automatically read from the request cookie via
 * AsyncLocalStorage — no need to pass `req`.
 *
 * @param {object}       opts
 * @param {object|null}  opts.actor
 * @param {string}       opts.action
 * @param {string}       opts.entity_type
 * @param {*}            opts.entity_id
 * @param {string}       [opts.entity_name]
 * @param {*}            [opts.facility_id]
 * @param {*}            [opts.utility_account_id]
 * @param {string}       opts.message
 * @param {object}       [opts.meta]
 * @param {boolean}      [opts.created_by_system]
 * @param {string|null}  [opts.mode]  - "onsite" | "offsite" | null (explicit override)
 */
export const createRecentActivity = async ({
  actor = null,
  action,
  entity_type,
  entity_id,
  entity_name = "",
  facility_id = null,
  utility_account_id = null,
  message,
  meta = {},
  created_by_system = false,
  mode = undefined,
}) => {
  try {
    if (!action || !entity_type || !entity_id || !message) return null;

    return await RecentActivity.create({
      actor_id: actor?._id || actor?.id || null,
      actor_name: actor?.name || "",
      actor_role: actor?.role || "",
      action,
      entity_type,
      entity_id,
      entity_name,
      facility_id,
      utility_account_id,
      message,
      meta,
      created_by_system,
      mode: resolveMode(mode),
    });
  } catch (error) {
    console.error("Failed to create recent activity:", error.message);
    return null;
  }
};
