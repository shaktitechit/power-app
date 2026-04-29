import SafetyPacVentilationAudit from "../../modals/safety-audit/safetyPacVentilationAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyPacVentilationAudit, {
    entityType: "safety_pac_ventilation_audit",
    entityLabel: "safety PAC / ventilation audit",
    getDisplayName: (record) =>
      (record?.unit_name && String(record.unit_name).trim()) ||
      "PAC / ventilation audit",
  });

export { create, getAll, getById, update, remove };
