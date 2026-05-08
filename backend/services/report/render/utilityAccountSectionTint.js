/**
 * Alternating row/header fills per utility-account prefix (text before ` - ` in subsection headings).
 * Only two tones — lighter / darker — so multi-account exports stay readable and consistent.
 * Shared by Excel + PDF.
 */

/** Softer band — odd numbered utility-account slots (0, 2, 4…) in discovery order */
export const UTILITY_ACCOUNT_TINT_LIGHT_HEX = "#EFF6FC";

/** Slightly deeper band — even numbered slots (1, 3, …); same hue family as light */
export const UTILITY_ACCOUNT_TINT_DARK_HEX = "#D0E4F7";

/** @type {readonly string[]} — `#RRGGBB`; length 2, alternating by account slot */
export const UTILITY_ACCOUNT_SECTION_TINTS_HEX = Object.freeze([
  UTILITY_ACCOUNT_TINT_LIGHT_HEX,
  UTILITY_ACCOUNT_TINT_DARK_HEX,
]);

const TINT_SLOT_COUNT = UTILITY_ACCOUNT_SECTION_TINTS_HEX.length;

const hashAccountKey = (key) => {
  let h = 2166136261;
  const s = String(key);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/**
 * Parses `{account or label} - {rest}` (ASCII hyphen, spaces).
 * @param {string} text
 * @returns {string}
 */
export const getAccountPrefixFromHeading = (text) => {
  const heading = String(text || "").trim();
  const match = heading.match(/^(.+?)\s-\s(.+)$/);
  if (!match) return "";
  return String(match[1] || "").trim();
};

/**
 * @param {string} accountPrefix — usually from {@link getAccountPrefixFromHeading}
 * @returns {{ hex: string, argb: string } | null}
 */
export const getUtilityAccountSectionTint = (accountPrefix) => {
  const prefix = String(accountPrefix || "").trim();
  if (!prefix) return null;

  const idx = hashAccountKey(prefix) % TINT_SLOT_COUNT;
  const hex = UTILITY_ACCOUNT_SECTION_TINTS_HEX[idx];
  return { hex, argb: `FF${hex.slice(1)}` };
};

/**
 * @param {string} heading — full subsection heading
 * @returns {{ hex: string, argb: string } | null}
 */
export const getUtilityAccountSectionTintFromHeading = (heading) => {
  return getUtilityAccountSectionTint(getAccountPrefixFromHeading(heading));
};

/**
 * Assigns alternating slots (0, 1, 2…) to each unique account prefix in export order:
 * first account → lighter/darker flip via slot % 2, same prefix always maps to same slot.
 */
export const createUtilityAccountTintResolver = () => {
  const prefixToSlot = new Map();
  let distinctCount = 0;

  const tintAtSlot = (slot) => {
    const hex =
      UTILITY_ACCOUNT_SECTION_TINTS_HEX[slot % TINT_SLOT_COUNT];
    return { hex, argb: `FF${hex.slice(1)}` };
  };

  return {
    /** @param {string} heading */
    fromHeading(heading) {
      const prefix = getAccountPrefixFromHeading(heading);
      if (!prefix) return null;
      if (!prefixToSlot.has(prefix)) {
        prefixToSlot.set(prefix, distinctCount);
        distinctCount += 1;
      }
      return tintAtSlot(prefixToSlot.get(prefix));
    },
  };
};
