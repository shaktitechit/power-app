import SafetyLdbAudit from "../../modals/safety-audit/safetyLdbAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } = createSafetyAuditCrudController(
  SafetyLdbAudit,
  {
    entityType: "safety_ldb_audit",
    entityLabel: "safety LDB audit",
  },
);

export { create, getAll, getById, update, remove };
