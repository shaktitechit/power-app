const fs = require('fs');
const path = require('path');
const kpisDir = path.join('frontend', 'app', 'audits', '_components', 'energy', 'tables', 'kpis');

function writeKpiFile(filename, functionName, title, metrics, nestedKey = null) {
  const content = `import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

function tryNum(val: unknown): number {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

export function ${functionName}(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let count = 0;

  ${metrics.map(m => {
    if (m.type === 'sum') return `let sum_${m.id} = 0;`;
    if (m.type === 'avg') return `let sum_${m.id} = 0;\n  let count_${m.id} = 0;`;
    if (m.type === 'count_cond') return `let count_${m.id} = 0;`;
    if (m.type === 'max_date') return `let latest_${m.id} = 0;`;
    if (m.type === 'custom') return m.init;
    return '';
  }).join('\n  ')}

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const recordsToProcess: any[] = [];
    ${nestedKey 
      ? `if (Array.isArray((row as any)['${nestedKey}']) && (row as any)['${nestedKey}'].length > 0) {
      for (const nested of (row as any)['${nestedKey}']) {
        recordsToProcess.push({ ...(row as any), ...nested });
      }
    } else {
      recordsToProcess.push(row);
    }`
      : `recordsToProcess.push(row);`
    }
    
    for (const r of recordsToProcess) {
      count++;
    
    ${metrics.map(m => {
      if (m.type === 'sum') return `sum_${m.id} += tryNum(r['${m.key}']);`;
      if (m.type === 'avg') return `const val_${m.id} = Number(r['${m.key}']);\n    if (!Number.isNaN(val_${m.id}) && r['${m.key}'] != null && r['${m.key}'] !== '') {\n      sum_${m.id} += val_${m.id};\n      count_${m.id} += 1;\n    }`;
      if (m.type === 'count_cond') return `if (String(r['${m.key}']).toLowerCase() === String('${m.cond}').toLowerCase() || (r['${m.key}'] === ${m.cond})) count_${m.id} += 1;`;
      if (m.type === 'max_date') return `const dt_${m.id} = Date.parse(r['${m.key}'] as string);\n    if (!Number.isNaN(dt_${m.id}) && dt_${m.id} > latest_${m.id}) latest_${m.id} = dt_${m.id};`;
      if (m.type === 'custom') return m.loop;
      return '';
    }).join('\n    ')}
    }
  }

  ${metrics.map(m => {
    if (m.type === 'max_date') return `const val_${m.id} = latest_${m.id} > 0 ? new Date(latest_${m.id}).toLocaleDateString() : "";`;
    return '';
  }).join('\n  ')}

  return [
    {
      id: "${filename.replace('.ts', '')}_dataset",
      title: "${title}",
      subtitle: \`\${rows.length} record\${rows.length === 1 ? '' : 's'} analyzed in this dataset\`,
      displayMode: "table",
      kpis: [
        ${metrics.map(m => {
          let valExpr = '';
          if (m.type === 'total') valExpr = 'count';
          else if (m.type === 'sum') valExpr = `sum_${m.id}`;
          else if (m.type === 'avg') valExpr = `count_${m.id} > 0 ? sum_${m.id} / count_${m.id} : 0`;
          else if (m.type === 'count_cond') valExpr = `count_${m.id}`;
          else if (m.type === 'max_date') valExpr = `val_${m.id}`;
          else if (m.type === 'custom') valExpr = m.result;

          return `{
          columnKey: "${m.id}",
          label: "${m.label}",
          value: ${valExpr},
        },`;
        }).join('\n        ')}
      ],
    },
  ];
}
`;

  fs.writeFileSync(path.join(kpisDir, filename), content);
}

