import { EnergyKpiSection } from "../../audit-snapshot-kpi-summary";
import { isPlainObject } from "../../../shared/audit-snapshot-table-utils";

export function computeTariffsKpis(rows: unknown[], columns: string[]): EnergyKpiSection[] {
  let currentTariffs = 0;
  let historicalTariffs = 0;

  let currentEnergyChargesSum = 0;
  let currentEnergyChargesCount = 0;

  let currentFixedChargesSum = 0;
  let currentFixedChargesCount = 0;

  for (const row of rows) {
    if (!isPlainObject(row)) continue;
    
    const effectiveTo = row["effective_to"];
    const isCurrent = effectiveTo === null || effectiveTo === undefined || effectiveTo === "";

    if (isCurrent) {
      currentTariffs += 1;

      const energyCharge = Number(row["basic_energy_charges_rs_per_unit"]);
      if (!Number.isNaN(energyCharge) && row["basic_energy_charges_rs_per_unit"] !== null && row["basic_energy_charges_rs_per_unit"] !== undefined) {
        currentEnergyChargesSum += energyCharge;
        currentEnergyChargesCount += 1;
      }

      const fixedCharge = Number(row["fixed_charges_rs_per_kW_or_per_kVA"]);
      if (!Number.isNaN(fixedCharge) && row["fixed_charges_rs_per_kW_or_per_kVA"] !== null && row["fixed_charges_rs_per_kW_or_per_kVA"] !== undefined) {
        currentFixedChargesSum += fixedCharge;
        currentFixedChargesCount += 1;
      }
    } else {
      historicalTariffs += 1;
    }
  }

  const avgEnergyCharges = currentEnergyChargesCount > 0 ? currentEnergyChargesSum / currentEnergyChargesCount : 0;
  const avgFixedCharges = currentFixedChargesCount > 0 ? currentFixedChargesSum / currentFixedChargesCount : 0;

  return [
    {
      id: "tariffs_dataset",
      title: "Utility Tariff KPI Summary",
      subtitle: `${rows.length} record${rows.length === 1 ? '' : 's'} analyzed in this dataset`,
      displayMode: "table",
      kpis: [
        {
          columnKey: "total_tariffs",
          label: "Total Tariffs",
          mode: "value",
          count: rows.length,
          sum: 0,
          average: 0,
          value: rows.length,
        },
        {
          columnKey: "current_tariffs",
          label: "Current Tariffs",
          mode: "value",
          count: rows.length,
          sum: 0,
          average: 0,
          value: currentTariffs,
        },
        {
          columnKey: "historical_tariffs",
          label: "Historical Tariffs",
          mode: "value",
          count: rows.length,
          sum: 0,
          average: 0,
          value: historicalTariffs,
        },
        {
          columnKey: "avg_current_energy_charges",
          label: "Average Current Energy Charges (Rs/Unit)",
          mode: "value",
          count: currentEnergyChargesCount,
          sum: 0,
          average: 0,
          value: avgEnergyCharges,
        },
        {
          columnKey: "avg_current_fixed_charges",
          label: "Average Current Fixed Charges (Rs/kW or kVA)",
          mode: "value",
          count: currentFixedChargesCount,
          sum: 0,
          average: 0,
          value: avgFixedCharges,
        }
      ],
    },
  ];
}
