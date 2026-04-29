import SafetyTransformerAudit from "../../modals/safety-audit/safetyTransformerAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyTransformerAudit, {
    entityType: "safety_transformer_audit",
    entityLabel: "safety transformer audit",
    extraQueryKeys: ["transformer_id"],
  });

export { create, getAll, getById, update, remove };
