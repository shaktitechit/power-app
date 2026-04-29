/** Electrical safety checklist tabs — single source for workspace, labels, and no-data keys. */

import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";

/** Same final-submit step id as electrical energy (`preview-and-submit`). */
export const SAFETY_PREVIEW_AND_SUBMIT_STEP_ID =
  UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT;

export const ELECTRICAL_SAFETY_AUDIT_STEPS = [
  { id: "transformers", label: "Transformers" },
  { id: "metering-room", label: "Metering Room" },
  { id: "panel-room", label: "Panel Room" },
  { id: "light-db", label: "Light DB" },
  { id: "dg-set", label: "DG Set" },
  { id: "earthing-system", label: "Earthing System" },
  { id: "ups-battery", label: "UPS & Battery" },
  { id: "general-safety", label: "General Safety" },
  { id: "wiring-inspection", label: "Wiring Inspection" },
  { id: "load-analysis", label: "Load Analysis" },
  { id: "leak-inspection", label: "Leak Inspection" },
  { id: "thermography", label: "Thermography" },
  { id: "elevator-safety", label: "Elevator Safety" },
  { id: "pac-ventilation", label: "PAC & Ventilation" },
  { id: "pump-compressor", label: "Pump / Compressor" },
  { id: "additional-items", label: "Additional Items" },
  { id: "documents-review", label: "Documents Review" },
] as const;

export const ELECTRICAL_SAFETY_AUDIT_STEP_IDS = ELECTRICAL_SAFETY_AUDIT_STEPS.map(
  (s) => s.id,
);

export const SAFETY_NO_DATA_AUDIT_STEP_IDS = ELECTRICAL_SAFETY_AUDIT_STEPS.map(
  (s) => s.id,
) as readonly string[];

export const SAFETY_AUDIT_STEP_LABELS: Record<string, string> =
  ELECTRICAL_SAFETY_AUDIT_STEPS.reduce(
    (acc, s) => {
      acc[s.id] = s.label;
      return acc;
    },
    {} as Record<string, string>,
  );

export function getSafetyAuditWorkflowStepLabel(tabId: string): string {
  return SAFETY_AUDIT_STEP_LABELS[tabId] ?? tabId;
}
