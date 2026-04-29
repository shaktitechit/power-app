/**
 * Pastel row/header tints per utility-account prefix (text before ` - ` in subsection headings).
 * Shared by Excel + PDF so colors match across exports.
 */

/** @type {readonly string[]} #RRGGBB — light fills, readable with dark text */
export const UTILITY_ACCOUNT_SECTION_TINTS_HEX = Object.freeze([
  "#F3E5F5",
  "#E3F2FD",
  "#E8F5E9",
  "#FFF3E0",
  "#E0F2F1",
  "#FCE4EC",
  "#EDE7F6",
  "#E8EAF6",
  "#E1F5FE",
  "#F1F8E9",
  "#FFF8E1",
  "#FFEBEE",
  "#E8F5E8",
  "#F9FBE7",
  "#E0F7FA",
  "#F3E0F7",
  "#FFF0F0",
  "#EFEEFF",
  "#E3F9E5",
  "#FFE0B2",
  "#C5E1A5",
  "#B3E5FC",
  "#D1C4E9",
  "#FFCDD2",
  "#DCEDC8",
  "#B2EBF2",
  "#C8E6C9",
  "#BBDEFB",
  "#D7CCC8",
  "#FFECB3",
  "#E1BEE7",
  "#B2DFDB",
  "#F0F4C3",
  "#FFCCBC",
  "#CFD8DC",
  "#D4E157",
  "#A5D6A7",
  "#90CAF9",
  "#CE93D8",
  "#80DEEA",
  "#FFE082",
  "#A1887F",
  "#9FA8DA",
]);

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

  const idx = hashAccountKey(prefix) % UTILITY_ACCOUNT_SECTION_TINTS_HEX.length;
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
 * Assigns distinct palette slots to each unique account prefix in export order
 * (first account → color 0, second → color 1, …). Reuses the same color when the
 * same prefix appears again. Wraps if there are more distinct accounts than palette entries.
 */
export const createUtilityAccountTintResolver = () => {
  const prefixToSlot = new Map();
  let distinctCount = 0;

  const tintAtSlot = (slot) => {
    const idx = slot % UTILITY_ACCOUNT_SECTION_TINTS_HEX.length;
    const hex = UTILITY_ACCOUNT_SECTION_TINTS_HEX[idx];
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
