import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeLuxMeasurementsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let count_compliant_count = 0;
  let count_non_compliant_count = 0;
  
  let sum_avg_required_lux = 0;
  let count_avg_required_lux = 0;
  let sum_avg_measured_lux = 0;
  let count_avg_measured_lux = 0;
  let sum_lux_gap = 0; let count_lux_gap = 0;
  let latest_latest_audit = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    if (String(r['compliance']).toLowerCase() === String('true').toLowerCase() || (r['compliance'] === true)) count_compliant_count += 1;
    if (String(r['compliance']).toLowerCase() === String('false').toLowerCase() || (r['compliance'] === false)) count_non_compliant_count += 1;
    
    const val_avg_required_lux = Number(r['required_lux']);
    if (!Number.isNaN(val_avg_required_lux) && r['required_lux'] != null && r['required_lux'] !== '') {
      sum_avg_required_lux += val_avg_required_lux;
      count_avg_required_lux += 1;
    }
    const val_avg_measured_lux = Number(r['average_lux']);
    if (!Number.isNaN(val_avg_measured_lux) && r['average_lux'] != null && r['average_lux'] !== '') {
      sum_avg_measured_lux += val_avg_measured_lux;
      count_avg_measured_lux += 1;
    }
    const avgL = Number(r.average_lux); const reqL = Number(r.required_lux); if (!Number.isNaN(avgL) && !Number.isNaN(reqL)) { sum_lux_gap += (avgL - reqL); count_lux_gap += 1; }
    const dt_latest_audit = Date.parse(r['audit_date'] as string);
    if (!Number.isNaN(dt_latest_audit) && dt_latest_audit > latest_latest_audit) latest_latest_audit = dt_latest_audit;
    }
  }

  
  
  
  
  
  
  
  const val_latest_audit = latest_latest_audit > 0 ? new Date(latest_latest_audit).toLocaleDateString() : "";

  return [
    {
      id: "lux-measurements-kpis_dataset",
      title: "Compliance Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_lux_records",
          label: "Total Lux Measurement Records",
          value: count,
        },
        {
          columnKey: "compliant_count",
          label: "Compliant Count",
          value: count_compliant_count,
        },
        {
          columnKey: "non_compliant_count",
          label: "Non-Compliant Count",
          value: count_non_compliant_count,
        },
        {
          columnKey: "compliance_pct",
          label: "Compliance Percentage (%)",
          value: count > 0 ? (count_compliant_count / count) * 100 : 0,
        },
        {
          columnKey: "avg_required_lux",
          label: "Average Required Lux",
          value: count_avg_required_lux > 0 ? sum_avg_required_lux / count_avg_required_lux : 0,
        },
        {
          columnKey: "avg_measured_lux",
          label: "Average Measured Lux",
          value: count_avg_measured_lux > 0 ? sum_avg_measured_lux / count_avg_measured_lux : 0,
        },
        {
          columnKey: "avg_lux_gap",
          label: "Average Lux Gap",
          value: count_lux_gap > 0 ? sum_lux_gap / count_lux_gap : 0,
        },
        {
          columnKey: "latest_audit",
          label: "Latest Audit Date",
          value: val_latest_audit,
        },
      ],
    },
  ];
}
