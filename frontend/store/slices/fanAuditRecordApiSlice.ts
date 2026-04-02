import { apiSlice } from "./apiSlice";

export interface FanAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface FanAuditRecord {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  building_block?: string;
  area_location?: string;
  fan_type?:
    | "ceiling"
    | "exhaust"
    | "pedestal"
    | "wall"
    | "industrial"
    | "other";
  make_model?: string;

  rated_power_W?: number | string;
  measured_power_W?: number | string;
  quantity_nos?: number | string;

  speed_control_type?: "regulator" | "electronic" | "vfd" | "none";

  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;

  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;

  condition?: "good" | "moderate" | "poor";
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents: FanAuditDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFanAuditRecordRequest {
  facility_id: string;
  utility_account_id: string;

  building_block?: string;
  area_location?: string;
  fan_type?:
    | "ceiling"
    | "exhaust"
    | "pedestal"
    | "wall"
    | "industrial"
    | "other";
  make_model?: string;

  rated_power_W?: number | string;
  measured_power_W?: number | string;
  quantity_nos?: number | string;

  speed_control_type?: "regulator" | "electronic" | "vfd" | "none";

  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;

  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;

  condition?: "good" | "moderate" | "poor";
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateFanAuditRecordRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  building_block?: string;
  area_location?: string;
  fan_type?:
    | "ceiling"
    | "exhaust"
    | "pedestal"
    | "wall"
    | "industrial"
    | "other";
  make_model?: string;

  rated_power_W?: number | string;
  measured_power_W?: number | string;
  quantity_nos?: number | string;

  speed_control_type?: "regulator" | "electronic" | "vfd" | "none";

  operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;

  loading_factor_percent?: number | string;
  connected_load_kW?: number | string;
  annual_energy_consumption_kWh?: number | string;

  condition?: "good" | "moderate" | "poor";
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateFanAuditRecordResponse {
  success: boolean;
  message?: string;
  data: FanAuditRecord;
}

export interface GetFanAuditRecordsResponse {
  success: boolean;
  count: number;
  data: FanAuditRecord[];
}

export interface GetFanAuditRecordByIdResponse {
  success: boolean;
  data: FanAuditRecord;
}

export interface UpdateFanAuditRecordResponse {
  success: boolean;
  message?: string;
  data: FanAuditRecord;
}

export interface DeleteFanAuditRecordResponse {
  success: boolean;
  message: string;
}

const buildFanAuditFormData = (
  data: Partial<CreateFanAuditRecordRequest | UpdateFanAuditRecordRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.building_block !== undefined && data.building_block !== null) {
    formData.append("building_block", data.building_block);
  }

  if (data.area_location !== undefined && data.area_location !== null) {
    formData.append("area_location", data.area_location);
  }

  if (data.fan_type !== undefined && data.fan_type !== null) {
    formData.append("fan_type", data.fan_type);
  }

  if (data.make_model !== undefined && data.make_model !== null) {
    formData.append("make_model", data.make_model);
  }

  if (data.rated_power_W !== undefined && data.rated_power_W !== null) {
    formData.append("rated_power_W", String(data.rated_power_W));
  }

  if (data.measured_power_W !== undefined && data.measured_power_W !== null) {
    formData.append("measured_power_W", String(data.measured_power_W));
  }

  if (data.quantity_nos !== undefined && data.quantity_nos !== null) {
    formData.append("quantity_nos", String(data.quantity_nos));
  }

  if (
    data.speed_control_type !== undefined &&
    data.speed_control_type !== null
  ) {
    formData.append("speed_control_type", data.speed_control_type);
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

  if (data.condition !== undefined && data.condition !== null) {
    formData.append("condition", data.condition);
  }

  if (data.remarks !== undefined && data.remarks !== null) {
    formData.append("remarks", data.remarks);
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

export const fanAuditRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createFanAuditRecord: builder.mutation<
      CreateFanAuditRecordResponse,
      CreateFanAuditRecordRequest
    >({
      query: (data) => ({
        url: "/v1/fan-audit-records",
        method: "POST",
        body: buildFanAuditFormData(data),
      }),
      invalidatesTags: ["FanAuditRecord", "UtilityAccount", "Facility"],
    }),

    getFanAuditRecords: builder.query<
      GetFanAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/fan-audit-records",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["FanAuditRecord"],
    }),

    getFanAuditRecordById: builder.query<GetFanAuditRecordByIdResponse, string>({
      query: (id) => ({
        url: `/v1/fan-audit-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "FanAuditRecord", id }],
    }),

    updateFanAuditRecord: builder.mutation<
      UpdateFanAuditRecordResponse,
      UpdateFanAuditRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/fan-audit-records/${id}`,
        method: "PUT",
        body: buildFanAuditFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "FanAuditRecord",
        { type: "FanAuditRecord", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteFanAuditRecord: builder.mutation<
      DeleteFanAuditRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/fan-audit-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "FanAuditRecord",
        { type: "FanAuditRecord", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateFanAuditRecordMutation,
  useGetFanAuditRecordsQuery,
  useGetFanAuditRecordByIdQuery,
  useUpdateFanAuditRecordMutation,
  useDeleteFanAuditRecordMutation,
} = fanAuditRecordApiSlice;