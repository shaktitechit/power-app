import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeAcAuditRecordsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_conn_load = 0;
  let sum_total_annual_energy = 0;
  let sum_avg_specific_power = 0;
  let count_avg_specific_power = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_conn_load += tryNum(r['connected_load_kW']);
    sum_total_annual_energy += tryNum(r['annual_energy_consumption_kWh']);
    const val_avg_specific_power = Number(r['specific_power_kW_per_TR']);
    if (!Number.isNaN(val_avg_specific_power) && r['specific_power_kW_per_TR'] != null && r['specific_power_kW_per_TR'] !== '') {
      sum_avg_specific_power += val_avg_specific_power;
      count_avg_specific_power += 1;
    }
    }
  }

  
  
  
  

  return [
    {
      id: "ac-audit-records-kpis_dataset",
      title: "AC Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_ac_records",
          label: "Total AC Audit Records",
          value: count,
        },
        {
          columnKey: "total_conn_load",
          label: "Total Connected Load (kW)",
          value: sum_total_conn_load,
        },
        {
          columnKey: "total_annual_energy",
          label: "Total Annual Energy Consumption (kWh)",
          value: sum_total_annual_energy,
        },
        {
          columnKey: "avg_specific_power",
          label: "Average Specific Power (kW/TR)",
          value: count_avg_specific_power > 0 ? sum_avg_specific_power / count_avg_specific_power : 0,
        },
      ],
    },
  ];
}
