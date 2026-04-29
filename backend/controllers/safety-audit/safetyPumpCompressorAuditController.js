import SafetyPumpCompressorAudit from "../../modals/safety-audit/safetyPumpCompressorAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyPumpCompressorAudit, {
    entityType: "safety_pump_compressor_audit",
    entityLabel: "safety pump / compressor audit",
    getDisplayName: (record) =>
      (record?.equipment_name && String(record.equipment_name).trim()) ||
      "Pump / compressor audit",
  });

export { create, getAll, getById, update, remove };
