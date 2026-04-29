import SafetyLeakInspectionAudit from "../../modals/safety-audit/safetyLeakInspectionAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyLeakInspectionAudit, {
    entityType: "safety_leak_inspection_audit",
    entityLabel: "safety leak inspection audit",
    getDisplayName: (record) =>
      (record?.equipment_name &&
        String(record.equipment_name).trim()) ||
      "Leak inspection audit",
  });

export { create, getAll, getById, update, remove };
