/**
 * Electrical Safety Audit report `report_type` values (mirror
 * `ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES` in
 * `backend/services/report/constants/safety-audit/program.js`.
 *
 * Granular types use `{specKey}_report` — keep keys aligned with
 * `backend/services/report/builders/safety-audit/reportModelRegistry.js`.
 *
 * `ElectricalSafetyGranularReportType` is defined in `reportApiSlice.ts`.
 */
import type {
  ElectricalSafetyGranularReportType,
  ReportType,
} from "@/store/slices/reportApiSlice";

/** Registry keys + titles (order matches backend `SAFETY_REPORT_MODEL_SPECS`). */
export const SAFETY_REPORT_MODEL_SPECS_UI = [
  { key: "safety_general", title: "General Safety" },
  { key: "safety_documents", title: "Documents Review" },
  { key: "safety_earthing", title: "Earthing" },
  { key: "safety_panel_room", title: "Panel Room" },
  { key: "safety_metering_room", title: "Metering Room" },
  { key: "safety_ldb", title: "LDB" },
  { key: "safety_transformer", title: "Transformer Safety" },
  { key: "safety_dg", title: "DG Safety" },
  { key: "safety_ups", title: "UPS" },
  { key: "safety_wiring", title: "Wiring" },
  { key: "safety_load_analysis", title: "Load Analysis" },
  { key: "safety_leak_inspection", title: "Leak Inspection" },
  { key: "safety_thermography", title: "Thermography" },
  { key: "safety_pump_compressor", title: "Pump / Compressor" },
  { key: "safety_elevator", title: "Elevator" },
  { key: "safety_pac_ventilation", title: "PAC / Ventilation" },
  { key: "safety_additional_items", title: "Additional Items" },
] as const;

export const ELECTRICAL_SAFETY_GRANULAR_REPORT_TYPES = SAFETY_REPORT_MODEL_SPECS_UI.map(
  (s) => `${s.key}_report`,
) as ElectricalSafetyGranularReportType[];

export const ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES = [
  "full_audit_report",
  "executive_summary",
  ...ELECTRICAL_SAFETY_GRANULAR_REPORT_TYPES,
] as const satisfies readonly ReportType[];

export type ElectricalSafetyAuditReportType =
  (typeof ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES)[number];

const granularLabels: Record<ElectricalSafetyGranularReportType, string> =
  Object.fromEntries(
    SAFETY_REPORT_MODEL_SPECS_UI.map((s) => [
      `${s.key}_report` as ElectricalSafetyGranularReportType,
      `${s.title} — Report`,
    ]),
  ) as Record<ElectricalSafetyGranularReportType, string>;

export const ELECTRICAL_SAFETY_GRANULAR_REPORT_TYPE_LABELS = granularLabels;

export const ELECTRICAL_SAFETY_AUDIT_REPORT_OPTIONS: {
  label: string;
  value: ElectricalSafetyAuditReportType;
}[] = [
  {
    label: "Full Electrical Safety Audit Report",
    value: "full_audit_report",
  },
  {
    label: "Electrical Safety Executive Summary (all areas + overview)",
    value: "executive_summary",
  },
  ...SAFETY_REPORT_MODEL_SPECS_UI.map((s) => ({
    label: `${s.title} — Report`,
    value: `${s.key}_report` as ElectricalSafetyGranularReportType,
  })),
];

export const ELECTRICAL_SAFETY_AUDIT_REPORT_TYPE_LABELS: Record<
  ElectricalSafetyAuditReportType,
  string
> = {
  full_audit_report: "Full Electrical Safety Audit Report",
  executive_summary:
    "Electrical Safety Executive Summary (all areas + overview)",
  ...granularLabels,
};

export function isElectricalSafetyAuditReportType(
  value: ReportType,
): value is ElectricalSafetyAuditReportType {
  return (ELECTRICAL_SAFETY_AUDIT_REPORT_TYPES as readonly string[]).includes(
    value,
  );
}
