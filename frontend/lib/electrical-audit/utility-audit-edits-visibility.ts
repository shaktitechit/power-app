import { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";

/**
 * Use on wrappers around edit toolbars (not read-only data) when the step or
 * facility audit is closed — replaces blur overlays with `hidden` edit chrome.
 */
export function cnHideUtilityAuditEdits(
  locked: boolean | undefined,
  ...rest: ClassValue[]
) {
  return cn(...rest, locked && "hidden");
}
