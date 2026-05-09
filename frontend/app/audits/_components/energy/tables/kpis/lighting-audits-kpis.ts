import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeLightingAuditsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_qty = 0;
  let sum_total_conn_load = 0;
  let sum_total_annual_energy = 0;
  let sum_avg_wattage = 0;
  let count_avg_wattage = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_qty += tryNum(r['quantity_nos']);
    sum_total_conn_load += tryNum(r['connected_load_kW']);
    sum_total_annual_energy += tryNum(r['annual_energy_kWh']);
    const val_avg_wattage = Number(r['wattage_W']);
    if (!Number.isNaN(val_avg_wattage) && r['wattage_W'] != null && r['wattage_W'] !== '') {
      sum_avg_wattage += val_avg_wattage;
      count_avg_wattage += 1;
    }
    }
  }

  
  
  
  
  

  return [
    {
      id: "lighting-audits-kpis_dataset",
      title: "Lighting Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_lighting_records",
          label: "Total Lighting Audit Records",
          value: count,
        },
        {
          columnKey: "total_qty",
          label: "Total Quantity (Nos)",
          value: sum_total_qty,
        },
        {
          columnKey: "total_conn_load",
          label: "Total Connected Load (kW)",
          value: sum_total_conn_load,
        },
        {
          columnKey: "total_annual_energy",
          label: "Total Annual Energy (kWh)",
          value: sum_total_annual_energy,
        },
        {
          columnKey: "avg_wattage",
          label: "Average Wattage (W)",
          value: count_avg_wattage > 0 ? sum_avg_wattage / count_avg_wattage : 0,
        },
      ],
    },
  ];
}
