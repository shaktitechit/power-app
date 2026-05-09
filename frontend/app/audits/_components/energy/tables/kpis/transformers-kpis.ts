import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeTransformersKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_energy_supplied = 0;
  let sum_total_energy_losses = 0;
  let sum_total_cost_losses = 0;
  let sum_avg_loading = 0;
  let count_avg_loading = 0;
  let sum_avg_pf_lt = 0;
  let count_avg_pf_lt = 0;
  let sum_avg_load_factor = 0;
  let count_avg_load_factor = 0;
  let latest_latest_audit = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    if (Array.isArray((row as any)['transformer_audit_records']) && (row as any)['transformer_audit_records'].length > 0) {
      for (const nested of (row as any)['transformer_audit_records']) {
        recordsToProcess.push({ ...(row as any), ...nested });
      }
    } else {
      recordsToProcess.push(row);
    }
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_energy_supplied += tryNum(r['annual_energy_supplied_kWh']);
    sum_total_energy_losses += tryNum(r['annual_energy_losses_kWh']);
    sum_total_cost_losses += tryNum(r['cost_of_losses_rs']);
    const val_avg_loading = Number(r['percent_loading']);
    if (!Number.isNaN(val_avg_loading) && r['percent_loading'] != null && r['percent_loading'] !== '') {
      sum_avg_loading += val_avg_loading;
      count_avg_loading += 1;
    }
    const val_avg_pf_lt = Number(r['power_factor_LT']);
    if (!Number.isNaN(val_avg_pf_lt) && r['power_factor_LT'] != null && r['power_factor_LT'] !== '') {
      sum_avg_pf_lt += val_avg_pf_lt;
      count_avg_pf_lt += 1;
    }
    const val_avg_load_factor = Number(r['load_factor_percent']);
    if (!Number.isNaN(val_avg_load_factor) && r['load_factor_percent'] != null && r['load_factor_percent'] !== '') {
      sum_avg_load_factor += val_avg_load_factor;
      count_avg_load_factor += 1;
    }
    const dt_latest_audit = Date.parse(r['audit_date'] as string);
    if (!Number.isNaN(dt_latest_audit) && dt_latest_audit > latest_latest_audit) latest_latest_audit = dt_latest_audit;
    }
  }

  
  
  
  
  
  
  
  const val_latest_audit = latest_latest_audit > 0 ? new Date(latest_latest_audit).toLocaleDateString() : "";

  return [
    {
      id: "transformers-kpis_dataset",
      title: "Transformer Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_tx_records",
          label: "Total Transformer Audit Records",
          value: count,
        },
        {
          columnKey: "total_energy_supplied",
          label: "Total Annual Energy Supplied (kWh)",
          value: sum_total_energy_supplied,
        },
        {
          columnKey: "total_energy_losses",
          label: "Total Annual Energy Losses (kWh)",
          value: sum_total_energy_losses,
        },
        {
          columnKey: "total_cost_losses",
          label: "Total Cost of Losses (Rs)",
          value: sum_total_cost_losses,
        },
        {
          columnKey: "avg_loading",
          label: "Average Percent Loading (%)",
          value: count_avg_loading > 0 ? sum_avg_loading / count_avg_loading : 0,
        },
        {
          columnKey: "avg_pf_lt",
          label: "Average Power Factor LT",
          value: count_avg_pf_lt > 0 ? sum_avg_pf_lt / count_avg_pf_lt : 0,
        },
        {
          columnKey: "avg_load_factor",
          label: "Average Load Factor (%)",
          value: count_avg_load_factor > 0 ? sum_avg_load_factor / count_avg_load_factor : 0,
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
