import mongoose from "mongoose";
import ACAuditRecord from "../../../../../modals/electrical-audit/acAuditRecord.js";
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

const formatNumber = (value, decimals = 2) => {
  const num = normalizeNumber(value);
  if (num === null) return "";
  return num.toFixed(decimals);
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
    const nestedId =
      typeof value._id === "object" ? getId(value._id) : String(value._id);
    return nestedId === "[object Object]" ? "" : nestedId;
  }

  if (value?.id) {
    const nestedId =
      typeof value.id === "object" ? getId(value.id) : String(value.id);
    return nestedId === "[object Object]" ? "" : nestedId;
  }

  if (value?.utility_account_id?._id) {
    return getId(value.utility_account_id._id);
  }

  if (value?.utility_account_id?.id) {
    return getId(value.utility_account_id.id);
  }

  if (
    value?.utility_account_id &&
    typeof value.utility_account_id === "string" &&
    value.utility_account_id !== "[object Object]"
  ) {
    return value.utility_account_id.trim();
  }

  if (value?.facility_id?._id) {
    return getId(value.facility_id._id);
  }

  if (value?.facility_id?.id) {
    return getId(value.facility_id.id);
  }

  if (
    value?.facility_id &&
    typeof value.facility_id === "string" &&
    value.facility_id !== "[object Object]"
  ) {
    return value.facility_id.trim();
  }

  if (value?.toString && typeof value.toString === "function") {
    const str = String(value.toString()).trim();
    return str === "[object Object]" ? "" : str;
  }

  return "";
};

const normalizeACRecord = (row, index = 0) => {
  const coolingCapacity = normalizeNumber(row?.cooling_capacity_TR);
  const ratedInputPower = normalizeNumber(row?.rated_input_power_kW);
  const voltage = normalizeNumber(row?.voltage_V);
  const current = normalizeNumber(row?.current_A);
  const powerFactor = normalizeNumber(row?.power_factor);
  const measuredPower = normalizeNumber(row?.measured_power_kW);
  const returnAirTemp = normalizeNumber(row?.return_air_temp_C);
  const supplyAirTemp = normalizeNumber(row?.supply_air_temp_C);
  const ambientTemp = normalizeNumber(row?.ambient_temp_C);
  const thermostatSetTemp = normalizeNumber(row?.thermostat_set_temp_C);
  const operatingHours = normalizeNumber(row?.operating_hours_per_day);
  const operatingDays = normalizeNumber(row?.operating_days_per_year);
  const airsideDeltaT = normalizeNumber(row?.airside_delta_T);
  const loadingFactor = normalizeNumber(row?.loading_factor_percent);
  const connectedLoad = normalizeNumber(row?.connected_load_kW);
  const annualEnergy = normalizeNumber(row?.annual_energy_consumption_kWh);
  const specificPower = normalizeNumber(row?.specific_power_kW_per_TR);
  const yearOfInstallation = normalizeNumber(row?.year_of_installation);
  const quantityNos = normalizeNumber(row?.quantity_nos);

  return {
    id: getId(row),
    sr_no: index + 1,

    facility_id: getId(row?.facility_id),
    utility_account_id: getId(row?.utility_account_id),
    auditor_id: getId(row?.auditor_id),

    unit_id: normalizeText(row?.unit_id),
    building_block: normalizeText(row?.building_block),
    area_location: normalizeText(row?.area_location),
    ac_type: normalizeText(row?.ac_type),
    make: normalizeText(row?.make),
    model: normalizeText(row?.model),
    bee_star_rating: normalizeText(row?.bee_star_rating),
    condition: normalizeText(row?.condition),

    cooling_capacity_TR: coolingCapacity,
    cooling_capacity_TR_label:
      coolingCapacity !== null ? formatNumber(coolingCapacity) : "",

    rated_input_power_kW: ratedInputPower,
    rated_input_power_kW_label:
      ratedInputPower !== null ? formatNumber(ratedInputPower) : "",

    year_of_installation: yearOfInstallation,
    year_of_installation_label:
      yearOfInstallation !== null ? String(yearOfInstallation) : "",

    quantity_nos: quantityNos,
    quantity_nos_label: quantityNos !== null ? String(quantityNos) : "",

    voltage_V: voltage,
    voltage_V_label: voltage !== null ? formatNumber(voltage) : "",

    current_A: current,
    current_A_label: current !== null ? formatNumber(current) : "",

    power_factor: powerFactor,
    power_factor_label:
      powerFactor !== null ? Number(powerFactor).toFixed(4) : "",

    measured_power_kW: measuredPower,
    measured_power_kW_label:
      measuredPower !== null ? formatNumber(measuredPower) : "",

    return_air_temp_C: returnAirTemp,
    return_air_temp_C_label:
      returnAirTemp !== null ? formatNumber(returnAirTemp) : "",

    supply_air_temp_C: supplyAirTemp,
    supply_air_temp_C_label:
      supplyAirTemp !== null ? formatNumber(supplyAirTemp) : "",

    ambient_temp_C: ambientTemp,
    ambient_temp_C_label: ambientTemp !== null ? formatNumber(ambientTemp) : "",

    thermostat_set_temp_C: thermostatSetTemp,
    thermostat_set_temp_C_label:
      thermostatSetTemp !== null ? formatNumber(thermostatSetTemp) : "",

    operating_hours_per_day: operatingHours,
    operating_hours_per_day_label:
      operatingHours !== null ? formatNumber(operatingHours) : "",

    operating_days_per_year: operatingDays,
    operating_days_per_year_label:
      operatingDays !== null ? formatNumber(operatingDays) : "",

    airside_delta_T: airsideDeltaT,
    airside_delta_T_label:
      airsideDeltaT !== null ? formatNumber(airsideDeltaT) : "",

    loading_factor_percent: loadingFactor,
    loading_factor_percent_label:
      loadingFactor !== null ? formatNumber(loadingFactor) : "",

    connected_load_kW: connectedLoad,
    connected_load_kW_label:
      connectedLoad !== null ? formatNumber(connectedLoad) : "",

    annual_energy_consumption_kWh: annualEnergy,
    annual_energy_consumption_kWh_label:
      annualEnergy !== null ? formatNumber(annualEnergy) : "",

    specific_power_kW_per_TR: specificPower,
    specific_power_kW_per_TR_label:
      specificPower !== null ? formatNumber(specificPower) : "",

    om_flag: normalizeText(row?.om_flag),
    replacement_flag: normalizeText(row?.replacement_flag),
    control_flag: normalizeText(row?.control_flag),
    overall_ecm_suggestion: normalizeText(row?.overall_ecm_suggestion),
    priority: normalizeText(row?.priority),
    remarks: normalizeText(row?.remarks),

    created_at: row?.createdAt || row?.created_at || null,
    updated_at: row?.updatedAt || row?.updated_at || null,
  };
};