// 1. Overall Billing Summary
writeKpiFile('billing-records-kpis.ts', 'computeBillingRecordsKpis', 'Overall Billing Summary', [
  { id: 'total_utility_accounts', label: 'Total Utility Accounts', type: 'custom', init: 'const accts = new Set();', loop: 'if (r.utility_account_id) accts.add(r.utility_account_id);', result: 'accts.size' },
  { id: 'total_billing_records', label: 'Total Billing Records', type: 'total' },
  { id: 'total_monthly_electricity_bill', label: 'Total Monthly Electricity Bill (Rs)', type: 'sum', key: 'monthly_electricity_bill_rs' },
  { id: 'total_units_kwh', label: 'Total Units kWh', type: 'sum', key: 'units_kWh' },
  { id: 'total_units_kvah', label: 'Total Units kVAh', type: 'sum', key: 'units_kVAh' },
  { id: 'total_fixed_charges', label: 'Total Fixed Charges Rs', type: 'sum', key: 'fixed_charges_rs' },
  { id: 'total_energy_charges', label: 'Total Energy Charges Rs', type: 'sum', key: 'energy_charges_rs' },
  { id: 'total_taxes_rent', label: 'Total Taxes and Rent Rs', type: 'sum', key: 'taxes_and_rent_rs' },
  { id: 'total_other_charges', label: 'Total Other Charges Rs', type: 'sum', key: 'other_charges_rs' },
  { id: 'total_rebate', label: 'Total Rebate / Subsidy Rs', type: 'sum', key: 'rebate_subsidy_rs' },
  { id: 'avg_monthly_bill', label: 'Average Monthly Bill Rs', type: 'avg', key: 'monthly_electricity_bill_rs' },
  { id: 'avg_units_kwh', label: 'Average Units kWh', type: 'avg', key: 'units_kWh' },
  { id: 'avg_units_kvah', label: 'Average Units kVAh', type: 'avg', key: 'units_kVAh' },
  { id: 'avg_mdi', label: 'Average MDI kVA', type: 'avg', key: 'mdi_kVA' },
  { id: 'avg_pf', label: 'Average PF', type: 'avg', key: 'pf' },
  { id: 'latest_period_end', label: 'Latest Billing Period End', type: 'max_date', key: 'billing_period_end' },
  { id: 'grid_cost_kvah', label: 'Grid Cost per kVAh Rs', type: 'custom', init: '', loop: '', result: 'sum_total_units_kvah > 0 ? sum_total_monthly_electricity_bill / sum_total_units_kvah : 0' },
  { id: 'grid_cost_kwh', label: 'Grid Cost per kWh Rs', type: 'custom', init: '', loop: '', result: 'sum_total_units_kwh > 0 ? sum_total_monthly_electricity_bill / sum_total_units_kwh : 0' }
]);

// 2. Overall Solar Summary
writeKpiFile('solar-plants-kpis.ts', 'computeSolarPlantsKpis', 'Overall Solar Summary', [
  { id: 'total_plants', label: 'Total Plants', type: 'custom', init: 'const plants = new Set();', loop: 'if (r.solar_plant_id) plants.add(r.solar_plant_id); else if (r.rating_kWp || r.capacity_kwp) plants.add(r._id || Math.random());', result: 'plants.size' },
  { id: 'total_records', label: 'Total Records', type: 'total' },
  { id: 'total_import', label: 'Total Import (kWh)', type: 'sum', key: 'import_kWh' },
  { id: 'total_export', label: 'Total Export (kWh)', type: 'sum', key: 'export_kWh' },
  { id: 'total_net', label: 'Total Net (kWh)', type: 'sum', key: 'net_kWh' },
  { id: 'total_gen', label: 'Total Solar Generation (kWh)', type: 'sum', key: 'solar_generation_kWh' },
  { id: 'avg_gen_day', label: 'Average Generation / Day (kWh)', type: 'custom', init: 'let sum_gen = 0; let sum_days = 0;', loop: 'sum_gen += tryNum(r.solar_generation_kWh); sum_days += tryNum(r.billing_days);', result: 'sum_days > 0 ? sum_gen / sum_days : 0' },
  { id: 'avg_spec_gen', label: 'Average Specific Generation (kWh/kWp)', type: 'custom', init: 'let sum_spec_gen = 0; let sum_spec_gen_count = 0;', loop: 'if (r.solar_generation_kWh && r.rating_kWp) { sum_spec_gen += tryNum(r.solar_generation_kWh) / tryNum(r.rating_kWp); sum_spec_gen_count += 1; }', result: 'sum_spec_gen_count > 0 ? sum_spec_gen / sum_spec_gen_count : 0' }
], 'solar_generation_records');

