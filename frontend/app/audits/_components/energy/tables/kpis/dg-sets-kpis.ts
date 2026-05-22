import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeDgSetsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_avg_measured_kw = 0;
  let count_avg_measured_kw = 0;
  let sum_avg_measured_kva = 0;
  let count_avg_measured_kva = 0;
  let sum_avg_pf = 0;
  let count_avg_pf = 0;
  let sum_avg_dg_cost = 0;
  let count_avg_dg_cost = 0;
  let sum_avg_grid_cost = 0;
  let count_avg_grid_cost = 0;
  let sum_avg_loading = 0;
  let count_avg_loading = 0;
  let sum_avg_sfc = 0;
  let count_avg_sfc = 0;
  let sum_avg_eff = 0;
  let count_avg_eff = 0;
  let latest_latest_audit = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    if (Array.isArray((row as any)['dg_audit_records']) && (row as any)['dg_audit_records'].length > 0) {
      for (const nested of (row as any)['dg_audit_records']) {
        recordsToProcess.push({ ...(row as any), ...nested });
      }
    } else {
      recordsToProcess.push(row);
    }
    
    for (const r of recordsToProcess) {
      count++;
    
    
    const val_avg_measured_kw = Number(r['measured_kW_output']);
    if (!Number.isNaN(val_avg_measured_kw) && r['measured_kW_output'] != null && r['measured_kW_output'] !== '') {
      sum_avg_measured_kw += val_avg_measured_kw;
      count_avg_measured_kw += 1;
    }
    const val_avg_measured_kva = Number(r['measured_kVA_output']);
    if (!Number.isNaN(val_avg_measured_kva) && r['measured_kVA_output'] != null && r['measured_kVA_output'] !== '') {
      sum_avg_measured_kva += val_avg_measured_kva;
      count_avg_measured_kva += 1;
    }
    const val_avg_pf = Number(r['power_factor']);
    if (!Number.isNaN(val_avg_pf) && r['power_factor'] != null && r['power_factor'] !== '') {
      sum_avg_pf += val_avg_pf;
      count_avg_pf += 1;
    }
    const val_avg_dg_cost = Number(r['dg_cost_per_kWh_rs']);
    if (!Number.isNaN(val_avg_dg_cost) && r['dg_cost_per_kWh_rs'] != null && r['dg_cost_per_kWh_rs'] !== '') {
      sum_avg_dg_cost += val_avg_dg_cost;
      count_avg_dg_cost += 1;
    }
    const val_avg_grid_cost = Number(r['grid_cost_per_kWh_rs']);
    if (!Number.isNaN(val_avg_grid_cost) && r['grid_cost_per_kWh_rs'] != null && r['grid_cost_per_kWh_rs'] !== '') {
      sum_avg_grid_cost += val_avg_grid_cost;
      count_avg_grid_cost += 1;
    }
    const val_avg_loading = Number(r['average_loading_percent']);
    if (!Number.isNaN(val_avg_loading) && r['average_loading_percent'] != null && r['average_loading_percent'] !== '') {
      sum_avg_loading += val_avg_loading;
      count_avg_loading += 1;
    }
    const val_avg_sfc = Number(r['specific_fuel_consumption_l_per_kWh']);
    if (!Number.isNaN(val_avg_sfc) && r['specific_fuel_consumption_l_per_kWh'] != null && r['specific_fuel_consumption_l_per_kWh'] !== '') {
      sum_avg_sfc += val_avg_sfc;
      count_avg_sfc += 1;
    }
    const val_avg_eff = Number(r['calculated_efficiency_percent']);
    if (!Number.isNaN(val_avg_eff) && r['calculated_efficiency_percent'] != null && r['calculated_efficiency_percent'] !== '') {
      sum_avg_eff += val_avg_eff;
      count_avg_eff += 1;
    }
    const dt_latest_audit = Date.parse(r['audit_date'] as string);
    if (!Number.isNaN(dt_latest_audit) && dt_latest_audit > latest_latest_audit) latest_latest_audit = dt_latest_audit;
    }
  }

  
  
  
  
  
  
  
  
  
  const val_latest_audit = latest_latest_audit > 0 ? new Date(latest_latest_audit).toLocaleDateString() : "";

  return [
    {
      id: "dg-sets-kpis_dataset",
      title: "DG Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_dg_records",
          label: "Total DG Audit Records",
          value: count,
        },
        {
          columnKey: "avg_measured_kw",
          label: "Average Measured kW Output",
          value: count_avg_measured_kw > 0 ? sum_avg_measured_kw / count_avg_measured_kw : 0,
        },
        {
          columnKey: "avg_measured_kva",
          label: "Average Measured kVA Output",
          value: count_avg_measured_kva > 0 ? sum_avg_measured_kva / count_avg_measured_kva : 0,
        },
        {
          columnKey: "avg_pf",
          label: "Average Power Factor",
          value: count_avg_pf > 0 ? sum_avg_pf / count_avg_pf : 0,
        },
        {
          columnKey: "avg_dg_cost",
          label: "Average DG Cost per kWh (Rs)",
          value: count_avg_dg_cost > 0 ? sum_avg_dg_cost / count_avg_dg_cost : 0,
        },
        {
          columnKey: "avg_grid_cost",
          label: "Average Grid Cost per kWh (Rs)",
          value: count_avg_grid_cost > 0 ? sum_avg_grid_cost / count_avg_grid_cost : 0,
        },
        {
          columnKey: "avg_loading",
          label: "Average Loading (kW)",
          value: count_avg_loading > 0 ? sum_avg_loading / count_avg_loading : 0,
        },
        {
          columnKey: "avg_sfc",
          label: "Average Specific Fuel Consumption (L/kWh)",
          value: count_avg_sfc > 0 ? sum_avg_sfc / count_avg_sfc : 0,
        },
        {
          columnKey: "avg_eff",
          label: "Average Calculated Efficiency (%)",
          value: count_avg_eff > 0 ? sum_avg_eff / count_avg_eff : 0,
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
