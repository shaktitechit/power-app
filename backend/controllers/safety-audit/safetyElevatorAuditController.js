import SafetyElevatorAudit from "../../modals/safety-audit/safetyElevatorAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyElevatorAudit, {
    entityType: "safety_elevator_audit",
    entityLabel: "safety elevator audit",
    getDisplayName: (record) =>
      (record?.elevator_name &&
        String(record.elevator_name).trim()) ||
      "Elevator safety audit",
  });

export { create, getAll, getById, update, remove };
