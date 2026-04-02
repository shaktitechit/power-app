import { apiSlice } from "./apiSlice";

export interface PumpAuditRecordDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface PumpAuditRecord {
  _id: string;
  pump_id: string;
  facility_id: string;
  utility_account_id: string;

  // 💧 Hydraulic Parameters
  suction_head_m?: number;
  discharge_static_head_m?: number;
  delivery_pipe_diameter_inches?: number;
  tank_or_sump_capacity?: number;
  time_to_fill_tank_minutes?: number;
  actual_flow_m3_per_hr?: number;

  // ⚡ Electrical Parameters
  voltage_V?: number;
  current_A?: number;
  power_factor?: number;
  input_power_kW?: number;
  operating_hours_per_day?: number;
  daily_energy_consumption_kWh?: number;

  // 📊 Performance
  total_dynamic_head_m?: number;
  hydraulic_output_power_kW?: number;
  overall_pump_set_efficiency_percent?: number;
  motor_loading_percent?: number;
  specific_energy_consumption_kWh_per_m3?: number;
  annual_energy_consumption_kWh?: number;

  // ⚙️ Operational Observations
  control_valve_throttling?: boolean;
  vfd_installed?: boolean;
  pump_condition?: "good" | "moderate" | "poor";
  leakages_observed?: boolean;
  recommendations?: string;

  // 📂 Documents
  documents: PumpAuditRecordDocument[];

