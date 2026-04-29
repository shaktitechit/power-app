import SafetyEarthingAudit from "../../modals/safety-audit/safetyEarthingAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyEarthingAudit, {
    entityType: "safety_earthing_audit",
    entityLabel: "safety earthing audit",
  });

export { create, getAll, getById, update, remove };
