import { apiSlice } from "../apiSlice";

export interface DGAuditRecordDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface DGAuditRecord {
  _id: string;
  dg_set_id: string;
  utility_account_id: string;
  facility_id: string;

  // Electrical Measurements
  measured_voltage_LL?: number;
  measured_current_avg?: number;
  measured_kW_output?: number;
  measured_kVA_output?: number;
  power_factor?: number;
  frequency_Hz?: number;

  // Load Analysis
  max_load_observed_kW?: number;
  min_load_observed_kW?: number;
  average_loading_percent?: number;
  load_factor_percent?: number;
  idle_running_observed?: boolean;
  parallel_operation?: boolean;

  // Fuel & Generation
  annual_fuel_consumption_liters?: number;
  units_generated_per_year_kWh?: number;
  total_working_hours_per_year?: number;
  units_generated_per_hour_kWh?: number;
  fuel_consumption_per_hour_liters?: number;
  fuel_consumption_during_test_lph?: number;
  units_generated_during_test_kWh?: number;
  time_duration_of_the_test_hours?: number;
  units_generated_per_hour_kWh_during_test?: number;
  fuel_consumption_per_hour_liters_during_test?: number;
  specific_fuel_consumption_l_per_kWh_during_test?: number;
  specific_fuel_consumption_l_per_kWh?: number;
  manufacturer_sfc_l_per_kWh?: number;
  sfc_deviation_percent?: number;
  sfc_deviation_percent_during_test?: number;

  // Cost Analysis
  fuel_cost_rs_per_liter?: number;
  annual_fuel_cost_rs?: number;
  dg_cost_per_kWh_rs?: number;
  grid_cost_per_kWh_rs?: number;

  // Efficiency
  calculated_efficiency_percent?: number;
  manufacturer_efficiency_percent?: number;
  efficiency_deviation_percent?: number;

  // Operating Conditions
  exhaust_temperature_C?: number;
  cooling_water_temperature_C?: number;
  lube_oil_pressure_bar?: number;
  lube_oil_consumption_liters_per_year?: number;
  total_operating_hours?: number;
  hours_since_last_overhaul?: number;
  air_fuel_filter_condition?: "good" | "moderate" | "poor";
  visible_smoke_or_abnormal_vibration?: boolean;

  // Audit metadata
  audit_date?: string;
  auditor_id?: string;

