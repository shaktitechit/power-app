import SafetyMeteringRoomAudit from "../../modals/safety-audit/safetyMeteringRoomAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyMeteringRoomAudit, {
    entityType: "safety_metering_room_audit",
    entityLabel: "safety metering room audit",
    getDisplayName: () => "Metering room safety audit",
  });

export { create, getAll, getById, update, remove };
