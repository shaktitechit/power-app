/**
 * Safety audit Mongoose models + report section metadata.
 * Order defines Excel/PDF section sequence. Keep aligned with `backend/modals/safety-audit`.
 */
import {
  SafetyAdditionalItemsAudit,
  SafetyDgAudit,
  SafetyDocumentsAudit,
  SafetyEarthingAudit,
  SafetyElevatorAudit,
  SafetyGeneralAudit,
  SafetyLeakInspectionAudit,
  SafetyLdbAudit,
  SafetyLoadAnalysisAudit,
  SafetyMeteringRoomAudit,
  SafetyPacVentilationAudit,
  SafetyPanelRoomAudit,
  SafetyPumpCompressorAudit,
  SafetyThermographyAudit,
  SafetyTransformerAudit,
  SafetyUpsAudit,
  SafetyWiringAudit,
} from "../../../../modals/safety-audit/index.js";

/** @typedef {{ key: string; title: string; Model: import("mongoose").Model }} SafetyReportModelSpec */

/** @type {SafetyReportModelSpec[]} */
export const SAFETY_REPORT_MODEL_SPECS = [
  { key: "safety_general", title: "General Safety", Model: SafetyGeneralAudit },
  {
    key: "safety_documents",
    title: "Documents Review",
    Model: SafetyDocumentsAudit,
  },
  { key: "safety_earthing", title: "Earthing", Model: SafetyEarthingAudit },
  {
    key: "safety_panel_room",
    title: "Panel Room",
    Model: SafetyPanelRoomAudit,
  },
  {
    key: "safety_metering_room",
    title: "Metering Room",
    Model: SafetyMeteringRoomAudit,
  },
  { key: "safety_ldb", title: "LDB", Model: SafetyLdbAudit },
  {
    key: "safety_transformer",
    title: "Transformer Safety",
    Model: SafetyTransformerAudit,
  },
  { key: "safety_dg", title: "DG Safety", Model: SafetyDgAudit },
  { key: "safety_ups", title: "UPS", Model: SafetyUpsAudit },
  { key: "safety_wiring", title: "Wiring", Model: SafetyWiringAudit },
  {
    key: "safety_load_analysis",
    title: "Load Analysis",
    Model: SafetyLoadAnalysisAudit,
  },
  {
    key: "safety_leak_inspection",
    title: "Leak Inspection",
    Model: SafetyLeakInspectionAudit,
  },
  {
    key: "safety_thermography",
    title: "Thermography",
    Model: SafetyThermographyAudit,
  },
  {
    key: "safety_pump_compressor",
    title: "Pump / Compressor",
    Model: SafetyPumpCompressorAudit,
  },
  { key: "safety_elevator", title: "Elevator", Model: SafetyElevatorAudit },
  {
    key: "safety_pac_ventilation",
    title: "PAC / Ventilation",
    Model: SafetyPacVentilationAudit,
  },
  {
    key: "safety_additional_items",
    title: "Additional Items",
    Model: SafetyAdditionalItemsAudit,
  },
];

/** Suffix for per-section report types (e.g. `safety_general` → `safety_general_report`). */
export const SAFETY_SECTION_REPORT_TYPE_SUFFIX = "_report";

/** @type {readonly string[]} */
export const SAFETY_GRANULAR_REPORT_TYPES = Object.freeze(
  SAFETY_REPORT_MODEL_SPECS.map(
    (s) => `${s.key}${SAFETY_SECTION_REPORT_TYPE_SUFFIX}`,
  ),
);

/**
 * @param {string} reportType
 * @returns {string | null} registry `key` when `reportType` is a granular safety report
 */
export function safetyReportTypeToSpecKey(reportType) {
  if (typeof reportType !== "string") return null;
  if (!reportType.endsWith(SAFETY_SECTION_REPORT_TYPE_SUFFIX)) return null;
  const key = reportType.slice(0, -SAFETY_SECTION_REPORT_TYPE_SUFFIX.length);
  return SAFETY_REPORT_MODEL_SPECS.some((s) => s.key === key) ? key : null;
}
