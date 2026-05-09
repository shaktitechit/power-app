import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeHvacAuditsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_avg_cooling_tr = 0;
  let count_avg_cooling_tr = 0;
  let sum_avg_chiller_kw = 0;
  let count_avg_chiller_kw = 0;
  let sum_avg_aux_kw = 0;
  let count_avg_aux_kw = 0;
  let sum_avg_plant_kw = 0;
  let count_avg_plant_kw = 0;
  let sum_avg_plant_eff = 0;
  let count_avg_plant_eff = 0;
  let sum_avg_cop = 0;
  let count_avg_cop = 0;
  let latest_latest_audit = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    const val_avg_cooling_tr = Number(r['cooling_produced_tr']);
    if (!Number.isNaN(val_avg_cooling_tr) && r['cooling_produced_tr'] != null && r['cooling_produced_tr'] !== '') {
      sum_avg_cooling_tr += val_avg_cooling_tr;
      count_avg_cooling_tr += 1;
    }
    const val_avg_chiller_kw = Number(r['chiller_power_used_kw']);
    if (!Number.isNaN(val_avg_chiller_kw) && r['chiller_power_used_kw'] != null && r['chiller_power_used_kw'] !== '') {
      sum_avg_chiller_kw += val_avg_chiller_kw;
      count_avg_chiller_kw += 1;
    }
    const val_avg_aux_kw = Number(r['total_auxiliary_power_kw']);
    if (!Number.isNaN(val_avg_aux_kw) && r['total_auxiliary_power_kw'] != null && r['total_auxiliary_power_kw'] !== '') {
      sum_avg_aux_kw += val_avg_aux_kw;
      count_avg_aux_kw += 1;
    }
    const val_avg_plant_kw = Number(r['total_plant_power_kw']);
    if (!Number.isNaN(val_avg_plant_kw) && r['total_plant_power_kw'] != null && r['total_plant_power_kw'] !== '') {
      sum_avg_plant_kw += val_avg_plant_kw;
      count_avg_plant_kw += 1;
    }
    const val_avg_plant_eff = Number(r['plant_efficiency_kw_per_tr']);
    if (!Number.isNaN(val_avg_plant_eff) && r['plant_efficiency_kw_per_tr'] != null && r['plant_efficiency_kw_per_tr'] !== '') {
      sum_avg_plant_eff += val_avg_plant_eff;
      count_avg_plant_eff += 1;
    }
    const val_avg_cop = Number(r['cop']);
    if (!Number.isNaN(val_avg_cop) && r['cop'] != null && r['cop'] !== '') {
      sum_avg_cop += val_avg_cop;
      count_avg_cop += 1;
    }
    const dt_latest_audit = Date.parse(r['audit_date'] as string);
    if (!Number.isNaN(dt_latest_audit) && dt_latest_audit > latest_latest_audit) latest_latest_audit = dt_latest_audit;
    }
  }

  
  
  
  
  
  
  
  const val_latest_audit = latest_latest_audit > 0 ? new Date(latest_latest_audit).toLocaleDateString() : "";

  return [
    {
      id: "hvac-audits-kpis_dataset",
      title: "HVAC Report Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_hvac_records",
          label: "Total HVAC Records",
          value: count,
        },
        {
          columnKey: "avg_cooling_tr",
          label: "Average Cooling Produced (TR)",
          value: count_avg_cooling_tr > 0 ? sum_avg_cooling_tr / count_avg_cooling_tr : 0,
        },
        {
          columnKey: "avg_chiller_kw",
          label: "Average Chiller Power Used (kW)",
          value: count_avg_chiller_kw > 0 ? sum_avg_chiller_kw / count_avg_chiller_kw : 0,
        },
        {
          columnKey: "avg_aux_kw",
          label: "Average Total Auxiliary Power Used (kW)",
          value: count_avg_aux_kw > 0 ? sum_avg_aux_kw / count_avg_aux_kw : 0,
        },
        {
          columnKey: "avg_plant_kw",
          label: "Average Total Plant Power (kW)",
          value: count_avg_plant_kw > 0 ? sum_avg_plant_kw / count_avg_plant_kw : 0,
        },
        {
          columnKey: "avg_plant_eff",
          label: "Average Plant Efficiency (kW/TR)",
          value: count_avg_plant_eff > 0 ? sum_avg_plant_eff / count_avg_plant_eff : 0,
        },
        {
          columnKey: "avg_cop",
          label: "Average Coefficient of Performance",
          value: count_avg_cop > 0 ? sum_avg_cop / count_avg_cop : 0,
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
