import SafetyUpsAudit from "../../modals/safety-audit/safetyUpsAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } = createSafetyAuditCrudController(
  SafetyUpsAudit,
  {
    entityType: "safety_ups_audit",
    entityLabel: "safety UPS audit",
  },
);

export { create, getAll, getById, update, remove };
