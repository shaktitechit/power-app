import { apiSlice } from "../apiSlice";

export interface ACAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface ACAuditRecord {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  unit_id: string;
  building_block?: string;
  area_location?: string;
  ac_type?: "window" | "split" | "ductable";
  make?: string;
  model?: string;
  cooling_capacity_TR?: number | string;
  rated_input_power_kW?: number | string;
  bee_star_rating?: number | string;
  refrigerant?: string;
  year_of_installation?: number | string;
  control_type?:
    | "manual"
    | "thermostat"
    | "bms"
    | "timer"
    | "inverter"
    | "other";
  quantity_nos?: number | string;
  running_status?: "running" | "not_running" | "standby";
  condition?: "good" | "average" | "poor";
  remarks?: string;

  voltage_V?: number | string;
  current_A?: number | string;
  power_factor?: number | string;
  measured_power_kW?: number | string;
  return_air_temp_C?: number | string;
  supply_air_temp_C?: number | string;
  ambient_temp_C?: number | string;
  thermostat_set_temp_C?: number | string;
  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  compressor_fan_cycling?: "normal" | "frequent" | "continuous";
  filter_evaporator_condition?: "clean" | "moderate" | "dirty";
  condenser_condition?: "clean" | "moderate" | "dirty";
  airflow_noise_leakage?: string;
  measurement_remarks?: string;

  airside_delta_T?: number | string;
  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;
  specific_power_kW_per_TR?: number | string;
  age_years?: number | string;
  om_flag?: string;
  replacement_flag?: "yes" | "no";
  control_flag?: string;
  overall_ecm_suggestion?: string;
  priority?: "low" | "medium" | "high";
  indicative_basis?: string;

  audit_date?: string;
  auditor_id?: string;

