import SafetyWiringAudit from "../../modals/safety-audit/safetyWiringAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } = createSafetyAuditCrudController(
  SafetyWiringAudit,
  {
    entityType: "safety_wiring_audit",
    entityLabel: "safety wiring audit",
  },
);

export { create, getAll, getById, update, remove };
