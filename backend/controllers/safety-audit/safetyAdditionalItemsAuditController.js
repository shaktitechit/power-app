import SafetyAdditionalItemsAudit from "../../modals/safety-audit/safetyAdditionalItemsAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyAdditionalItemsAudit, {
    entityType: "safety_additional_items_audit",
    entityLabel: "safety additional items audit",
    getDisplayName: (record) =>
      (record?.area_name && String(record.area_name).trim()) ||
      (record?.location && String(record.location).trim()) ||
      "Additional items audit",
  });

export { create, getAll, getById, update, remove };