const buildUtilityAccountNumberMap = async (ids = []) => {
  const uniqueIds = [...new Set(ids.map((id) => getId(id)).filter(Boolean))];
  if (!uniqueIds.length) return new Map();

  const accounts = await UtilityAccount.find({ _id: { $in: uniqueIds } })
    .select("account_number")
    .lean();

  return new Map(
    (accounts || []).map((account) => [getId(account), normalizeText(account.account_number)]),
  );
};

const buildACSummary = (items = []) => {
  const totalConnectedLoad = items.reduce(
    (sum, item) => sum + (normalizeNumber(item.connected_load_kW) || 0),
    0,
  );
  const totalAnnualEnergy = items.reduce(
    (sum, item) => sum + (normalizeNumber(item.annual_energy_consumption_kWh) || 0),
    0,
  );
  const avgSpecificPower =
    items.length > 0
      ? Number(
          (
            items.reduce(
              (sum, item) => sum + (normalizeNumber(item.specific_power_kW_per_TR) || 0),
              0,
            ) / items.length
          ).toFixed(3),
        )
      : null;

  return {
    total_records: items.length,
    total_connected_load_kW: Number(totalConnectedLoad.toFixed(2)),
    total_annual_energy_consumption_kWh: Number(totalAnnualEnergy.toFixed(2)),
    average_specific_power_kW_per_TR: avgSpecificPower,
  };
};

