import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeFanAuditRecordsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_qty = 0;
  let sum_total_conn_load = 0;
  let sum_total_annual_energy = 0;
  let sum_avg_rated_power = 0;
  let count_avg_rated_power = 0;
  let sum_avg_measured_power = 0;
  let count_avg_measured_power = 0;
  let sum_avg_loading = 0;
  let count_avg_loading = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_qty += tryNum(r['quantity_nos']);
    sum_total_conn_load += tryNum(r['connected_load_kW']);
    sum_total_annual_energy += tryNum(r['annual_energy_consumption_kWh']);
    const val_avg_rated_power = Number(r['rated_power_W']);
    if (!Number.isNaN(val_avg_rated_power) && r['rated_power_W'] != null && r['rated_power_W'] !== '') {
      sum_avg_rated_power += val_avg_rated_power;
      count_avg_rated_power += 1;
    }
    const val_avg_measured_power = Number(r['measured_power_W']);
    if (!Number.isNaN(val_avg_measured_power) && r['measured_power_W'] != null && r['measured_power_W'] !== '') {
      sum_avg_measured_power += val_avg_measured_power;
      count_avg_measured_power += 1;
    }
    const val_avg_loading = Number(r['loading_factor_percent']);
    if (!Number.isNaN(val_avg_loading) && r['loading_factor_percent'] != null && r['loading_factor_percent'] !== '') {
      sum_avg_loading += val_avg_loading;
      count_avg_loading += 1;
    }
    }
  }

  
  
  
  
  
  
  

  return [
    {
      id: "fan-audit-records-kpis_dataset",
      title: "Fan Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_fan_records",
          label: "Total Fan Audit Records",
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
          label: "Total Annual Energy Consumption (kWh)",
          value: sum_total_annual_energy,
        },
        {
          columnKey: "avg_rated_power",
          label: "Average Rated Power (W)",
          value: count_avg_rated_power > 0 ? sum_avg_rated_power / count_avg_rated_power : 0,
        },
        {
          columnKey: "avg_measured_power",
          label: "Average Measured Power (W)",
          value: count_avg_measured_power > 0 ? sum_avg_measured_power / count_avg_measured_power : 0,
        },
        {
          columnKey: "avg_loading",
          label: "Average Loading Factor (%)",
          value: count_avg_loading > 0 ? sum_avg_loading / count_avg_loading : 0,
        },
      ],
    },
  ];
}
