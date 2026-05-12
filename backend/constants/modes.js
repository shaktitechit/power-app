/**
 * Allowed operational modes for the application.
 * Used by modeController (cookie writing) and createRecentActivity (cookie reading).
 *
 * @type {readonly ["onsite", "offsite"]}
 */
export const VALID_MODES = /** @type {const} */ (["onsite", "offsite"]);

/**
 * @typedef {"onsite"|"offsite"} AppMode
 */