  documents: DGAuditRecordDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDGAuditRecordRequest {
  dg_set_id: string;
  utility_account_id: string;
  facility_id: string;

  measured_voltage_LL?: number | string;
  measured_current_avg?: number | string;
  measured_kW_output?: number | string;
  measured_kVA_output?: number | string;
  power_factor?: number | string;
  frequency_Hz?: number | string;

  max_load_observed_kW?: number | string;
  min_load_observed_kW?: number | string;
  average_loading_percent?: number | string;
  load_factor_percent?: number | string;
  idle_running_observed?: boolean;
  parallel_operation?: boolean;

  annual_fuel_consumption_liters?: number | string;
  units_generated_per_year_kWh?: number | string;
  total_working_hours_per_year?: number | string;
  units_generated_per_hour_kWh?: number | string;
  fuel_consumption_per_hour_liters?: number | string;
  fuel_consumption_during_test_lph?: number | string;
  units_generated_during_test_kWh?: number | string;
  time_duration_of_the_test_hours?: number | string;
  units_generated_per_hour_kWh_during_test?: number | string;
  fuel_consumption_per_hour_liters_during_test?: number | string;
  specific_fuel_consumption_l_per_kWh_during_test?: number | string;
  specific_fuel_consumption_l_per_kWh?: number | string;
  manufacturer_sfc_l_per_kWh?: number | string;
  sfc_deviation_percent?: number | string;
  sfc_deviation_percent_during_test?: number | string;

  fuel_cost_rs_per_liter?: number | string;
  annual_fuel_cost_rs?: number | string;
  dg_cost_per_kWh_rs?: number | string;
  grid_cost_per_kWh_rs?: number | string;

  calculated_efficiency_percent?: number | string;
  manufacturer_efficiency_percent?: number | string;
  efficiency_deviation_percent?: number | string;

  exhaust_temperature_C?: number | string;
  cooling_water_temperature_C?: number | string;
  lube_oil_pressure_bar?: number | string;
  lube_oil_consumption_liters_per_year?: number | string;
  total_operating_hours?: number | string;
  hours_since_last_overhaul?: number | string;
  air_fuel_filter_condition?: "good" | "moderate" | "poor";
  visible_smoke_or_abnormal_vibration?: boolean;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateDGAuditRecordRequest {
  id: string;

  dg_set_id?: string;
  utility_account_id?: string;
  facility_id?: string;

  measured_voltage_LL?: number | string;
  measured_current_avg?: number | string;
  measured_kW_output?: number | string;
  measured_kVA_output?: number | string;
  power_factor?: number | string;
  frequency_Hz?: number | string;

  max_load_observed_kW?: number | string;
  min_load_observed_kW?: number | string;
  average_loading_percent?: number | string;
  load_factor_percent?: number | string;
  idle_running_observed?: boolean;
  parallel_operation?: boolean;

  annual_fuel_consumption_liters?: number | string;
  units_generated_per_year_kWh?: number | string;
  total_working_hours_per_year?: number | string;
  units_generated_per_hour_kWh?: number | string;
  fuel_consumption_per_hour_liters?: number | string;
  fuel_consumption_during_test_lph?: number | string;
  units_generated_during_test_kWh?: number | string;
  time_duration_of_the_test_hours?: number | string;
  units_generated_per_hour_kWh_during_test?: number | string;
  fuel_consumption_per_hour_liters_during_test?: number | string;
  specific_fuel_consumption_l_per_kWh_during_test?: number | string;
  specific_fuel_consumption_l_per_kWh?: number | string;
  manufacturer_sfc_l_per_kWh?: number | string;
  sfc_deviation_percent?: number | string;
  sfc_deviation_percent_during_test?: number | string;

  fuel_cost_rs_per_liter?: number | string;
  annual_fuel_cost_rs?: number | string;
  dg_cost_per_kWh_rs?: number | string;
  grid_cost_per_kWh_rs?: number | string;

  calculated_efficiency_percent?: number | string;
  manufacturer_efficiency_percent?: number | string;
  efficiency_deviation_percent?: number | string;

  exhaust_temperature_C?: number | string;
  cooling_water_temperature_C?: number | string;
  lube_oil_pressure_bar?: number | string;
  lube_oil_consumption_liters_per_year?: number | string;
  total_operating_hours?: number | string;
  hours_since_last_overhaul?: number | string;
  air_fuel_filter_condition?: "good" | "moderate" | "poor";
  visible_smoke_or_abnormal_vibration?: boolean;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateDGAuditRecordResponse {
  success: boolean;
  message: string;
  data: DGAuditRecord;
}

export interface GetDGAuditRecordsResponse {
  success: boolean;
  count: number;
  data: DGAuditRecord[];
}

export interface GetDGAuditRecordByIdResponse {
  success: boolean;
  data: DGAuditRecord;
}

export interface UpdateDGAuditRecordResponse {
  success: boolean;
  message: string;
  data: DGAuditRecord;
}

export interface DeleteDGAuditRecordResponse {
  success: boolean;
  message: string;
}

const buildDGAuditRecordFormData = (
  data: Partial<CreateDGAuditRecordRequest | UpdateDGAuditRecordRequest>
) => {
  const formData = new FormData();

  if ("dg_set_id" in data && data.dg_set_id !== undefined) {
    formData.append("dg_set_id", data.dg_set_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if (data.measured_voltage_LL !== undefined) {
    formData.append("measured_voltage_LL", String(data.measured_voltage_LL));
  }

  if (data.measured_current_avg !== undefined) {
    formData.append("measured_current_avg", String(data.measured_current_avg));
  }

  if (data.measured_kW_output !== undefined) {
    formData.append("measured_kW_output", String(data.measured_kW_output));
  }

  if (data.measured_kVA_output !== undefined) {
    formData.append("measured_kVA_output", String(data.measured_kVA_output));
  }

  if (data.power_factor !== undefined) {
    formData.append("power_factor", String(data.power_factor));
  }

  if (data.frequency_Hz !== undefined) {
    formData.append("frequency_Hz", String(data.frequency_Hz));
  }

  if (data.max_load_observed_kW !== undefined) {
    formData.append(
      "max_load_observed_kW",
      String(data.max_load_observed_kW)
    );
  }

  if (data.min_load_observed_kW !== undefined) {
    formData.append(
      "min_load_observed_kW",
      String(data.min_load_observed_kW)
    );
  }

  if (data.average_loading_percent !== undefined) {
    formData.append(
      "average_loading_percent",
      String(data.average_loading_percent)
    );
  }

  if (data.load_factor_percent !== undefined) {
    formData.append("load_factor_percent", String(data.load_factor_percent));
  }

  if (data.idle_running_observed !== undefined) {
    formData.append(
      "idle_running_observed",
      String(data.idle_running_observed)
    );
  }

  if (data.parallel_operation !== undefined) {
    formData.append("parallel_operation", String(data.parallel_operation));
  }

  if (data.annual_fuel_consumption_liters !== undefined) {
    formData.append(
      "annual_fuel_consumption_liters",
      String(data.annual_fuel_consumption_liters)
    );
  }

  if (data.units_generated_per_year_kWh !== undefined) {
    formData.append(
      "units_generated_per_year_kWh",
      String(data.units_generated_per_year_kWh)
    );
  }

  if (data.total_working_hours_per_year !== undefined) {
    formData.append(
      "total_working_hours_per_year",
      String(data.total_working_hours_per_year)
    );
  }

  if (data.units_generated_per_hour_kWh !== undefined) {
    formData.append(
      "units_generated_per_hour_kWh",
      String(data.units_generated_per_hour_kWh)
    );
  }

  if (data.fuel_consumption_per_hour_liters !== undefined) {
    formData.append(
      "fuel_consumption_per_hour_liters",
      String(data.fuel_consumption_per_hour_liters)
    );
  }

  if (data.fuel_consumption_during_test_lph !== undefined) {
    formData.append(
      "fuel_consumption_during_test_lph",
      String(data.fuel_consumption_during_test_lph)
    );
  }

  if (data.units_generated_during_test_kWh !== undefined) {
    formData.append(
      "units_generated_during_test_kWh",
      String(data.units_generated_during_test_kWh)
    );
  }

  if (data.time_duration_of_the_test_hours !== undefined) {
    formData.append(
      "time_duration_of_the_test_hours",
      String(data.time_duration_of_the_test_hours)
    );
  }

  if (data.units_generated_per_hour_kWh_during_test !== undefined) {
    formData.append(
      "units_generated_per_hour_kWh_during_test",
      String(data.units_generated_per_hour_kWh_during_test)
    );
  }

  if (data.fuel_consumption_per_hour_liters_during_test !== undefined) {
    formData.append(
      "fuel_consumption_per_hour_liters_during_test",
      String(data.fuel_consumption_per_hour_liters_during_test)
    );
  }

  if (data.specific_fuel_consumption_l_per_kWh_during_test !== undefined) {
    formData.append(
      "specific_fuel_consumption_l_per_kWh_during_test",
      String(data.specific_fuel_consumption_l_per_kWh_during_test)
    );
  }

  if (data.specific_fuel_consumption_l_per_kWh !== undefined) {
    formData.append(
      "specific_fuel_consumption_l_per_kWh",
      String(data.specific_fuel_consumption_l_per_kWh)
    );
  }

  if (data.manufacturer_sfc_l_per_kWh !== undefined) {
    formData.append(
      "manufacturer_sfc_l_per_kWh",
      String(data.manufacturer_sfc_l_per_kWh)
    );
  }

  if (data.sfc_deviation_percent !== undefined) {
    formData.append(
      "sfc_deviation_percent",
      String(data.sfc_deviation_percent)
    );
  }

  if (data.sfc_deviation_percent_during_test !== undefined) {
    formData.append(
      "sfc_deviation_percent_during_test",
      String(data.sfc_deviation_percent_during_test)
    );
  }

  if (data.fuel_cost_rs_per_liter !== undefined) {
    formData.append(
      "fuel_cost_rs_per_liter",
      String(data.fuel_cost_rs_per_liter)
    );
  }

  if (data.annual_fuel_cost_rs !== undefined) {
    formData.append("annual_fuel_cost_rs", String(data.annual_fuel_cost_rs));
  }

  if (data.dg_cost_per_kWh_rs !== undefined) {
    formData.append("dg_cost_per_kWh_rs", String(data.dg_cost_per_kWh_rs));
  }

  if (data.grid_cost_per_kWh_rs !== undefined) {
    formData.append("grid_cost_per_kWh_rs", String(data.grid_cost_per_kWh_rs));
  }

  if (data.calculated_efficiency_percent !== undefined) {
    formData.append(
      "calculated_efficiency_percent",
      String(data.calculated_efficiency_percent)
    );
  }

  if (data.manufacturer_efficiency_percent !== undefined) {
    formData.append(
      "manufacturer_efficiency_percent",
      String(data.manufacturer_efficiency_percent)
    );
  }

  if (data.efficiency_deviation_percent !== undefined) {
    formData.append(
      "efficiency_deviation_percent",
      String(data.efficiency_deviation_percent)
    );
  }

  if (data.exhaust_temperature_C !== undefined) {
    formData.append(
      "exhaust_temperature_C",
      String(data.exhaust_temperature_C)
    );
  }

  if (data.cooling_water_temperature_C !== undefined) {
    formData.append(
      "cooling_water_temperature_C",
      String(data.cooling_water_temperature_C)
    );
  }

  if (data.lube_oil_pressure_bar !== undefined) {
    formData.append("lube_oil_pressure_bar", String(data.lube_oil_pressure_bar));
  }

  if (data.lube_oil_consumption_liters_per_year !== undefined) {
    formData.append(
      "lube_oil_consumption_liters_per_year",
      String(data.lube_oil_consumption_liters_per_year)
    );
  }

  if (data.total_operating_hours !== undefined) {
    formData.append(
      "total_operating_hours",
      String(data.total_operating_hours)
    );
  }

  if (data.hours_since_last_overhaul !== undefined) {
    formData.append(
      "hours_since_last_overhaul",
      String(data.hours_since_last_overhaul)
    );
  }

  if (data.air_fuel_filter_condition !== undefined) {
    formData.append(
      "air_fuel_filter_condition",
      data.air_fuel_filter_condition
    );
  }

  if (data.visible_smoke_or_abnormal_vibration !== undefined) {
    formData.append(
      "visible_smoke_or_abnormal_vibration",
      String(data.visible_smoke_or_abnormal_vibration)
    );
  }

  if (data.audit_date !== undefined) {
    formData.append("audit_date", data.audit_date);
  }

  if (data.auditor_id !== undefined) {
    formData.append("auditor_id", data.auditor_id);
  }

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  return formData;
};

export const dgAuditRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDGAuditRecord: builder.mutation<
      CreateDGAuditRecordResponse,
      CreateDGAuditRecordRequest
    >({
      query: (data) => ({
        url: "/v1/dg-audit-records",
        method: "POST",
        body: buildDGAuditRecordFormData(data),
      }),
      invalidatesTags: ["DGAuditRecord", "DGSet", "UtilityAccount", "Facility"],
    }),

    getDGAuditRecords: builder.query<
      GetDGAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string; dg_set_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/dg-audit-records",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
          ...(params?.dg_set_id ? { dg_set_id: params.dg_set_id } : {}),
        },
      }),
      providesTags: ["DGAuditRecord"],
    }),

    getDGAuditRecordById: builder.query<GetDGAuditRecordByIdResponse, string>({
      query: (id) => ({
        url: `/v1/dg-audit-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "DGAuditRecord", id }],
    }),

    updateDGAuditRecord: builder.mutation<
      UpdateDGAuditRecordResponse,
      UpdateDGAuditRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/dg-audit-records/${id}`,
        method: "PUT",
        body: buildDGAuditRecordFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "DGAuditRecord",
        { type: "DGAuditRecord", id },
        "DGSet",
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteDGAuditRecord: builder.mutation<
      DeleteDGAuditRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/dg-audit-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "DGAuditRecord",
        { type: "DGAuditRecord", id },
        "DGSet",
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateDGAuditRecordMutation,
  useGetDGAuditRecordsQuery,
  useGetDGAuditRecordByIdQuery,
  useUpdateDGAuditRecordMutation,
  useDeleteDGAuditRecordMutation,
} = dgAuditRecordApiSlice;