// 3. DG Audit Summary
writeKpiFile('dg-sets-kpis.ts', 'computeDgSetsKpis', 'DG Audit Summary', [
  { id: 'total_dg_records', label: 'Total DG Audit Records', type: 'total' },
  { id: 'avg_measured_kw', label: 'Average Measured kW Output', type: 'avg', key: 'measured_kW_output' },
  { id: 'avg_measured_kva', label: 'Average Measured kVA Output', type: 'avg', key: 'measured_kVA_output' },
  { id: 'avg_pf', label: 'Average Power Factor', type: 'avg', key: 'power_factor' },
  { id: 'avg_dg_cost', label: 'Average DG Cost per kWh (Rs)', type: 'avg', key: 'dg_cost_per_kWh_rs' },
  { id: 'avg_grid_cost', label: 'Average Grid Cost per kWh (Rs)', type: 'avg', key: 'grid_cost_per_kWh_rs' },
  { id: 'avg_loading', label: 'Average Loading (%)', type: 'avg', key: 'average_loading_percent' },
  { id: 'avg_sfc', label: 'Average Specific Fuel Consumption (L/kWh)', type: 'avg', key: 'specific_fuel_consumption_l_per_kWh' },
  { id: 'avg_eff', label: 'Average Calculated Efficiency (%)', type: 'avg', key: 'calculated_efficiency_percent' },
  { id: 'latest_audit', label: 'Latest Audit Date', type: 'max_date', key: 'audit_date' }
], 'dg_audit_records');

// 4. Transformer Audit Summary
writeKpiFile('transformers-kpis.ts', 'computeTransformersKpis', 'Transformer Audit Summary', [
  { id: 'total_tx_records', label: 'Total Transformer Audit Records', type: 'total' },
  { id: 'total_energy_supplied', label: 'Total Annual Energy Supplied (kWh)', type: 'sum', key: 'annual_energy_supplied_kWh' },
  { id: 'total_energy_losses', label: 'Total Annual Energy Losses (kWh)', type: 'sum', key: 'annual_energy_losses_kWh' },
  { id: 'total_cost_losses', label: 'Total Cost of Losses (Rs)', type: 'sum', key: 'cost_of_losses_rs' },
  { id: 'avg_loading', label: 'Average Percent Loading (%)', type: 'avg', key: 'percent_loading' },
  { id: 'avg_pf_lt', label: 'Average Power Factor LT', type: 'avg', key: 'power_factor_LT' },
  { id: 'avg_load_factor', label: 'Average Load Factor (%)', type: 'avg', key: 'load_factor_percent' },
  { id: 'latest_audit', label: 'Latest Audit Date', type: 'max_date', key: 'audit_date' }
], 'transformer_audit_records');

// 5. Pump Audit Summary
writeKpiFile('pumps-kpis.ts', 'computePumpsKpis', 'Pump Audit Summary', [
  { id: 'total_pump_records', label: 'Total Pump Audit Records', type: 'total' },
  { id: 'total_daily_energy', label: 'Total Daily Energy Consumption (kWh)', type: 'sum', key: 'daily_energy_consumption_kWh' },
  { id: 'total_annual_energy', label: 'Total Annual Energy Consumption (kWh)', type: 'sum', key: 'annual_energy_consumption_kWh' },
  { id: 'avg_input_power', label: 'Average Input Power (kW)', type: 'avg', key: 'input_power_kW' },
  { id: 'avg_eff', label: 'Average Efficiency (%)', type: 'avg', key: 'overall_pump_set_efficiency_percent' },
  { id: 'avg_motor_loading', label: 'Average Motor Loading (%)', type: 'avg', key: 'motor_loading_percent' },
  { id: 'avg_specific_energy', label: 'Average Specific Energy (kWh/m3)', type: 'avg', key: 'specific_energy_consumption_kWh_per_m3' },
  { id: 'avg_actual_flow', label: 'Average Actual Flow (m3/hr)', type: 'avg', key: 'actual_flow_m3_per_hr' },
  { id: 'vfd_installed', label: 'Pumps with VFD Installed', type: 'count_cond', key: 'vfd_installed', cond: 'true' },
  { id: 'valve_throttling', label: 'Cases with Valve Throttling', type: 'count_cond', key: 'control_valve_throttling', cond: 'true' },
  { id: 'leakages', label: 'Cases with Leakages Observed', type: 'count_cond', key: 'leakages_observed', cond: 'true' },
  { id: 'latest_audit', label: 'Latest Audit Date', type: 'max_date', key: 'audit_date' }
], 'pump_audit_records');

