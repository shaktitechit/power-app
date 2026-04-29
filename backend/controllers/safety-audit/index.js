/**
 * Electrical safety audit API controllers. Each module exposes
 * `create`, `getAll`, `getById`, `update`, `remove` for one Mongoose model.
 * Route modules import individual files; this barrel is for discovery and tooling.
 */
export {
  createSafetyAuditCrudController,
  normalizePayload,
  defaultDisplayName,
} from "./safetyAuditCrud.js";

export * as safetyAdditionalItemsAudit from "./safetyAdditionalItemsAuditController.js";
export * as safetyDgAudit from "./safetyDgAuditController.js";
export * as safetyDocumentsAudit from "./safetyDocumentsAuditController.js";
export * as safetyEarthingAudit from "./safetyEarthingAuditController.js";
export * as safetyElevatorAudit from "./safetyElevatorAuditController.js";
export * as safetyGeneralAudit from "./safetyGeneralAuditController.js";
export * as safetyLdbAudit from "./safetyLdbAuditController.js";
export * as safetyLeakInspectionAudit from "./safetyLeakInspectionAuditController.js";
export * as safetyLoadAnalysisAudit from "./safetyLoadAnalysisAuditController.js";
export * as safetyMeteringRoomAudit from "./safetyMeteringRoomAuditController.js";
export * as safetyPacVentilationAudit from "./safetyPacVentilationAuditController.js";
export * as safetyPanelRoomAudit from "./safetyPanelRoomAuditController.js";
export * as safetyPumpCompressorAudit from "./safetyPumpCompressorAuditController.js";
export * as safetyThermographyAudit from "./safetyThermographyAuditController.js";
export * as safetyTransformerAudit from "./safetyTransformerAuditController.js";
export * as safetyUpsAudit from "./safetyUpsAuditController.js";
export * as safetyWiringAudit from "./safetyWiringAuditController.js";
