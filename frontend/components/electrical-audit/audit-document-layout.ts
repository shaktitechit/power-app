/**
 * Tailwind bundles for document / file-name rows inside Cards and bordered panels.
 * Flex children default to min-content width — long filenames need `min-w-0`, wrapping,
 * or truncation so rows stay inside the viewport.
 */

/** Bordered “Documents” block (section wrapper inside Card). */
export const AUDIT_DOCUMENTS_PANEL_CLASS =
  "min-w-0 overflow-x-hidden rounded-xl border p-4";

/** Row listing an existing uploaded file link + optional trailing actions (dense UI). */
export const AUDIT_DOC_ROW_DENSE =
  "flex min-w-0 flex-col gap-3 rounded-md border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between";

/** Row listing files with comfortable padding (p-3) — matches many audit sections. */
export const AUDIT_DOC_ROW_COMFORTABLE =
  "flex min-w-0 flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between";

/** Same as comfortable plus card-style border background (AC/fan/misc patterns). */
export const AUDIT_DOC_ROW_CARD =
  "flex min-w-0 flex-col gap-3 rounded-lg border border-border bg-card p-3 text-sm sm:flex-row sm:items-center sm:justify-between";

/** Left cluster: icon(s) + link or text — grows/shrinks without forcing overflow. */
export const AUDIT_DOC_ROW_LEFT_CLUSTER =
  "flex min-w-0 flex-1 items-center gap-2 sm:gap-3";

/** Primary link styling for downloadable document names (server-backed files). */
export const AUDIT_DOC_LINK_PRIMARY =
  "block min-w-0 max-w-full flex-1 text-primary underline-offset-2 hover:underline max-sm:break-words max-sm:[overflow-wrap:anywhere] sm:truncate";

/** Inline link (non-block) inside flex rows — table-style cells. */
export const AUDIT_DOC_LINK_INLINE =
  "min-w-0 flex-1 text-primary hover:underline max-sm:break-words max-sm:[overflow-wrap:anywhere] sm:truncate";

/** New/uncommitted file names (no href). */
export const AUDIT_DOC_NEW_FILENAME_SPAN =
  "min-w-0 flex-1 break-words text-sm leading-snug text-foreground [overflow-wrap:anywhere]";

/** Clickable anchor styled as a row (connection tables / inline doc links). */
export const AUDIT_DOC_ANCHOR_ROW =
  "flex min-w-0 flex-col gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/50 sm:flex-row sm:items-center sm:gap-2";

/** Remove / secondary buttons at end of responsive rows. */
export const AUDIT_DOC_ROW_ACTION_BTN =
  "w-full shrink-0 sm:w-auto";
