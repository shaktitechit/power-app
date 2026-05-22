import mongoose from "mongoose";
import DGAuditRecord from "../../../../../modals/electrical-audit/dgAuditRecord.js";
import DGSet from "../../../../../modals/electrical-audit/dgSet.js";
import UtilityAccount from "../../../../../modals/utilityAccount.js";

const normalizeText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const isValidObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(String(value));

const getId = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const cleaned = value.trim();
    if (!cleaned || cleaned === "[object Object]") return "";
    return cleaned;
  }

  if (value instanceof mongoose.Types.ObjectId) {
    return String(value);
  }

  if (value?._id) {
    return getId(value._id);
  }

  if (value?.id) {
    return getId(value.id);
  }

  if (typeof value?.toString === "function") {
    const str = String(value.toString()).trim();
    if (str && str !== "[object Object]") return str;
  }

  return "";
};

const buildDGSetMap = (dgSets = []) =>
  new Map(
    dgSets
      .filter(Boolean)
      .map((item) => [getId(item), item])
      .filter(([id]) => Boolean(id)),
  );

const buildUtilityAccountNumberMap = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((id) => getId(id)).filter(Boolean))];
  const validIds = uniqueIds.filter((id) => isValidObjectId(id));
  if (!validIds.length) return new Map();

  const accounts = await UtilityAccount.find({
    _id: { $in: validIds.map((id) => new mongoose.Types.ObjectId(id)) },
  })
    .select("account_number")
    .lean();

  return new Map(
    (accounts || []).map((account) => [
      getId(account),
      normalizeText(account.account_number),
    ]),
  );
};

const normalizeDGSetMini = (dgSet, utilityAccountMap = new Map()) => {
  if (!dgSet) return null;
  const utilityAccountId = getId(dgSet.utility_account_id);

  return {
    id: getId(dgSet),
    _id: getId(dgSet),
    dg_number: normalizeText(dgSet.dg_number),
    make_model: normalizeText(dgSet.make_model),
    rated_capacity_kVA: normalizeNumber(dgSet.rated_capacity_kVA),
    rated_active_power_kW: normalizeNumber(dgSet.rated_active_power_kW),
    rated_voltage_V: normalizeNumber(dgSet.rated_voltage_V),
    rated_speed_RPM: normalizeNumber(dgSet.rated_speed_RPM),
    fuel_type: normalizeText(dgSet.fuel_type),
    year_of_installation: normalizeNumber(dgSet.year_of_installation),
    utility_account_id: utilityAccountId,
    utility_account_number:
      utilityAccountMap.get(utilityAccountId) ||
      normalizeText(dgSet?.utility_account_id?.account_number),
    facility_id: getId(dgSet.facility_id),
    audit_date: dgSet.audit_date || null,
    auditor_id: getId(dgSet.auditor_id),
    documents: Array.isArray(dgSet.documents) ? dgSet.documents : [],
    created_at: dgSet.created_at || dgSet.createdAt || null,
    updated_at: dgSet.updated_at || dgSet.updatedAt || null,
  };
};

const fetchFacilityDGSets = async (facilityId, utilityAccountId = null) => {
  const resolvedFacilityId = getId(facilityId);
  const resolvedUtilityAccountId = getId(utilityAccountId);

  if (!resolvedFacilityId || !isValidObjectId(resolvedFacilityId)) return [];

  const query = {
    facility_id: new mongoose.Types.ObjectId(resolvedFacilityId),
  };

  if (resolvedUtilityAccountId && isValidObjectId(resolvedUtilityAccountId)) {
    query.utility_account_id = new mongoose.Types.ObjectId(
      resolvedUtilityAccountId,
    );
  }

  const dgSets = await DGSet.find(query)
    .sort({ created_at: 1, createdAt: 1 })
    .lean();

  return Array.isArray(dgSets) ? dgSets : [];
};

