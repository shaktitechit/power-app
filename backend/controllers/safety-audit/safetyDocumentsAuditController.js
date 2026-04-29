import SafetyDocumentsAudit from "../../modals/safety-audit/safetyDocumentsAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyDocumentsAudit, {
    entityType: "safety_documents_audit",
    entityLabel: "safety documents audit",
    getDisplayName: (record) => {
      const tag =
        record?.equipment_name && String(record.equipment_name).trim();
      if (tag) return tag;
      const loc = record?.location && String(record.location).trim();
      if (loc) return loc;
      const raw = record?.audit_date;
      if (!raw) return "Documents review audit";
      const d = raw instanceof Date ? raw : new Date(raw);
      if (Number.isNaN(d.getTime())) return "Documents review audit";
      return d.toLocaleDateString(undefined, { dateStyle: "medium" });
    },
  });

export { create, getAll, getById, update, remove };