  documents: ACAuditDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateACAuditRequest {
  facility_id: string;
  utility_account_id: string;

  unit_id: string;
  building_block?: string;
  area_location?: string;
  ac_type?: "window" | "split" | "ductable";
  make?: string;
  model?: string;
  cooling_capacity_TR?: number | string;
  rated_input_power_kW?: number | string;
  bee_star_rating?: number | string;
  refrigerant?: string;
  year_of_installation?: number | string;
  control_type?:
    | "manual"
    | "thermostat"
    | "bms"
    | "timer"
    | "inverter"
    | "other";
  quantity_nos?: number | string;
  running_status?: "running" | "not_running" | "standby";
  condition?: "good" | "average" | "poor";
  remarks?: string;

  voltage_V?: number | string;
  current_A?: number | string;
  power_factor?: number | string;
  measured_power_kW?: number | string;
  return_air_temp_C?: number | string;
  supply_air_temp_C?: number | string;
  ambient_temp_C?: number | string;
  thermostat_set_temp_C?: number | string;
  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  compressor_fan_cycling?: "normal" | "frequent" | "continuous";
  filter_evaporator_condition?: "clean" | "moderate" | "dirty";
  condenser_condition?: "clean" | "moderate" | "dirty";
  airflow_noise_leakage?: string;
  measurement_remarks?: string;

  airside_delta_T?: number | string;
  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;
  specific_power_kW_per_TR?: number | string;
  age_years?: number | string;
  om_flag?: string;
  replacement_flag?: "yes" | "no";
  control_flag?: string;
  overall_ecm_suggestion?: string;
  priority?: "low" | "medium" | "high";
  indicative_basis?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateACAuditRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  unit_id?: string;
  building_block?: string;
  area_location?: string;
  ac_type?: "window" | "split" | "ductable";
  make?: string;
  model?: string;
  cooling_capacity_TR?: number | string;
  rated_input_power_kW?: number | string;
  bee_star_rating?: number | string;
  refrigerant?: string;
  year_of_installation?: number | string;
  control_type?:
    | "manual"
    | "thermostat"
    | "bms"
    | "timer"
    | "inverter"
    | "other";
  quantity_nos?: number | string;
  running_status?: "running" | "not_running" | "standby";
  condition?: "good" | "average" | "poor";
  remarks?: string;

  voltage_V?: number | string;
  current_A?: number | string;
  power_factor?: number | string;
  measured_power_kW?: number | string;
  return_air_temp_C?: number | string;
  supply_air_temp_C?: number | string;
  ambient_temp_C?: number | string;
  thermostat_set_temp_C?: number | string;
  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  compressor_fan_cycling?: "normal" | "frequent" | "continuous";
  filter_evaporator_condition?: "clean" | "moderate" | "dirty";
  condenser_condition?: "clean" | "moderate" | "dirty";
  airflow_noise_leakage?: string;
  measurement_remarks?: string;

  airside_delta_T?: number | string;
  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;
  specific_power_kW_per_TR?: number | string;
  age_years?: number | string;
  om_flag?: string;
  replacement_flag?: "yes" | "no";
  control_flag?: string;
  overall_ecm_suggestion?: string;
  priority?: "low" | "medium" | "high";
  indicative_basis?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateACAuditResponse {
  success: boolean;
  message?: string;
  data: ACAuditRecord;
}

export interface GetACAuditRecordsResponse {
  success: boolean;
  count: number;
  data: ACAuditRecord[];
}

export interface GetACAuditRecordByIdResponse {
  success: boolean;
  data: ACAuditRecord;
}

export interface UpdateACAuditResponse {
  success: boolean;
  message?: string;
  data: ACAuditRecord;
}

export interface DeleteACAuditResponse {
  success: boolean;
  message: string;
}

const buildACAuditFormData = (
  data: Partial<CreateACAuditRequest | UpdateACAuditRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.unit_id !== undefined && data.unit_id !== null) {
    formData.append("unit_id", data.unit_id);
  }

  if (data.building_block !== undefined && data.building_block !== null) {
    formData.append("building_block", data.building_block);
  }

  if (data.area_location !== undefined && data.area_location !== null) {
    formData.append("area_location", data.area_location);
  }

  if (data.ac_type !== undefined && data.ac_type !== null) {
    formData.append("ac_type", data.ac_type);
  }

  if (data.make !== undefined && data.make !== null) {
    formData.append("make", data.make);
  }

  if (data.model !== undefined && data.model !== null) {
    formData.append("model", data.model);
  }

  if (
    data.cooling_capacity_TR !== undefined &&
    data.cooling_capacity_TR !== null
  ) {
    formData.append("cooling_capacity_TR", String(data.cooling_capacity_TR));
  }

  if (
    data.rated_input_power_kW !== undefined &&
    data.rated_input_power_kW !== null
  ) {
    formData.append("rated_input_power_kW", String(data.rated_input_power_kW));
  }

  if (data.bee_star_rating !== undefined && data.bee_star_rating !== null) {
    formData.append("bee_star_rating", String(data.bee_star_rating));
  }

  if (data.refrigerant !== undefined && data.refrigerant !== null) {
    formData.append("refrigerant", data.refrigerant);
  }

  if (
    data.year_of_installation !== undefined &&
    data.year_of_installation !== null
  ) {
    formData.append(
      "year_of_installation",
      String(data.year_of_installation)
    );
  }

  if (data.control_type !== undefined && data.control_type !== null) {
    formData.append("control_type", data.control_type);
  }

  if (data.quantity_nos !== undefined && data.quantity_nos !== null) {
    formData.append("quantity_nos", String(data.quantity_nos));
  }

  if (data.running_status !== undefined && data.running_status !== null) {
    formData.append("running_status", data.running_status);
  }

  if (data.condition !== undefined && data.condition !== null) {
    formData.append("condition", data.condition);
  }

  if (data.remarks !== undefined && data.remarks !== null) {
    formData.append("remarks", data.remarks);
  }

  if (data.voltage_V !== undefined && data.voltage_V !== null) {
    formData.append("voltage_V", String(data.voltage_V));
  }

  if (data.current_A !== undefined && data.current_A !== null) {
    formData.append("current_A", String(data.current_A));
  }

  if (data.power_factor !== undefined && data.power_factor !== null) {
    formData.append("power_factor", String(data.power_factor));
  }

  if (data.measured_power_kW !== undefined && data.measured_power_kW !== null) {
    formData.append("measured_power_kW", String(data.measured_power_kW));
  }

  if (
    data.return_air_temp_C !== undefined &&
    data.return_air_temp_C !== null
  ) {
    formData.append("return_air_temp_C", String(data.return_air_temp_C));
  }

  if (
    data.supply_air_temp_C !== undefined &&
    data.supply_air_temp_C !== null
  ) {
    formData.append("supply_air_temp_C", String(data.supply_air_temp_C));
  }

  if (data.ambient_temp_C !== undefined && data.ambient_temp_C !== null) {
    formData.append("ambient_temp_C", String(data.ambient_temp_C));
  }

  if (
    data.thermostat_set_temp_C !== undefined &&
    data.thermostat_set_temp_C !== null
  ) {
    formData.append(
      "thermostat_set_temp_C",
      String(data.thermostat_set_temp_C)
    );
  }

  if (
    data.operating_hours_per_day !== undefined &&
    data.operating_hours_per_day !== null
  ) {
    formData.append(
      "operating_hours_per_day",
      String(data.operating_hours_per_day)
    );
  }

  if (
    data.operating_days_per_year !== undefined &&
    data.operating_days_per_year !== null
  ) {
    formData.append(
      "operating_days_per_year",
      String(data.operating_days_per_year)
    );
  }

  if (
    data.compressor_fan_cycling !== undefined &&
    data.compressor_fan_cycling !== null
  ) {
    formData.append("compressor_fan_cycling", data.compressor_fan_cycling);
  }

  if (
    data.filter_evaporator_condition !== undefined &&
    data.filter_evaporator_condition !== null
  ) {
    formData.append(
      "filter_evaporator_condition",
      data.filter_evaporator_condition
    );
  }

  if (
    data.condenser_condition !== undefined &&
    data.condenser_condition !== null
  ) {
    formData.append("condenser_condition", data.condenser_condition);
  }

  if (
    data.airflow_noise_leakage !== undefined &&
    data.airflow_noise_leakage !== null
  ) {
    formData.append("airflow_noise_leakage", data.airflow_noise_leakage);
  }

  if (
    data.measurement_remarks !== undefined &&
    data.measurement_remarks !== null
  ) {
    formData.append("measurement_remarks", data.measurement_remarks);
  }

  if (data.airside_delta_T !== undefined && data.airside_delta_T !== null) {
    formData.append("airside_delta_T", String(data.airside_delta_T));
  }

  if (
    data.loading_factor_percent !== undefined &&
    data.loading_factor_percent !== null
  ) {
    formData.append(
      "loading_factor_percent",
      String(data.loading_factor_percent)
    );
  }

  if (data.connected_load_kW !== undefined && data.connected_load_kW !== null) {
    formData.append("connected_load_kW", String(data.connected_load_kW));
  }

  if (
    data.annual_energy_consumption_kWh !== undefined &&
    data.annual_energy_consumption_kWh !== null
  ) {
    formData.append(
      "annual_energy_consumption_kWh",
      String(data.annual_energy_consumption_kWh)
    );
  }

  if (
    data.specific_power_kW_per_TR !== undefined &&
    data.specific_power_kW_per_TR !== null
  ) {
    formData.append(
      "specific_power_kW_per_TR",
      String(data.specific_power_kW_per_TR)
    );
  }

  if (data.age_years !== undefined && data.age_years !== null) {
    formData.append("age_years", String(data.age_years));
  }

  if (data.om_flag !== undefined && data.om_flag !== null) {
    formData.append("om_flag", data.om_flag);
  }

  if (
    data.replacement_flag !== undefined &&
    data.replacement_flag !== null
  ) {
    formData.append("replacement_flag", data.replacement_flag);
  }

  if (data.control_flag !== undefined && data.control_flag !== null) {
    formData.append("control_flag", data.control_flag);
  }

  if (
    data.overall_ecm_suggestion !== undefined &&
    data.overall_ecm_suggestion !== null
  ) {
    formData.append(
      "overall_ecm_suggestion",
      data.overall_ecm_suggestion
    );
  }

  if (data.priority !== undefined && data.priority !== null) {
    formData.append("priority", data.priority);
  }

  if (
    data.indicative_basis !== undefined &&
    data.indicative_basis !== null
  ) {
    formData.append("indicative_basis", data.indicative_basis);
  }

  if (data.audit_date !== undefined && data.audit_date !== null) {
    formData.append("audit_date", data.audit_date);
  }

  if (data.auditor_id !== undefined && data.auditor_id !== null) {
    formData.append("auditor_id", data.auditor_id);
  }

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  return formData;
};

export const acAuditRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createACAuditRecord: builder.mutation<
      CreateACAuditResponse,
      CreateACAuditRequest
    >({
      query: (data) => ({
        url: "/v1/ac-audit-records",
        method: "POST",
        body: buildACAuditFormData(data),
      }),
      invalidatesTags: ["ACAuditRecord", "UtilityAccount", "Facility"],
    }),

    getACAuditRecords: builder.query<
      GetACAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/ac-audit-records",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["ACAuditRecord"],
    }),

    getACAuditRecordById: builder.query<GetACAuditRecordByIdResponse, string>({
      query: (id) => ({
        url: `/v1/ac-audit-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "ACAuditRecord", id }],
    }),

    updateACAuditRecord: builder.mutation<
      UpdateACAuditResponse,
      UpdateACAuditRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/ac-audit-records/${id}`,
        method: "PUT",
        body: buildACAuditFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "ACAuditRecord",
        { type: "ACAuditRecord", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteACAuditRecord: builder.mutation<DeleteACAuditResponse, string>({
      query: (id) => ({
        url: `/v1/ac-audit-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "ACAuditRecord",
        { type: "ACAuditRecord", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateACAuditRecordMutation,
  useGetACAuditRecordsQuery,
  useGetACAuditRecordByIdQuery,
  useUpdateACAuditRecordMutation,
  useDeleteACAuditRecordMutation,
} = acAuditRecordApiSlice;