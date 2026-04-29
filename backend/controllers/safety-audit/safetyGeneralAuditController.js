import SafetyGeneralAudit from "../../modals/safety-audit/safetyGeneralAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyGeneralAudit, {
    entityType: "safety_general_audit",
    entityLabel: "safety general audit",
  });

export { create, getAll, getById, update, remove };
