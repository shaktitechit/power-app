import SafetyDgAudit from "../../modals/safety-audit/safetyDgAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } = createSafetyAuditCrudController(
  SafetyDgAudit,
  {
    entityType: "safety_dg_audit",
    entityLabel: "safety DG audit",
    extraQueryKeys: ["dg_set_id"],
  },
);

export { create, getAll, getById, update, remove };