export const buildACSection = async ({
  report,
  meta,
  facility,
  utilityAccount = null,
  scope = "facility",
}) => {
  if (!facility) {
    const error = new Error("facility is required in buildACSection");
    error.statusCode = 500;
    throw error;
  }

  const facilityId = getId(facility);
  const utilityAccountId =
    getId(utilityAccount) || getId(meta?.utility_account_id);

  let query = {};

  if (scope === "utility_account") {
    if (!utilityAccountId || !isValidObjectId(utilityAccountId)) {
      return {
        title: "AC Audit",
        key: "ac_records",
        scope,
        facility_id: facilityId || "",
        utility_account_id: utilityAccountId || "",
        report_type: report?.report_type || meta?.report_type || "",
        total_ac_records: 0,
        items: [],
        sections: [],
        table_columns: [],
        table_rows: [],
      };
    }

    query = {
      utility_account_id: new mongoose.Types.ObjectId(utilityAccountId),
    };
  } else {
    if (!facilityId || !isValidObjectId(facilityId)) {
      return {
        title: "AC Audit",
        key: "ac_records",
        scope,
        facility_id: facilityId || "",
        utility_account_id: "",
        report_type: report?.report_type || meta?.report_type || "",
        total_ac_records: 0,
        items: [],
        sections: [],
        table_columns: [],
        table_rows: [],
      };
    }

    query = {
      facility_id: new mongoose.Types.ObjectId(facilityId),
    };
  }

  const rows = await ACAuditRecord.find(query)
    .sort({ createdAt: -1, created_at: -1 })
    .lean();

  const utilityAccountMap = await buildUtilityAccountNumberMap(
    rows.map((row) => row?.utility_account_id),
  );
  const items = (rows || []).map((row, index) => {
    const item = normalizeACRecord(row, index);
    const accountId = item.utility_account_id;
    return {
      ...item,
      utility_account_number:
        utilityAccountMap.get(accountId) ||
        normalizeText(row?.utility_account_id?.account_number),
    };
  });

  const groupedByAccount = new Map();
  items.forEach((item) => {
    const key = item.utility_account_id || "unknown";
    if (!groupedByAccount.has(key)) {
      groupedByAccount.set(key, {
        account_number: item.utility_account_number || "Unknown Account",
        items: [],
      });
    }
    groupedByAccount.get(key).items.push(item);
  });
  const overallSummary = buildACSummary(items);

  const sections = [];
  Array.from(groupedByAccount.values()).forEach((group) => {
    const prefix = group.account_number;
    const groupItems = group.items;
    const groupSummary = buildACSummary(groupItems);

    sections.push({
      heading: `${prefix} - Basic Details`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "unit_id",
        "building_block",
        "area_location",
        "ac_type",
        "make",
        "model",
        "cooling_capacity_TR",
        "rated_input_power_kW",
        "bee_star_rating",
        { key: "year_of_installation", label: "Year Of Installation", type: "integer" },
        { key: "quantity_nos", label: "Quantity Nos", type: "integer" },
        "condition",
      ],
      rows: groupItems.map((item, idx) => ({
        sr_no: idx + 1,
        unit_id: item.unit_id,
        building_block: item.building_block,
        area_location: item.area_location,
        ac_type: item.ac_type,
        make: item.make,
        model: item.model,
        cooling_capacity_TR: item.cooling_capacity_TR ?? null,
        rated_input_power_kW: item.rated_input_power_kW ?? null,
        bee_star_rating: item.bee_star_rating,
        year_of_installation: item.year_of_installation ?? null,
        quantity_nos: item.quantity_nos ?? null,
        condition: item.condition,
      })),
    });
    sections.push({
      heading: `${prefix} - Measurement Section`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "voltage_V",
        "current_A",
        { key: "power_factor", label: "Power Factor", decimals: 4 },
        "measured_power_kW",
        "return_air_temp_C",
        "supply_air_temp_C",
        "ambient_temp_C",
        "thermostat_set_temp_C",
        "operating_hours_per_day",
        { key: "operating_days_per_year", label: "Operating Days Per Year", type: "integer" },
      ],
      rows: groupItems.map((item, idx) => ({
        sr_no: idx + 1,
        voltage_V: item.voltage_V ?? null,
        current_A: item.current_A ?? null,
        power_factor: item.power_factor ?? null,
        measured_power_kW: item.measured_power_kW ?? null,
        return_air_temp_C: item.return_air_temp_C ?? null,
        supply_air_temp_C: item.supply_air_temp_C ?? null,
        ambient_temp_C: item.ambient_temp_C ?? null,
        thermostat_set_temp_C: item.thermostat_set_temp_C ?? null,
        operating_hours_per_day: item.operating_hours_per_day ?? null,
        operating_days_per_year: item.operating_days_per_year ?? null,
      })),
    });
    sections.push({
      heading: `${prefix} - Performance & Calculations`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "airside_delta_T",
        "loading_factor_percent",
        "connected_load_kW",
        "annual_energy_consumption_kWh",
        {
          key: "specific_power_kW_per_TR",
          label: "Specific Power KW Per TR",
          decimals: 3,
        },
      ],
      rows: groupItems.map((item, idx) => ({
        sr_no: idx + 1,
        airside_delta_T: item.airside_delta_T ?? null,
        loading_factor_percent: item.loading_factor_percent ?? null,
        connected_load_kW: item.connected_load_kW ?? null,
        annual_energy_consumption_kWh: item.annual_energy_consumption_kWh ?? null,
        specific_power_kW_per_TR: item.specific_power_kW_per_TR ?? null,
      })),
    });
    sections.push({
      heading: `${prefix} - Observations & Recommendations`,
      columns: [
        { key: "sr_no", label: "Sr No", type: "integer" },
        "om_flag",
        "replacement_flag",
        "control_flag",
        "overall_ecm_suggestion",
        "priority",
        "remarks",
      ],
      rows: groupItems.map((item, idx) => ({
        sr_no: idx + 1,
        om_flag: item.om_flag,
        replacement_flag: item.replacement_flag,
        control_flag: item.control_flag,
        overall_ecm_suggestion: item.overall_ecm_suggestion,
        priority: item.priority,
        remarks: item.remarks,
      })),
    });

    sections.push({
      heading: `${prefix} - AC Audit Summary`,
      columns: ["metric", "value"],
      rows: [
        { metric: "Total AC Audit Records", value: groupSummary.total_records ?? "" },
        {
          metric: "Total Connected Load (kW)",
          value: groupSummary.total_connected_load_kW ?? "",
        },
        {
          metric: "Total Annual Energy Consumption (kWh)",
          value: groupSummary.total_annual_energy_consumption_kWh ?? "",
        },
        {
          metric: "Average Specific Power (kW/TR)",
          value: groupSummary.average_specific_power_kW_per_TR ?? "",
        },
      ],
    });
  });

  sections.push({
    heading: "AC Audit Summary",
    columns: ["metric", "value"],
    rows: [
      { metric: "Total AC Audit Records", value: overallSummary.total_records ?? "" },
      {
        metric: "Total Connected Load (kW)",
        value: overallSummary.total_connected_load_kW ?? "",
      },
      {
        metric: "Total Annual Energy Consumption (kWh)",
        value: overallSummary.total_annual_energy_consumption_kWh ?? "",
      },
      {
        metric: "Average Specific Power (kW/TR)",
        value: overallSummary.average_specific_power_kW_per_TR ?? "",
      },
    ],
  });

  return {
    title: "AC Audit",
    key: "ac_records",
    scope,
    facility_id: facilityId || "",
    utility_account_id:
      scope === "utility_account" ? utilityAccountId || "" : "",
    report_type: report?.report_type || meta?.report_type || "",
    total_ac_records: items.length,

    items,

    sections,

    table_columns: [
      { key: "sr_no", label: "Sr No", type: "integer" },
      { key: "unit_id", label: "Unit ID" },
      { key: "area_location", label: "Area / Location" },
      { key: "ac_type", label: "AC Type" },
      { key: "make", label: "Make" },
      { key: "model", label: "Model" },
      { key: "cooling_capacity_TR", label: "Cooling Capacity (TR)" },
      { key: "measured_power_kW", label: "Measured Power (kW)" },
      {
        key: "annual_energy_consumption_kWh",
        label: "Annual Energy (kWh)",
      },
      { key: "priority", label: "Priority" },
      { key: "remarks", label: "Remarks" },
    ],

    table_rows: items.map((item) => ({
      sr_no: item.sr_no,
      unit_id: item.unit_id,
      area_location: item.area_location,
      ac_type: item.ac_type,
      make: item.make,
      model: item.model,
      cooling_capacity_TR: item.cooling_capacity_TR ?? null,
      measured_power_kW: item.measured_power_kW ?? null,
      annual_energy_consumption_kWh: item.annual_energy_consumption_kWh ?? null,
      priority: item.priority,
      remarks: item.remarks,
    })),
  };
};

export default buildACSection;
