/**
 * Electrical Energy Audit `report_type` values — mirror
 * `ELECTRICAL_ENERGY_REPORT_TYPES` in
 * `backend/services/report/constants/electrical-energy/reportTypes.js`.
 */
import type { ReportType } from "@/store/slices/reportApiSlice";

export const ELECTRICAL_ENERGY_REPORT_TYPES = [
  "full_audit_report",
  "executive_summary",
  "solar_report",
  "dg_report",
  "transformer_report",
  "pump_report",
  "hvac_report",
  "lighting_report",
  "ac_report",
  "fan_report",
  "lux_report",
  "misc_report",
] as const satisfies readonly ReportType[];

export type ElectricalEnergyReportType =
  (typeof ELECTRICAL_ENERGY_REPORT_TYPES)[number];

export const ELECTRICAL_ENERGY_REPORT_OPTIONS: {
  label: string;
  value: ElectricalEnergyReportType;
}[] = [
  { label: "Full Audit Report", value: "full_audit_report" },
  { label: "Executive Summary", value: "executive_summary" },
  { label: "Solar Report", value: "solar_report" },
  { label: "DG Report", value: "dg_report" },
  { label: "Transformer Report", value: "transformer_report" },
  { label: "Pump Report", value: "pump_report" },
  { label: "HVAC Report", value: "hvac_report" },
  { label: "Lighting Report", value: "lighting_report" },
  { label: "AC Report", value: "ac_report" },
  { label: "Fan Report", value: "fan_report" },
  { label: "Lux Report", value: "lux_report" },
  { label: "Misc Report", value: "misc_report" },
];

export const ELECTRICAL_ENERGY_REPORT_TYPE_LABELS: Record<
  ElectricalEnergyReportType,
  string
> = Object.fromEntries(
  ELECTRICAL_ENERGY_REPORT_OPTIONS.map((o) => [o.value, o.label]),
) as Record<ElectricalEnergyReportType, string>;