const calculateAverageLoadingPercent = (record, dgSet) => {
  const maxLoad = normalizeNumber(record?.max_load_observed_kW);
  const minLoad = normalizeNumber(record?.min_load_observed_kW);

  if (maxLoad !== null && minLoad !== null) {
    return Number(((maxLoad + minLoad) / 2).toFixed(2));
  }

  const existing = normalizeNumber(record?.average_loading_percent);
  if (existing !== null) return existing;

  const measuredKVA = normalizeNumber(record?.measured_kVA_output);
  const ratedKVA =
    normalizeNumber(record?.rated_capacity_kVA) ??
    normalizeNumber(dgSet?.rated_capacity_kVA);

  if (measuredKVA !== null && ratedKVA !== null && ratedKVA > 0) {
    return Number(((measuredKVA / ratedKVA) * 100).toFixed(2));
  }

  return null;
};

const calculateUnitsGeneratedPerHour = (record) => {
  const existing = normalizeNumber(record?.units_generated_per_hour_kWh);
  if (existing !== null) return existing;

  const annualUnits = normalizeNumber(record?.units_generated_per_year_kWh);
  const annualHours = normalizeNumber(record?.total_working_hours_per_year);

  if (annualUnits !== null && annualHours !== null && annualHours > 0) {
    return Number((annualUnits / annualHours).toFixed(2));
  }

  return null;
};

const calculateFuelConsumptionPerHour = (record) => {
  const existing = normalizeNumber(record?.fuel_consumption_per_hour_liters);
  if (existing !== null) return existing;

  const annualFuel = normalizeNumber(record?.annual_fuel_consumption_liters);
  const annualHours = normalizeNumber(record?.total_working_hours_per_year);

  if (annualFuel !== null && annualHours !== null && annualHours > 0) {
    return Number((annualFuel / annualHours).toFixed(2));
  }

  return null;
};

const calculateSpecificFuelConsumption = (record) => {
  const existing = normalizeNumber(record?.specific_fuel_consumption_l_per_kWh);
  if (existing !== null) return existing;

  const annualFuel = normalizeNumber(record?.annual_fuel_consumption_liters);
  const annualUnits = normalizeNumber(record?.units_generated_per_year_kWh);

  if (annualFuel !== null && annualUnits !== null && annualUnits > 0) {
    return Number((annualFuel / annualUnits).toFixed(4));
  }

  return null;
};

const calculateTestUnitsPerHour = (record) => {
  const existing = normalizeNumber(record?.units_generated_per_hour_kWh_during_test);
  if (existing !== null) return existing;

  const unitsDuringTest = normalizeNumber(record?.units_generated_during_test_kWh);
  const duration = normalizeNumber(record?.time_duration_of_the_test_hours);

  if (unitsDuringTest !== null && duration !== null && duration > 0) {
    return Number((unitsDuringTest / duration).toFixed(2));
  }

  return null;
};

const calculateTestFuelPerHour = (record) => {
  const existing = normalizeNumber(record?.fuel_consumption_per_hour_liters_during_test);
  if (existing !== null) return existing;

  const fuelDuringTest = normalizeNumber(record?.fuel_consumption_during_test_lph);
  const duration = normalizeNumber(record?.time_duration_of_the_test_hours);

  if (fuelDuringTest !== null && duration !== null && duration > 0) {
    return Number((fuelDuringTest / duration).toFixed(2));
  }

  return null;
};

const calculateTestSpecificFuelConsumption = (record) => {
  const existing = normalizeNumber(record?.specific_fuel_consumption_l_per_kWh_during_test);
  if (existing !== null) return existing;

  const fuelDuringTest = normalizeNumber(record?.fuel_consumption_during_test_lph);
  const unitsDuringTest = normalizeNumber(record?.units_generated_during_test_kWh);

  if (fuelDuringTest !== null && unitsDuringTest !== null && unitsDuringTest > 0) {
    return Number((fuelDuringTest / unitsDuringTest).toFixed(4));
  }

  return null;
};

const calculateSfcDeviation = (record) => {
  const existing = normalizeNumber(record?.sfc_deviation_percent);
  if (existing !== null) return existing;

  const sfc = normalizeNumber(record?.specific_fuel_consumption_l_per_kWh) ??
              calculateSpecificFuelConsumption(record);
  const mfgSfc = normalizeNumber(record?.manufacturer_sfc_l_per_kWh);

  if (sfc !== null && mfgSfc !== null && mfgSfc > 0) {
    return Number((((sfc - mfgSfc) / mfgSfc) * 100).toFixed(2));
  }

  return null;
};

