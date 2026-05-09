import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeSolarPlantsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  const plants = new Set();
  
  let sum_total_import = 0;
  let sum_total_export = 0;
  let sum_total_net = 0;
  let sum_total_gen = 0;
  let sum_gen = 0; let sum_days = 0;
  let sum_spec_gen = 0; let sum_spec_gen_count = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    if (Array.isArray((row as any)['solar_generation_records']) && (row as any)['solar_generation_records'].length > 0) {
      for (const nested of (row as any)['solar_generation_records']) {
        recordsToProcess.push({ ...(row as any), ...nested });
      }
    } else {
      recordsToProcess.push(row);
    }
    
    for (const r of recordsToProcess) {
      count++;
    
    if (r.solar_plant_id) plants.add(r.solar_plant_id); else if (r.rating_kWp || r.capacity_kwp) plants.add(r._id || Math.random());
    
    sum_total_import += tryNum(r['import_kWh']);
    sum_total_export += tryNum(r['export_kWh']);
    sum_total_net += tryNum(r['net_kWh']);
    sum_total_gen += tryNum(r['solar_generation_kWh']);
    sum_gen += tryNum(r.solar_generation_kWh); sum_days += tryNum(r.billing_days);
    if (r.solar_generation_kWh && r.rating_kWp) { sum_spec_gen += tryNum(r.solar_generation_kWh) / tryNum(r.rating_kWp); sum_spec_gen_count += 1; }
    }
  }

  
  
  
  
  
  
  
  

  return [
    {
      id: "solar-plants-kpis_dataset",
      title: "Overall Solar Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_plants",
          label: "Total Plants",
          value: plants.size,
        },
        {
          columnKey: "total_records",
          label: "Total Records",
          value: count,
        },
        {
          columnKey: "total_import",
          label: "Total Import (kWh)",
          value: sum_total_import,
        },
        {
          columnKey: "total_export",
          label: "Total Export (kWh)",
          value: sum_total_export,
        },
        {
          columnKey: "total_net",
          label: "Total Net (kWh)",
          value: sum_total_net,
        },
        {
          columnKey: "total_gen",
          label: "Total Solar Generation (kWh)",
          value: sum_total_gen,
        },
        {
          columnKey: "avg_gen_day",
          label: "Average Generation / Day (kWh)",
          value: sum_days > 0 ? sum_gen / sum_days : 0,
        },
        {
          columnKey: "avg_spec_gen",
          label: "Average Specific Generation (kWh/kWp)",
          value: sum_spec_gen_count > 0 ? sum_spec_gen / sum_spec_gen_count : 0,
        },
      ],
    },
  ];
}
