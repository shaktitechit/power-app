import SafetyPanelRoomAudit from "../../modals/safety-audit/safetyPanelRoomAudit.js";
import { createSafetyAuditCrudController } from "./safetyAuditCrud.js";

const { create, getAll, getById, update, remove } =
  createSafetyAuditCrudController(SafetyPanelRoomAudit, {
    entityType: "safety_panel_room_audit",
    entityLabel: "safety panel room audit",
  });

export { create, getAll, getById, update, remove };