const calculateTestSfcDeviation = (record) => {
  const existing = normalizeNumber(record?.sfc_deviation_percent_during_test);
  if (existing !== null) return existing;

  const testSfc = normalizeNumber(record?.specific_fuel_consumption_l_per_kWh_during_test) ??
                  calculateTestSpecificFuelConsumption(record);
  const mfgSfc = normalizeNumber(record?.manufacturer_sfc_l_per_kWh);

  if (testSfc !== null && mfgSfc !== null && mfgSfc > 0) {
    return Number((((testSfc - mfgSfc) / mfgSfc) * 100).toFixed(2));
  }

  return null;
};

const calculateAnnualFuelCost = (record) => {
  const existing = normalizeNumber(record?.annual_fuel_cost_rs);
  if (existing !== null) return existing;

  const annualFuel = normalizeNumber(record?.annual_fuel_consumption_liters);
  const fuelRate = normalizeNumber(record?.fuel_cost_rs_per_liter);

  if (annualFuel !== null && fuelRate !== null) {
    return Number((annualFuel * fuelRate).toFixed(2));
  }

  return null;
};

const calculateDGCostPerKWh = (record) => {
  const existing = normalizeNumber(record?.dg_cost_per_kWh_rs);
  if (existing !== null) return existing;

  const annualFuelCost =
    normalizeNumber(record?.annual_fuel_cost_rs) ??
    calculateAnnualFuelCost(record);
  const annualUnits = normalizeNumber(record?.units_generated_per_year_kWh);

  if (annualFuelCost !== null && annualUnits !== null && annualUnits > 0) {
    return Number((annualFuelCost / annualUnits).toFixed(4));
  }

  return null;
};

const calculateCostDifference = (record) => {
  const dgCost =
    normalizeNumber(record?.dg_cost_per_kWh_rs) ??
    calculateDGCostPerKWh(record);
  const gridCost = normalizeNumber(record?.grid_cost_per_kWh_rs);

  if (dgCost !== null && gridCost !== null) {
    return Number((dgCost - gridCost).toFixed(2));
  }

  return null;
};

