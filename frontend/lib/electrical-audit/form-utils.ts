/**
 * Shared form utilities for electrical-audit components.
 * Centralises helpers that were previously copy-pasted across 14+ component files.
 */

/** Convert a Date / ISO string to an HTML date-input value (YYYY-MM-DD). */
export function toDateInput(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
}

/**
 * Safely coerce an unknown value to a string.
 * Returns "" for null / undefined.
 */
export const toStringValue = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);

/**
 * Parse a string to a number.
 * Returns `undefined` for empty / non-numeric strings (suitable for optional API fields).
 */
export function toNumber(value: string): number | undefined {
  if (!value || value.trim() === "") return undefined;
  const num = Number(value);
  return Number.isNaN(num) ? undefined : num;
}

/**
 * Parse a string to a number, defaulting to 0 for empty / NaN values.
 * Use when a fallback of 0 is semantically correct (e.g. calculated totals).
 */
export function toNumberOrZero(
  value: string | number | undefined | null,
): number {
  if (value === "" || value === undefined || value === null) return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** Round a number to a fixed number of decimal places, returned as a string. */
export function formatAuto(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "";
  return value.toFixed(decimals);
}

/**
 * CSS class string for **editable** audit form inputs.
 * Gives the standard border/bg/text colours with focus ring.
 */
export const editableInputClass =
  "border-input bg-background text-foreground focus:border-primary focus:ring-1 focus:ring-primary";

/**
 * CSS class string for **auto-computed** (read-only) audit form inputs.
 * Uses a dashed sky-blue border to visually distinguish computed fields.
 */
export const autoInputClass =
  "cursor-not-allowed border border-dashed border-sky-300 bg-sky-100 text-sky-900 opacity-100 dark:border-sky-700 dark:bg-sky-950/60 dark:text-sky-100";

/** Returns the correct input class based on whether the input is disabled. */
export const getInputClass = (disabled: boolean): string =>
  disabled ? autoInputClass : editableInputClass;
