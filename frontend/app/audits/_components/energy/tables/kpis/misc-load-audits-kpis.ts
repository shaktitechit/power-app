import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeMiscLoadAuditsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  
  let sum_total_qty = 0;
  let tcl = 0;
  let sum_total_annual_energy = 0;
  

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    
    sum_total_qty += tryNum(r['quantity']);
    tcl += tryNum(r.rated_power_kW) * tryNum(r.quantity);
    sum_total_annual_energy += tryNum(r['estimated_annual_energy_kWh']);
    
    }
  }

  
  
  
  
  

  return [
    {
      id: "misc-load-audits-kpis_dataset",
      title: "Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_records",
          label: "Total Records",
          value: count,
        },
        {
          columnKey: "total_qty",
          label: "Total Quantity",
          value: sum_total_qty,
        },
        {
          columnKey: "total_conn_load",
          label: "Total Connected Load (kW)",
          value: tcl,
        },
        {
          columnKey: "total_annual_energy",
          label: "Total Annual Energy (kWh)",
          value: sum_total_annual_energy,
        },
        {
          columnKey: "energy_per_kw",
          label: "Energy per kW",
          value: tcl > 0 ? sum_total_annual_energy / tcl : 0,
        },
      ],
    },
  ];
}