const normalizeDGAuditRecord = (row, index, dgSetMap, utilityAccountMap) => {
  const linkedDGSetId = getId(row?.dg_set_id);
  const linkedDGSetRaw = dgSetMap.get(linkedDGSetId) || row?.dg_set_id || null;
  const dgSet = normalizeDGSetMini(linkedDGSetRaw, utilityAccountMap);

  const annualFuelCost = calculateAnnualFuelCost(row);
  const dgCostPerKWh = calculateDGCostPerKWh(row);
  const averageLoadingPercent = calculateAverageLoadingPercent(row, dgSet);
  const unitsGeneratedPerHour = calculateUnitsGeneratedPerHour(row);
  const fuelConsumptionPerHour = calculateFuelConsumptionPerHour(row);
  const specificFuelConsumption = calculateSpecificFuelConsumption({
    ...row,
    units_generated_per_hour_kWh: unitsGeneratedPerHour,
    fuel_consumption_per_hour_liters: fuelConsumptionPerHour,
  });
  const costDifference = calculateCostDifference({
    ...row,
    dg_cost_per_kWh_rs: dgCostPerKWh,
  });

  const unitsGeneratedPerHourDuringTest = calculateTestUnitsPerHour(row);
  const fuelConsumptionPerHourDuringTest = calculateTestFuelPerHour(row);
  const specificFuelConsumptionDuringTest = calculateTestSpecificFuelConsumption(row);
  const sfcDeviationPercentDuringTest = calculateTestSfcDeviation({
    ...row,
    specific_fuel_consumption_l_per_kWh_during_test: specificFuelConsumptionDuringTest,
  });
  const sfcDeviationPercent = calculateSfcDeviation({
    ...row,
    specific_fuel_consumption_l_per_kWh: specificFuelConsumption,
  });

  return {
    id: getId(row),
    _id: getId(row),
    sr_no: index + 1,

    dg_set_id: linkedDGSetId,
    dg_set: dgSet,

    audit_date: row?.audit_date || null,
    audit_date_label: formatDate(row?.audit_date),

    dg_name: dgSet?.dg_number || "",
    utility_account_number: dgSet?.utility_account_number || "",
    dg_make_model: dgSet?.make_model || "",
    rated_capacity_kVA: dgSet?.rated_capacity_kVA ?? null,
    rated_active_power_kW: dgSet?.rated_active_power_kW ?? null,
    rated_voltage_V: dgSet?.rated_voltage_V ?? null,
    rated_speed_RPM: dgSet?.rated_speed_RPM ?? null,
    fuel_type: dgSet?.fuel_type || "",
    year_of_installation: dgSet?.year_of_installation ?? null,

    measured_voltage_LL: normalizeNumber(row?.measured_voltage_LL),
    measured_current_avg: normalizeNumber(row?.measured_current_avg),
    measured_kW_output: normalizeNumber(row?.measured_kW_output),
    measured_kVA_output: normalizeNumber(row?.measured_kVA_output),
    power_factor: normalizeNumber(row?.power_factor),
    frequency_Hz: normalizeNumber(row?.frequency_Hz),

    max_load_observed_kW: normalizeNumber(row?.max_load_observed_kW),
    min_load_observed_kW: normalizeNumber(row?.min_load_observed_kW),
    average_loading_percent: averageLoadingPercent,
    load_factor_percent: normalizeNumber(row?.load_factor_percent),

    idle_running_observed: row?.idle_running_observed ?? null,
    parallel_operation: row?.parallel_operation ?? null,

    annual_fuel_consumption_liters: normalizeNumber(
      row?.annual_fuel_consumption_liters,
    ),
    units_generated_per_year_kWh: normalizeNumber(
      row?.units_generated_per_year_kWh,
    ),
    total_working_hours_per_year: normalizeNumber(
      row?.total_working_hours_per_year,
    ),
    units_generated_per_hour_kWh: unitsGeneratedPerHour,
    fuel_consumption_per_hour_liters: fuelConsumptionPerHour,

    fuel_consumption_during_test_lph: normalizeNumber(
      row?.fuel_consumption_during_test_lph,
    ),
    units_generated_during_test_kWh: normalizeNumber(
      row?.units_generated_during_test_kWh,
    ),

    time_duration_of_the_test_hours: normalizeNumber(
      row?.time_duration_of_the_test_hours,
    ),
    units_generated_per_hour_kWh_during_test: unitsGeneratedPerHourDuringTest,
    fuel_consumption_per_hour_liters_during_test: fuelConsumptionPerHourDuringTest,
    specific_fuel_consumption_l_per_kWh_during_test: specificFuelConsumptionDuringTest,
    sfc_deviation_percent_during_test: sfcDeviationPercentDuringTest,

    specific_fuel_consumption_l_per_kWh: specificFuelConsumption,
    manufacturer_sfc_l_per_kWh: normalizeNumber(
      row?.manufacturer_sfc_l_per_kWh,
    ),
    sfc_deviation_percent: sfcDeviationPercent,

    fuel_cost_rs_per_liter: normalizeNumber(row?.fuel_cost_rs_per_liter),
    annual_fuel_cost_rs: annualFuelCost,
    dg_cost_per_kWh_rs: dgCostPerKWh,
    grid_cost_per_kWh_rs: normalizeNumber(row?.grid_cost_per_kWh_rs),
    cost_difference_rs_per_kWh: costDifference,

    calculated_efficiency_percent: normalizeNumber(
      row?.calculated_efficiency_percent,
    ),
    manufacturer_efficiency_percent: normalizeNumber(
      row?.manufacturer_efficiency_percent,
    ),
    efficiency_deviation_percent: normalizeNumber(
      row?.efficiency_deviation_percent,
    ),

    exhaust_temperature_C: normalizeNumber(row?.exhaust_temperature_C),
    cooling_water_temperature_C: normalizeNumber(
      row?.cooling_water_temperature_C,
    ),
    lube_oil_pressure_bar: normalizeNumber(row?.lube_oil_pressure_bar),
    lube_oil_consumption_liters_per_year: normalizeNumber(
      row?.lube_oil_consumption_liters_per_year,
    ),

    total_operating_hours: normalizeNumber(row?.total_operating_hours),
    hours_since_last_overhaul: normalizeNumber(row?.hours_since_last_overhaul),

    air_fuel_filter_condition: normalizeText(row?.air_fuel_filter_condition),
    visible_smoke_or_abnormal_vibration:
      row?.visible_smoke_or_abnormal_vibration ?? null,

    created_at: row?.created_at || row?.createdAt || null,
    updated_at: row?.updated_at || row?.updatedAt || null,
  };
};

