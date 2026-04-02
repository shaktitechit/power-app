type UtilityBillingRecord = {
  _id?: string;
  utility_account_id:
    | string
    | {
        _id: string;
        account_number?: string;
        facility_id?: string;
      };
  billing_period_start: string;
  billing_period_end: string;
  billing_days?: number;
  bill_no?: string;
  mdi_kVA?: number;
  units_kWh?: number;
  units_kVAh?: number;
  pf?: number;
  fixed_charges_rs?: number;
  energy_charges_rs?: number;
  taxes_and_rent_rs?: number;
  other_charges_rs?: number;
  monthly_electricity_bill_rs?: number;
  unit_consumption_per_day_kVAh?: number;
  average_per_unit_cost_rs?: number;
  audit_date?: string;
};

type GridCostSummary = {
  totalBillAmount: number;
  totalKVAH: number;
  gridCostPerKVAH: number;
  recordCount: number;
  fromDate: string | null;
  toDate: string | null;
};

export const calculateGridCostPerKVAHForOneYear = (
  records: UtilityBillingRecord[]
): GridCostSummary => {
  if (!records || records.length === 0) {
    return {
      totalBillAmount: 0,
      totalKVAH: 0,
      gridCostPerKVAH: 0,
      recordCount: 0,
      fromDate: null,
      toDate: null,
    };
  }

  // sort ascending by billing period start
  const sortedRecords = [...records].sort(
    (a, b) =>
      new Date(a.billing_period_start).getTime() -
      new Date(b.billing_period_start).getTime()
  );

  // take only latest 1 year window from the newest record
  const latestRecordDate = new Date(
    sortedRecords[sortedRecords.length - 1].billing_period_end
  );

  const oneYearAgo = new Date(latestRecordDate);
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const oneYearRecords = sortedRecords.filter((record) => {
    const recordEnd = new Date(record.billing_period_end);
    return recordEnd >= oneYearAgo && recordEnd <= latestRecordDate;
  });

  const totalBillAmount = oneYearRecords.reduce(
    (sum, record) => sum + Number(record.monthly_electricity_bill_rs || 0),
    0
  );

  const totalKVAH = oneYearRecords.reduce(
    (sum, record) => sum + Number(record.units_kVAh || 0),
    0
  );

  const gridCostPerKVAH =
    totalKVAH > 0 ? Number((totalBillAmount / totalKVAH).toFixed(2)) : 0;

  return {
    totalBillAmount: Number(totalBillAmount.toFixed(2)),
    totalKVAH: Number(totalKVAH.toFixed(2)),
    gridCostPerKVAH,
    recordCount: oneYearRecords.length,
    fromDate:
      oneYearRecords.length > 0 ? oneYearRecords[0].billing_period_start : null,
    toDate:
      oneYearRecords.length > 0
        ? oneYearRecords[oneYearRecords.length - 1].billing_period_end
        : null,
  };
};