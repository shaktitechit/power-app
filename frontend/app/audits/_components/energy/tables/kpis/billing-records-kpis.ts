import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function computeBillingRecordsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  const accts = new Set();
  
  let sum_total_monthly_electricity_bill = 0;
  let sum_total_units_kwh = 0;
  let sum_total_units_kvah = 0;
  let sum_total_fixed_charges = 0;
  let sum_total_demand_charges = 0;
  let sum_total_energy_charges = 0;
  let sum_total_taxes_rent = 0;
  let sum_total_other_charges = 0;
  let sum_total_penalty = 0;
  let sum_total_rebate = 0;
  let sum_avg_monthly_bill = 0;
  let count_avg_monthly_bill = 0;
  let sum_avg_units_kwh = 0;
  let count_avg_units_kwh = 0;
  let sum_avg_units_kvah = 0;
  let count_avg_units_kvah = 0;
  let sum_avg_mdi = 0;
  let count_avg_mdi = 0;
  let sum_avg_pf = 0;
  let count_avg_pf = 0;
  let latest_latest_period_end = 0;
  
  

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    recordsToProcess.push(row);
    
    for (const r of recordsToProcess) {
      count++;
    
    if (r.utility_account_id) accts.add(r.utility_account_id);
    
    sum_total_monthly_electricity_bill += tryNum(r['monthly_electricity_bill_rs']);
    sum_total_units_kwh += tryNum(r['units_kWh']);
    sum_total_units_kvah += tryNum(r['units_kVAh']);
    sum_total_fixed_charges += tryNum(r['fixed_charges_rs']);
    sum_total_demand_charges += tryNum(r['demand_charges_rs']);
    sum_total_energy_charges += tryNum(r['energy_charges_rs']);
    sum_total_taxes_rent += tryNum(r['taxes_and_rent_rs']);
    sum_total_other_charges += tryNum(r['other_charges_rs']);
    sum_total_penalty += tryNum(r['penalty_rs']);
    sum_total_rebate += tryNum(r['rebate_subsidy_rs']);
    const val_avg_monthly_bill = Number(r['monthly_electricity_bill_rs']);
    if (!Number.isNaN(val_avg_monthly_bill) && r['monthly_electricity_bill_rs'] != null && r['monthly_electricity_bill_rs'] !== '') {
      sum_avg_monthly_bill += val_avg_monthly_bill;
      count_avg_monthly_bill += 1;
    }
    const val_avg_units_kwh = Number(r['units_kWh']);
    if (!Number.isNaN(val_avg_units_kwh) && r['units_kWh'] != null && r['units_kWh'] !== '') {
      sum_avg_units_kwh += val_avg_units_kwh;
      count_avg_units_kwh += 1;
    }
    const val_avg_units_kvah = Number(r['units_kVAh']);
    if (!Number.isNaN(val_avg_units_kvah) && r['units_kVAh'] != null && r['units_kVAh'] !== '') {
      sum_avg_units_kvah += val_avg_units_kvah;
      count_avg_units_kvah += 1;
    }
    const val_avg_mdi = Number(r['mdi_kVA']);
    if (!Number.isNaN(val_avg_mdi) && r['mdi_kVA'] != null && r['mdi_kVA'] !== '') {
      sum_avg_mdi += val_avg_mdi;
      count_avg_mdi += 1;
    }
    const val_avg_pf = Number(r['pf']);
    if (!Number.isNaN(val_avg_pf) && r['pf'] != null && r['pf'] !== '') {
      sum_avg_pf += val_avg_pf;
      count_avg_pf += 1;
    }
    const dt_latest_period_end = Date.parse(r['billing_period_end'] as string);
    if (!Number.isNaN(dt_latest_period_end) && dt_latest_period_end > latest_latest_period_end) latest_latest_period_end = dt_latest_period_end;
    
    
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const val_latest_period_end = latest_latest_period_end > 0 ? new Date(latest_latest_period_end).toLocaleDateString() : "";
  
  

  return [
    {
      id: "billing-records-kpis_dataset",
      title: "Overall Billing Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_utility_accounts",
          label: "Total Utility Accounts",
          value: accts.size,
        },
        {
          columnKey: "total_billing_records",
          label: "Total Billing Records",
          value: count,
        },
        {
          columnKey: "total_monthly_electricity_bill",
          label: "Total Monthly Electricity Bill (Rs)",
          value: sum_total_monthly_electricity_bill,
        },
        {
          columnKey: "total_units_kwh",
          label: "Total Units kWh",
          value: sum_total_units_kwh,
        },
        {
          columnKey: "total_units_kvah",
          label: "Total Units kVAh",
          value: sum_total_units_kvah,
        },
        {
          columnKey: "total_fixed_charges",
          label: "Total Fixed Charges Rs",
          value: sum_total_fixed_charges,
        },
        {
          columnKey: "total_demand_charges",
          label: "Total Demand Charges Rs",
          value: sum_total_demand_charges,
        },
        {
          columnKey: "total_energy_charges",
          label: "Total Energy Charges Rs",
          value: sum_total_energy_charges,
        },
        {
          columnKey: "total_taxes_rent",
          label: "Total Taxes and Rent Rs",
          value: sum_total_taxes_rent,
        },
        {
          columnKey: "total_other_charges",
          label: "Total Other Charges Rs",
          value: sum_total_other_charges,
        },
        {
          columnKey: "total_penalty",
          label: "Total Penalty Rs",
          value: sum_total_penalty,
        },
        {
          columnKey: "total_rebate",
          label: "Total Rebate / Subsidy Rs",
          value: sum_total_rebate,
        },
        {
          columnKey: "avg_monthly_bill",
          label: "Average Monthly Bill Rs",
          value: count_avg_monthly_bill > 0 ? sum_avg_monthly_bill / count_avg_monthly_bill : 0,
        },
        {
          columnKey: "avg_units_kwh",
          label: "Average Units kWh",
          value: count_avg_units_kwh > 0 ? sum_avg_units_kwh / count_avg_units_kwh : 0,
        },
        {
          columnKey: "avg_units_kvah",
          label: "Average Units kVAh",
          value: count_avg_units_kvah > 0 ? sum_avg_units_kvah / count_avg_units_kvah : 0,
        },
        {
          columnKey: "avg_mdi",
          label: "Average MDI kVA",
          value: count_avg_mdi > 0 ? sum_avg_mdi / count_avg_mdi : 0,
        },
        {
          columnKey: "avg_pf",
          label: "Average PF",
          value: count_avg_pf > 0 ? sum_avg_pf / count_avg_pf : 0,
        },
        {
          columnKey: "latest_period_end",
          label: "Latest Billing Period End",
          value: val_latest_period_end,
        },
        {
          columnKey: "grid_cost_kvah",
          label: "Grid Cost per kVAh Rs",
          value: sum_total_units_kvah > 0 ? sum_total_monthly_electricity_bill / sum_total_units_kvah : 0,
        },
        {
          columnKey: "grid_cost_kwh",
          label: "Grid Cost per kWh Rs",
          value: sum_total_units_kwh > 0 ? sum_total_monthly_electricity_bill / sum_total_units_kwh : 0,
        },
      ],
    },
  ];
}