// 6. HVAC Report Summary
writeKpiFile('hvac-audits-kpis.ts', 'computeHvacAuditsKpis', 'HVAC Report Summary', [
  { id: 'total_hvac_records', label: 'Total HVAC Records', type: 'total' },
  { id: 'avg_cooling_tr', label: 'Average Cooling Produced (TR)', type: 'avg', key: 'cooling_produced_tr' },
  { id: 'avg_chiller_kw', label: 'Average Chiller Power Used (kW)', type: 'avg', key: 'chiller_power_used_kw' },
  { id: 'avg_aux_kw', label: 'Average Total Auxiliary Power Used (kW)', type: 'avg', key: 'total_auxiliary_power_kw' },
  { id: 'avg_plant_kw', label: 'Average Total Plant Power (kW)', type: 'avg', key: 'total_plant_power_kw' },
  { id: 'avg_plant_eff', label: 'Average Plant Efficiency (kW/TR)', type: 'avg', key: 'plant_efficiency_kw_per_tr' },
  { id: 'avg_cop', label: 'Average Coefficient of Performance', type: 'avg', key: 'cop' },
  { id: 'latest_audit', label: 'Latest Audit Date', type: 'max_date', key: 'audit_date' }
]);

// 7. AC Audit Summary
writeKpiFile('ac-audit-records-kpis.ts', 'computeAcAuditRecordsKpis', 'AC Audit Summary', [
  { id: 'total_ac_records', label: 'Total AC Audit Records', type: 'total' },
  { id: 'total_conn_load', label: 'Total Connected Load (kW)', type: 'sum', key: 'connected_load_kW' },
  { id: 'total_annual_energy', label: 'Total Annual Energy Consumption (kWh)', type: 'sum', key: 'annual_energy_consumption_kWh' },
  { id: 'avg_specific_power', label: 'Average Specific Power (kW/TR)', type: 'avg', key: 'specific_power_kW_per_TR' }
]);

// 8. Fan Audit Summary
writeKpiFile('fan-audit-records-kpis.ts', 'computeFanAuditRecordsKpis', 'Fan Audit Summary', [
  { id: 'total_fan_records', label: 'Total Fan Audit Records', type: 'total' },
  { id: 'total_qty', label: 'Total Quantity (Nos)', type: 'sum', key: 'quantity_nos' },
  { id: 'total_conn_load', label: 'Total Connected Load (kW)', type: 'sum', key: 'connected_load_kW' },
  { id: 'total_annual_energy', label: 'Total Annual Energy Consumption (kWh)', type: 'sum', key: 'annual_energy_consumption_kWh' },
  { id: 'avg_rated_power', label: 'Average Rated Power (W)', type: 'avg', key: 'rated_power_W' },
  { id: 'avg_measured_power', label: 'Average Measured Power (W)', type: 'avg', key: 'measured_power_W' },
  { id: 'avg_loading', label: 'Average Loading Factor (%)', type: 'avg', key: 'loading_factor_percent' }
]);

