import SafetyLoadAnalysisAudit from "../../modals/safety-audit/safetyLoadAnalysisAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyLoadAnalysisAudit, {
    entityType: "safety_load_analysis_audit",
    entityLabel: "safety load analysis audit",
    getDisplayName: () => "Load analysis safety audit",
  });

export { create, getAll, getById, update, remove };
