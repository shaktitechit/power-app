import SafetyThermographyAudit from "../../modals/safety-audit/safetyThermographyAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyThermographyAudit, {
    entityType: "safety_thermography_audit",
    entityLabel: "safety thermography audit",
    getDisplayName: (record) =>
      (record?.location && String(record.location).trim()) ||
      (record?.inspected_by && String(record.inspected_by).trim()) ||
      "Thermography audit",
  });

export { create, getAll, getById, update, remove };