// 9. Lighting Audit Summary
writeKpiFile('lighting-audits-kpis.ts', 'computeLightingAuditsKpis', 'Lighting Audit Summary', [
  { id: 'total_lighting_records', label: 'Total Lighting Audit Records', type: 'total' },
  { id: 'total_qty', label: 'Total Quantity (Nos)', type: 'sum', key: 'quantity_nos' },
  { id: 'total_conn_load', label: 'Total Connected Load (kW)', type: 'sum', key: 'connected_load_kW' },
  { id: 'total_annual_energy', label: 'Total Annual Energy (kWh)', type: 'sum', key: 'annual_energy_kWh' },
  { id: 'avg_wattage', label: 'Average Wattage (W)', type: 'avg', key: 'wattage_W' }
]);

// 10. Compliance Summary
writeKpiFile('lux-measurements-kpis.ts', 'computeLuxMeasurementsKpis', 'Compliance Summary', [
  { id: 'total_lux_records', label: 'Total Lux Measurement Records', type: 'total' },
  { id: 'compliant_count', label: 'Compliant Count', type: 'count_cond', key: 'compliance', cond: 'true' },
  { id: 'non_compliant_count', label: 'Non-Compliant Count', type: 'count_cond', key: 'compliance', cond: 'false' },
  { id: 'compliance_pct', label: 'Compliance Percentage (%)', type: 'custom', init: '', loop: '', result: 'count > 0 ? (count_compliant_count / count) * 100 : 0' },
  { id: 'avg_required_lux', label: 'Average Required Lux', type: 'avg', key: 'required_lux' },
  { id: 'avg_measured_lux', label: 'Average Measured Lux', type: 'avg', key: 'average_lux' },
  { id: 'avg_lux_gap', label: 'Average Lux Gap', type: 'custom', init: 'let sum_lux_gap = 0; let count_lux_gap = 0;', loop: 'const avgL = Number(r.average_lux); const reqL = Number(r.required_lux); if (!Number.isNaN(avgL) && !Number.isNaN(reqL)) { sum_lux_gap += (avgL - reqL); count_lux_gap += 1; }', result: 'count_lux_gap > 0 ? sum_lux_gap / count_lux_gap : 0' },
  { id: 'latest_audit', label: 'Latest Audit Date', type: 'max_date', key: 'audit_date' }
]);

// 11. Summary (misc_load)
writeKpiFile('misc-load-audits-kpis.ts', 'computeMiscLoadAuditsKpis', 'Summary', [
  { id: 'total_records', label: 'Total Records', type: 'total' },
  { id: 'total_qty', label: 'Total Quantity', type: 'sum', key: 'quantity' },
  { id: 'total_conn_load', label: 'Total Connected Load (kW)', type: 'custom', init: 'let tcl = 0;', loop: 'tcl += tryNum(r.rated_power_kW) * tryNum(r.quantity);', result: 'tcl' },
  { id: 'total_annual_energy', label: 'Total Annual Energy (kWh)', type: 'sum', key: 'estimated_annual_energy_kWh' },
  { id: 'energy_per_kw', label: 'Energy per kW', type: 'custom', init: '', loop: '', result: 'tcl > 0 ? sum_total_annual_energy / tcl : 0' }
]);

// 12. Utility Accounts Summary
writeKpiFile('utility-accounts-kpis.ts', 'computeUtilityAccountsKpis', 'Utility Accounts Summary', [
  { id: 'total_accounts', label: 'Total Utility Accounts', type: 'total' },
  { id: 'total_sanctioned_demand', label: 'Total Sanctioned Demand (kVA)', type: 'sum', key: 'sanctioned_demand_kVA' },
  { id: 'active_accounts', label: 'Active Accounts', type: 'count_cond', key: 'is_active', cond: 'true' },
  { id: 'solar_connected', label: 'Solar Connected', type: 'count_cond', key: 'is_solar_connected', cond: 'true' },
  { id: 'dg_connected', label: 'DG Connected', type: 'count_cond', key: 'is_dg_connected', cond: 'true' },
  { id: 'transformer_connected', label: 'Transformer Connected', type: 'count_cond', key: 'is_transformer_connected', cond: 'true' },
  { id: 'pump_connected', label: 'Pump Connected', type: 'count_cond', key: 'is_pump_connected', cond: 'true' }
]);

console.log('All KPI files updated successfully.');