const buildSummary = (items = []) => {
  const avg = (key, decimals = 2) => {
    const valid = items
      .map((item) => normalizeNumber(item[key]))
      .filter((value) => value !== null);

    if (!valid.length) return null;

    const sum = valid.reduce((acc, value) => acc + value, 0);
    return Number((sum / valid.length).toFixed(decimals));
  };

  const latestAuditDate =
    items
      .map((item) => item.audit_date)
      .filter(Boolean)
      .sort((a, b) => new Date(b) - new Date(a))[0] || null;

  return {
    total_dg_audit_records: items.length,
    average_measured_kW_output: avg("measured_kW_output"),
    average_measured_kVA_output: avg("measured_kVA_output"),
    average_power_factor: avg("power_factor", 4),
    average_dg_cost_per_kWh_rs: avg("dg_cost_per_kWh_rs", 4),
    average_grid_cost_per_kWh_rs: avg("grid_cost_per_kWh_rs", 4),
    average_loading_percent: avg("average_loading_percent"),
    average_specific_fuel_consumption_l_per_kWh: avg(
      "specific_fuel_consumption_l_per_kWh",
      4,
    ),
    average_efficiency_percent: avg("calculated_efficiency_percent"),
    latest_audit_date: latestAuditDate,
    latest_audit_date_label: formatDate(latestAuditDate),
  };
};

const groupItemsByUtilityAccount = (items = []) => {
  const groups = new Map();

  items.forEach((item) => {
    const accountId = getId(item?.dg_set?.utility_account_id) || "unknown";
    const accountNumber =
      normalizeText(item?.utility_account_number) || "Unknown Account";

    if (!groups.has(accountId)) {
      groups.set(accountId, {
        utility_account_id: accountId,
        utility_account_number: accountNumber,
        items: [],
      });
    }

    groups.get(accountId).items.push(item);
  });

  return Array.from(groups.values());
};