  // 🔍 Audit metadata
  audit_date?: string;
  auditor_id?: string;

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePumpAuditRecordRequest {
  pump_id: string;
  facility_id: string;
  utility_account_id: string;

  suction_head_m?: number | string;
  discharge_static_head_m?: number | string;
  delivery_pipe_diameter_inches?: number | string;
  tank_or_sump_capacity?: number | string;
  time_to_fill_tank_minutes?: number | string;
  actual_flow_m3_per_hr?: number | string;

  voltage_V?: number | string;
  current_A?: number | string;
  power_factor?: number | string;
  input_power_kW?: number | string;
  operating_hours_per_day?: number | string;
  daily_energy_consumption_kWh?: number | string;

  total_dynamic_head_m?: number | string;
  hydraulic_output_power_kW?: number | string;
  overall_pump_set_efficiency_percent?: number | string;
  motor_loading_percent?: number | string;
  specific_energy_consumption_kWh_per_m3?: number | string;
  annual_energy_consumption_kWh?: number | string;

  control_valve_throttling?: boolean;
  vfd_installed?: boolean;
  pump_condition?: "good" | "moderate" | "poor";
  leakages_observed?: boolean;
  recommendations?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdatePumpAuditRecordRequest {
  id: string;

  pump_id?: string;
  facility_id?: string;
  utility_account_id?: string;

  suction_head_m?: number | string;
  discharge_static_head_m?: number | string;
  delivery_pipe_diameter_inches?: number | string;
  tank_or_sump_capacity?: number | string;
  time_to_fill_tank_minutes?: number | string;
  actual_flow_m3_per_hr?: number | string;

  voltage_V?: number | string;
  current_A?: number | string;
  power_factor?: number | string;
  input_power_kW?: number | string;
  operating_hours_per_day?: number | string;
  daily_energy_consumption_kWh?: number | string;

  total_dynamic_head_m?: number | string;
  hydraulic_output_power_kW?: number | string;
  overall_pump_set_efficiency_percent?: number | string;
  motor_loading_percent?: number | string;
  specific_energy_consumption_kWh_per_m3?: number | string;
  annual_energy_consumption_kWh?: number | string;

  control_valve_throttling?: boolean;
  vfd_installed?: boolean;
  pump_condition?: "good" | "moderate" | "poor";
  leakages_observed?: boolean;
  recommendations?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreatePumpAuditRecordResponse {
  success: boolean;
  message: string;
  data: PumpAuditRecord;
}

export interface GetPumpAuditRecordsResponse {
  success: boolean;
  count: number;
  data: PumpAuditRecord[];
}

export interface GetPumpAuditRecordByIdResponse {
  success: boolean;
  data: PumpAuditRecord;
}

export interface UpdatePumpAuditRecordResponse {
  success: boolean;
  message: string;
  data: PumpAuditRecord;
}

export interface DeletePumpAuditRecordResponse {
  success: boolean;
  message: string;
}

const buildPumpAuditRecordFormData = (
  data: Partial<CreatePumpAuditRecordRequest | UpdatePumpAuditRecordRequest>
) => {
  const formData = new FormData();

  if (data.pump_id !== undefined) {
    formData.append("pump_id", data.pump_id);
  }

  if (data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if (data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.suction_head_m !== undefined) {
    formData.append("suction_head_m", String(data.suction_head_m));
  }

  if (data.discharge_static_head_m !== undefined) {
    formData.append(
      "discharge_static_head_m",
      String(data.discharge_static_head_m)
    );
  }

  if (data.delivery_pipe_diameter_inches !== undefined) {
    formData.append(
      "delivery_pipe_diameter_inches",
      String(data.delivery_pipe_diameter_inches)
    );
  }

  if (data.tank_or_sump_capacity !== undefined) {
    formData.append(
      "tank_or_sump_capacity",
      String(data.tank_or_sump_capacity)
    );
  }

  if (data.time_to_fill_tank_minutes !== undefined) {
    formData.append(
      "time_to_fill_tank_minutes",
      String(data.time_to_fill_tank_minutes)
    );
  }

  if (data.actual_flow_m3_per_hr !== undefined) {
    formData.append(
      "actual_flow_m3_per_hr",
      String(data.actual_flow_m3_per_hr)
    );
  }

  if (data.voltage_V !== undefined) {
    formData.append("voltage_V", String(data.voltage_V));
  }

  if (data.current_A !== undefined) {
    formData.append("current_A", String(data.current_A));
  }

  if (data.power_factor !== undefined) {
    formData.append("power_factor", String(data.power_factor));
  }

  if (data.input_power_kW !== undefined) {
    formData.append("input_power_kW", String(data.input_power_kW));
  }

  if (data.operating_hours_per_day !== undefined) {
    formData.append(
      "operating_hours_per_day",
      String(data.operating_hours_per_day)
    );
  }

  if (data.daily_energy_consumption_kWh !== undefined) {
    formData.append(
      "daily_energy_consumption_kWh",
      String(data.daily_energy_consumption_kWh)
    );
  }

  if (data.total_dynamic_head_m !== undefined) {
    formData.append(
      "total_dynamic_head_m",
      String(data.total_dynamic_head_m)
    );
  }

  if (data.hydraulic_output_power_kW !== undefined) {
    formData.append(
      "hydraulic_output_power_kW",
      String(data.hydraulic_output_power_kW)
    );
  }

  if (data.overall_pump_set_efficiency_percent !== undefined) {
    formData.append(
      "overall_pump_set_efficiency_percent",
      String(data.overall_pump_set_efficiency_percent)
    );
  }

  if (data.motor_loading_percent !== undefined) {
    formData.append(
      "motor_loading_percent",
      String(data.motor_loading_percent)
    );
  }

  if (data.specific_energy_consumption_kWh_per_m3 !== undefined) {
    formData.append(
      "specific_energy_consumption_kWh_per_m3",
      String(data.specific_energy_consumption_kWh_per_m3)
    );
  }

  if (data.annual_energy_consumption_kWh !== undefined) {
    formData.append(
      "annual_energy_consumption_kWh",
      String(data.annual_energy_consumption_kWh)
    );
  }

  if (data.control_valve_throttling !== undefined) {
    formData.append(
      "control_valve_throttling",
      String(data.control_valve_throttling)
    );
  }

  if (data.vfd_installed !== undefined) {
    formData.append("vfd_installed", String(data.vfd_installed));
  }

  if (data.pump_condition !== undefined) {
    formData.append("pump_condition", data.pump_condition);
  }

  if (data.leakages_observed !== undefined) {
    formData.append("leakages_observed", String(data.leakages_observed));
  }

  if (data.recommendations !== undefined) {
    formData.append("recommendations", data.recommendations);
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

export const pumpAuditRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createPumpAuditRecord: builder.mutation<
      CreatePumpAuditRecordResponse,
      CreatePumpAuditRecordRequest
    >({
      query: (data) => ({
        url: "/v1/pump-audit-records",
        method: "POST",
        body: buildPumpAuditRecordFormData(data),
      }),
      invalidatesTags: ["PumpAuditRecord", "Pump", "UtilityAccount", "Facility"],
    }),

    getPumpAuditRecords: builder.query<
      GetPumpAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string; pump_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/pump-audit-records",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
          ...(params?.pump_id ? { pump_id: params.pump_id } : {}),
        },
      }),
      providesTags: ["PumpAuditRecord"],
    }),

    getPumpAuditRecordById: builder.query<
      GetPumpAuditRecordByIdResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/pump-audit-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "PumpAuditRecord", id },
      ],
    }),

    updatePumpAuditRecord: builder.mutation<
      UpdatePumpAuditRecordResponse,
      UpdatePumpAuditRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/pump-audit-records/${id}`,
        method: "PUT",
        body: buildPumpAuditRecordFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "PumpAuditRecord",
        { type: "PumpAuditRecord", id },
        "Pump",
        "UtilityAccount",
        "Facility",
      ],
    }),

    deletePumpAuditRecord: builder.mutation<
      DeletePumpAuditRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/pump-audit-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "PumpAuditRecord",
        { type: "PumpAuditRecord", id },
        "Pump",
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreatePumpAuditRecordMutation,
  useGetPumpAuditRecordsQuery,
  useGetPumpAuditRecordByIdQuery,
  useUpdatePumpAuditRecordMutation,
  useDeletePumpAuditRecordMutation,
} = pumpAuditRecordApiSlice;