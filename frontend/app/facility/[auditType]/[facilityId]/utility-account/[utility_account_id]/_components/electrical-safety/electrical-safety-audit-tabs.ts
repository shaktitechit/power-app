/**
 * Re-exports workflow steps from lib (single source of truth).
 */
export {
  ELECTRICAL_SAFETY_AUDIT_STEPS,
  ELECTRICAL_SAFETY_AUDIT_STEP_IDS,
  getSafetyAuditWorkflowStepLabel as getElectricalSafetyAuditStepLabel,
} from "@/lib/electrical-audit/safety-audit-workflow";