const buildAccountWiseSections = (items = [], overallSummary) => {
  const accountGroups = groupItemsByUtilityAccount(items);
  const sections = [];

  accountGroups.forEach((group) => {
    const groupSummary = buildSummary(group.items);
    const titlePrefix = `${group.utility_account_number}`;

    sections.push({
      heading: `${titlePrefix} - DG Basic Details`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "utility_account_number",
        "dg_make_model",
        "fuel_type",
        "rated_capacity_kVA",
        "rated_active_power_kW",
        { key: "year_of_installation", label: "Year Of Installation", type: "integer" },
        "audit_date_label",
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        utility_account_number: item.utility_account_number || "",
        dg_make_model: item.dg_make_model,
        fuel_type: item.fuel_type,
        rated_capacity_kVA: item.rated_capacity_kVA ?? null,
        rated_active_power_kW: item.rated_active_power_kW ?? null,
        year_of_installation: item.year_of_installation ?? null,
        audit_date_label: item.audit_date_label,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Electrical Measurements`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "measured_voltage_LL",
        "measured_current_avg",
        "frequency_Hz",
        "measured_kW_output",
        "measured_kVA_output",
        { key: "power_factor", label: "Power Factor", decimals: 4 },
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        measured_voltage_LL: item.measured_voltage_LL ?? null,
        measured_current_avg: item.measured_current_avg ?? null,
        frequency_Hz: item.frequency_Hz ?? null,
        measured_kW_output: item.measured_kW_output ?? null,
        measured_kVA_output: item.measured_kVA_output ?? null,
        power_factor: item.power_factor ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Load Analysis`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "max_load_observed_kW",
        "min_load_observed_kW",
        "average_loading_percent",
        "load_factor_percent",
        "idle_running_observed",
        "parallel_operation",
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        max_load_observed_kW: item.max_load_observed_kW ?? null,
        min_load_observed_kW: item.min_load_observed_kW ?? null,
        average_loading_percent: item.average_loading_percent ?? null,
        load_factor_percent: item.load_factor_percent ?? null,
        idle_running_observed:
          item.idle_running_observed === null
            ? ""
            : item.idle_running_observed
              ? "Yes"
              : "No",
        parallel_operation:
          item.parallel_operation === null
            ? ""
            : item.parallel_operation
              ? "Yes"
              : "No",
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Fuel & Generation (Facility Records)`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        { key: "annual_fuel_consumption_liters", label: "Annual Fuel Consumption (Liters)", type: "number" },
        { key: "units_generated_per_year_kWh", label: "Units Generated Per Year (kWh)", type: "number" },
        { key: "total_working_hours_per_year", label: "Total Working Hours Per Year", type: "number" },
        { key: "fuel_consumption_per_hour_liters", label: "Fuel Consumption Per Hour (Liters)", decimals: 2 },
        { key: "units_generated_per_hour_kWh", label: "Units Generated Per Hour (kWh)", decimals: 2 },
        { key: "specific_fuel_consumption_l_per_kWh", label: "Specific Fuel Consumption (L/kWh)", decimals: 4 },
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        annual_fuel_consumption_liters: item.annual_fuel_consumption_liters ?? null,
        units_generated_per_year_kWh: item.units_generated_per_year_kWh ?? null,
        total_working_hours_per_year: item.total_working_hours_per_year ?? null,
        fuel_consumption_per_hour_liters: item.fuel_consumption_per_hour_liters ?? null,
        units_generated_per_hour_kWh: item.units_generated_per_hour_kWh ?? null,
        specific_fuel_consumption_l_per_kWh: item.specific_fuel_consumption_l_per_kWh ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Fuel & Generation (Measurements)`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        { key: "units_generated_during_test_kWh", label: "Units Generated During Test (kWh)", type: "number" },
        { key: "fuel_consumption_during_test_lph", label: "Fuel Consumption During Test (Liters)", type: "number" },
        { key: "time_duration_of_the_test_hours", label: "Time Duration of the Test (Hours)", type: "number" },
        { key: "units_generated_per_hour_kWh_during_test", label: "Units Generated Per Hour During Test (kWh)", decimals: 2 },
        { key: "fuel_consumption_per_hour_liters_during_test", label: "Fuel Consumption Per Hour During Test (Liters)", decimals: 2 },
        { key: "specific_fuel_consumption_l_per_kWh_during_test", label: "Specific Fuel Consumption During Test (L/kWh)", decimals: 4 },
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        units_generated_during_test_kWh: item.units_generated_during_test_kWh ?? null,
        fuel_consumption_during_test_lph: item.fuel_consumption_during_test_lph ?? null,
        time_duration_of_the_test_hours: item.time_duration_of_the_test_hours ?? null,
        units_generated_per_hour_kWh_during_test: item.units_generated_per_hour_kWh_during_test ?? null,
        fuel_consumption_per_hour_liters_during_test: item.fuel_consumption_per_hour_liters_during_test ?? null,
        specific_fuel_consumption_l_per_kWh_during_test: item.specific_fuel_consumption_l_per_kWh_during_test ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Fuel & Generation (SFC Deviation (%))`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        { key: "manufacturer_sfc_l_per_kWh", label: "Manufacturer SFC (L/kWh)", decimals: 4 },
        { key: "sfc_deviation_percent", label: "SFC Deviation (Facility Records) (%)", decimals: 2 },
        { key: "sfc_deviation_percent_during_test", label: "SFC Deviation During Test (%)", decimals: 2 },
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        manufacturer_sfc_l_per_kWh: item.manufacturer_sfc_l_per_kWh ?? null,
        sfc_deviation_percent: item.sfc_deviation_percent ?? null,
        sfc_deviation_percent_during_test: item.sfc_deviation_percent_during_test ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Cost Analysis`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "fuel_cost_rs_per_liter",
        "annual_fuel_cost_rs",
        { key: "dg_cost_per_kWh_rs", label: "DG Cost Per KWh Rs", decimals: 4 },
        { key: "grid_cost_per_kWh_rs", label: "Grid Cost Per KWh Rs", decimals: 4 },
        "cost_difference_rs_per_kWh",
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        fuel_cost_rs_per_liter: item.fuel_cost_rs_per_liter ?? null,
        annual_fuel_cost_rs: item.annual_fuel_cost_rs ?? null,
        dg_cost_per_kWh_rs: item.dg_cost_per_kWh_rs ?? null,
        grid_cost_per_kWh_rs: item.grid_cost_per_kWh_rs ?? null,
        cost_difference_rs_per_kWh: item.cost_difference_rs_per_kWh ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Efficiency & Operating Conditions`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "calculated_efficiency_percent",
        "manufacturer_efficiency_percent",
        "efficiency_deviation_percent",
        "exhaust_temperature_C",
        "cooling_water_temperature_C",
        "lube_oil_pressure_bar",
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        calculated_efficiency_percent: item.calculated_efficiency_percent ?? null,
        manufacturer_efficiency_percent: item.manufacturer_efficiency_percent ?? null,
        efficiency_deviation_percent: item.efficiency_deviation_percent ?? null,
        exhaust_temperature_C: item.exhaust_temperature_C ?? null,
        cooling_water_temperature_C: item.cooling_water_temperature_C ?? null,
        lube_oil_pressure_bar: item.lube_oil_pressure_bar ?? null,
      })),
    });

    sections.push({
      heading: `${titlePrefix} - Maintenance & Condition`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "dg_name",
        "total_operating_hours",
        "hours_since_last_overhaul",
        "air_fuel_filter_condition",
        "visible_smoke_or_abnormal_vibration",
      ],
      rows: group.items.map((item, idx) => ({
        sr_no: idx + 1,
        dg_name: item.dg_name,
        total_operating_hours: item.total_operating_hours ?? null,
        hours_since_last_overhaul: item.hours_since_last_overhaul ?? null,
        air_fuel_filter_condition: item.air_fuel_filter_condition,
        visible_smoke_or_abnormal_vibration:
          item.visible_smoke_or_abnormal_vibration === null
            ? ""
            : item.visible_smoke_or_abnormal_vibration
              ? "Yes"
              : "No",
      })),
    });

    sections.push({
      heading: `${titlePrefix} - DG Audit Summary`,
      columns: ["metric", "value"],
      rows: [
        { metric: "Total DG Audit Records", value: groupSummary.total_dg_audit_records ?? "" },
        { metric: "Average Measured kW Output", value: groupSummary.average_measured_kW_output ?? "" },
        { metric: "Average Measured kVA Output", value: groupSummary.average_measured_kVA_output ?? "" },
        { metric: "Average Power Factor", value: groupSummary.average_power_factor ?? "" },
        { metric: "Average DG Cost per kWh (Rs)", value: groupSummary.average_dg_cost_per_kWh_rs ?? "" },
        { metric: "Average Grid Cost per kWh (Rs)", value: groupSummary.average_grid_cost_per_kWh_rs ?? "" },
        { metric: "Average Loading (kW)", value: groupSummary.average_loading_percent ?? "" },
        {
          metric: "Average Specific Fuel Consumption (L/kWh)",
          value: groupSummary.average_specific_fuel_consumption_l_per_kWh ?? "",
        },
        { metric: "Average Calculated Efficiency (%)", value: groupSummary.average_efficiency_percent ?? "" },
        { metric: "Latest Audit Date", value: groupSummary.latest_audit_date_label || "" },
      ],
    });
  });

  sections.push({
    heading: "DG Audit Summary",
    columns: ["metric", "value"],
    rows: [
      {
        metric: "Total DG Audit Records",
        value: overallSummary.total_dg_audit_records ?? "",
      },
      {
        metric: "Average Measured kW Output",
        value: overallSummary.average_measured_kW_output ?? "",
      },
      {
        metric: "Average Measured kVA Output",
        value: overallSummary.average_measured_kVA_output ?? "",
      },
      {
        metric: "Average Power Factor",
        value: overallSummary.average_power_factor ?? "",
      },
      {
        metric: "Average DG Cost per kWh (Rs)",
        value: overallSummary.average_dg_cost_per_kWh_rs ?? "",
      },
      {
        metric: "Average Grid Cost per kWh (Rs)",
        value: overallSummary.average_grid_cost_per_kWh_rs ?? "",
      },
        {
          metric: "Average Loading (kW)",
          value: overallSummary.average_loading_percent ?? "",
        },
      {
        metric: "Average Specific Fuel Consumption (L/kWh)",
        value: overallSummary.average_specific_fuel_consumption_l_per_kWh ?? "",
      },
      {
        metric: "Average Calculated Efficiency (%)",
        value: overallSummary.average_efficiency_percent ?? "",
      },
      {
        metric: "Latest Audit Date",
        value: overallSummary.latest_audit_date_label || "",
      },
    ],
  });

  return sections;
};

export const buildDGSection = async ({
  facility,
  utilityAccount = null,
  scope = "facility",
}) => {
  const facilityId = getId(facility);
  const utilityAccountId = getId(utilityAccount);

  const query =
    scope === "utility_account"
      ? { utility_account_id: utilityAccountId }
      : { facility_id: facilityId };

  const rows = await DGAuditRecord.find(query)
    .populate("dg_set_id")
    .sort({ audit_date: -1, created_at: -1, createdAt: -1 })
    .lean();

  const dgSets = await fetchFacilityDGSets(
    facilityId,
    scope === "utility_account" ? utilityAccountId : null,
  );

  const dgSetMap = buildDGSetMap(dgSets);
  const utilityAccountMap = await buildUtilityAccountNumberMap(
    dgSets.map((set) => set?.utility_account_id),
  );

  const mergedRows = (rows || []).map((row) => {
    const dgSetId = getId(row?.dg_set_id);
    if (dgSetId && dgSetMap.has(dgSetId)) {
      return {
        ...row,
        dg_set_id: {
          ...dgSetMap.get(dgSetId),
          ...(row.dg_set_id || {}),
        },
      };
    }
    return row;
  });

  const items = mergedRows.map((row, index) =>
    normalizeDGAuditRecord(row, index, dgSetMap, utilityAccountMap),
  );

  const summary = buildSummary(items);
  const sections = buildAccountWiseSections(items, summary);

  return {
    title: "DG Audit Records",
    key: "dg_audit_records",
    scope,
    items,
    summary,

    sections,

    table_columns: [
      { key: "sr_no", label: "Sr No", type: "integer" },
      { key: "dg_name", label: "DG Name" },
      { key: "audit_date_label", label: "Audit Date" },
      { key: "measured_kW_output", label: "Measured kW" },
      { key: "measured_kVA_output", label: "Measured kVA" },
      { key: "power_factor", label: "Power Factor", decimals: 4 },
      { key: "dg_cost_per_kWh_rs", label: "DG Cost/kWh (Rs)", decimals: 4 },
      { key: "grid_cost_per_kWh_rs", label: "Grid Cost/kWh (Rs)", decimals: 4 },
      { key: "average_loading_percent", label: "Loading (kW)" },
    ],

    table_rows: items.map((item) => ({
      sr_no: item.sr_no,
      dg_name: item.dg_name,
      audit_date_label: item.audit_date_label,
      measured_kW_output: item.measured_kW_output ?? null,
      measured_kVA_output: item.measured_kVA_output ?? null,
      power_factor: item.power_factor ?? null,
      dg_cost_per_kWh_rs: item.dg_cost_per_kWh_rs ?? null,
      grid_cost_per_kWh_rs: item.grid_cost_per_kWh_rs ?? null,
      average_loading_percent: item.average_loading_percent ?? null,
    })),
  };
};

export default buildDGSection;
