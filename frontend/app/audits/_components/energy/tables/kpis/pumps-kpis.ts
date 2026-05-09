import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computePumpsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_daily_energy = 0;
  let sum_total_annual_energy = 0;
  let sum_avg_input_power = 0;
  let count_avg_input_power = 0;
  let sum_avg_eff = 0;
  let count_avg_eff = 0;
  let sum_avg_motor_loading = 0;
  let count_avg_motor_loading = 0;
  let sum_avg_specific_energy = 0;
  let count_avg_specific_energy = 0;
  let sum_avg_actual_flow = 0;
  let count_avg_actual_flow = 0;
  let count_vfd_installed = 0;
  let count_valve_throttling = 0;
  let count_leakages = 0;
  let latest_latest_audit = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    if (Array.isArray((row as any)['pump_audit_records']) && (row as any)['pump_audit_records'].length > 0) {
      for (const nested of (row as any)['pump_audit_records']) {
        recordsToProcess.push({ ...(row as any), ...nested });
      }
    } else {
      recordsToProcess.push(row);
    }
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_daily_energy += tryNum(r['daily_energy_consumption_kWh']);
    sum_total_annual_energy += tryNum(r['annual_energy_consumption_kWh']);
    const val_avg_input_power = Number(r['input_power_kW']);
    if (!Number.isNaN(val_avg_input_power) && r['input_power_kW'] != null && r['input_power_kW'] !== '') {
      sum_avg_input_power += val_avg_input_power;
      count_avg_input_power += 1;
    }
    const val_avg_eff = Number(r['overall_pump_set_efficiency_percent']);
    if (!Number.isNaN(val_avg_eff) && r['overall_pump_set_efficiency_percent'] != null && r['overall_pump_set_efficiency_percent'] !== '') {
      sum_avg_eff += val_avg_eff;
      count_avg_eff += 1;
    }
    const val_avg_motor_loading = Number(r['motor_loading_percent']);
    if (!Number.isNaN(val_avg_motor_loading) && r['motor_loading_percent'] != null && r['motor_loading_percent'] !== '') {
      sum_avg_motor_loading += val_avg_motor_loading;
      count_avg_motor_loading += 1;
    }
    const val_avg_specific_energy = Number(r['specific_energy_consumption_kWh_per_m3']);
    if (!Number.isNaN(val_avg_specific_energy) && r['specific_energy_consumption_kWh_per_m3'] != null && r['specific_energy_consumption_kWh_per_m3'] !== '') {
      sum_avg_specific_energy += val_avg_specific_energy;
      count_avg_specific_energy += 1;
    }
    const val_avg_actual_flow = Number(r['actual_flow_m3_per_hr']);
    if (!Number.isNaN(val_avg_actual_flow) && r['actual_flow_m3_per_hr'] != null && r['actual_flow_m3_per_hr'] !== '') {
      sum_avg_actual_flow += val_avg_actual_flow;
      count_avg_actual_flow += 1;
    }
    if (String(r['vfd_installed']).toLowerCase() === String('true').toLowerCase() || (r['vfd_installed'] === true)) count_vfd_installed += 1;
    if (String(r['control_valve_throttling']).toLowerCase() === String('true').toLowerCase() || (r['control_valve_throttling'] === true)) count_valve_throttling += 1;
    if (String(r['leakages_observed']).toLowerCase() === String('true').toLowerCase() || (r['leakages_observed'] === true)) count_leakages += 1;
    const dt_latest_audit = Date.parse(r['audit_date'] as string);
    if (!Number.isNaN(dt_latest_audit) && dt_latest_audit > latest_latest_audit) latest_latest_audit = dt_latest_audit;
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  const val_latest_audit = latest_latest_audit > 0 ? new Date(latest_latest_audit).toLocaleDateString() : "";

  return [
    {
      id: "pumps-kpis_dataset",
      title: "Pump Audit Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_pump_records",
          label: "Total Pump Audit Records",
          value: count,
        },
        {
          columnKey: "total_daily_energy",
          label: "Total Daily Energy Consumption (kWh)",
          value: sum_total_daily_energy,
        },
        {
          columnKey: "total_annual_energy",
          label: "Total Annual Energy Consumption (kWh)",
          value: sum_total_annual_energy,
        },
        {
          columnKey: "avg_input_power",
          label: "Average Input Power (kW)",
          value: count_avg_input_power > 0 ? sum_avg_input_power / count_avg_input_power : 0,
        },
        {
          columnKey: "avg_eff",
          label: "Average Efficiency (%)",
          value: count_avg_eff > 0 ? sum_avg_eff / count_avg_eff : 0,
        },
        {
          columnKey: "avg_motor_loading",
          label: "Average Motor Loading (%)",
          value: count_avg_motor_loading > 0 ? sum_avg_motor_loading / count_avg_motor_loading : 0,
        },
        {
          columnKey: "avg_specific_energy",
          label: "Average Specific Energy (kWh/m3)",
          value: count_avg_specific_energy > 0 ? sum_avg_specific_energy / count_avg_specific_energy : 0,
        },
        {
          columnKey: "avg_actual_flow",
          label: "Average Actual Flow (m3/hr)",
          value: count_avg_actual_flow > 0 ? sum_avg_actual_flow / count_avg_actual_flow : 0,
        },
        {
          columnKey: "vfd_installed",
          label: "Pumps with VFD Installed",
          value: count_vfd_installed,
        },
        {
          columnKey: "valve_throttling",
          label: "Cases with Valve Throttling",
          value: count_valve_throttling,
        },
        {
          columnKey: "leakages",
          label: "Cases with Leakages Observed",
          value: count_leakages,
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
