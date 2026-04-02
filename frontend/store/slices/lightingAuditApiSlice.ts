import { apiSlice } from "./apiSlice";

export interface LightingAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface LightingAuditRecord {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  area_location?: string;
  fixture_type?:
    | "tube_light"
    | "bulb"
    | "led_panel"
    | "flood_light"
    | "street_light"
    | "other";
  lamp_type?:
    | "LED"
    | "CFL"
    | "fluorescent"
    | "halogen"
    | "incandescent"
    | "other";
  wattage_W?: number | string;
  quantity_nos?: number | string;
  control_type?: "manual" | "sensor" | "timer" | "bms" | "other";
  working_hours_per_day?: number | string;
  working_days_per_year?: number | string;
  connected_load_kW?: number | string;
  annual_energy_kWh?: number | string;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents: LightingAuditDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLightingAuditRequest {
  facility_id: string;
  utility_account_id: string;

  area_location?: string;
  fixture_type?:
    | "tube_light"
    | "bulb"
    | "led_panel"
    | "flood_light"
    | "street_light"
    | "other";
  lamp_type?:
    | "LED"
    | "CFL"
    | "fluorescent"
    | "halogen"
    | "incandescent"
    | "other";
  wattage_W?: number | string;
  quantity_nos?: number | string;
  control_type?: "manual" | "sensor" | "timer" | "bms" | "other";
  working_hours_per_day?: number | string;
  working_days_per_year?: number | string;
  connected_load_kW?: number | string;
  annual_energy_kWh?: number | string;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateLightingAuditRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  area_location?: string;
  fixture_type?:
    | "tube_light"
    | "bulb"
    | "led_panel"
    | "flood_light"
    | "street_light"
    | "other";
  lamp_type?:
    | "LED"
    | "CFL"
    | "fluorescent"
    | "halogen"
    | "incandescent"
    | "other";
  wattage_W?: number | string;
  quantity_nos?: number | string;
  control_type?: "manual" | "sensor" | "timer" | "bms" | "other";
  working_hours_per_day?: number | string;
  working_days_per_year?: number | string;
  connected_load_kW?: number | string;
  annual_energy_kWh?: number | string;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateLightingAuditResponse {
  success: boolean;
  message?: string;
  data: LightingAuditRecord;
}

export interface GetLightingAuditRecordsResponse {
  success: boolean;
  count: number;
  data: LightingAuditRecord[];
}

export interface GetLightingAuditRecordByIdResponse {
  success: boolean;
  data: LightingAuditRecord;
}

export interface UpdateLightingAuditResponse {
  success: boolean;
  message?: string;
  data: LightingAuditRecord;
}

export interface DeleteLightingAuditResponse {
  success: boolean;
  message: string;
}

const buildLightingAuditFormData = (
  data: Partial<CreateLightingAuditRequest | UpdateLightingAuditRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.area_location !== undefined && data.area_location !== null) {
    formData.append("area_location", data.area_location);
  }

  if (data.fixture_type !== undefined && data.fixture_type !== null) {
    formData.append("fixture_type", data.fixture_type);
  }

  if (data.lamp_type !== undefined && data.lamp_type !== null) {
    formData.append("lamp_type", data.lamp_type);
  }

  if (data.wattage_W !== undefined && data.wattage_W !== null) {
    formData.append("wattage_W", String(data.wattage_W));
  }

  if (data.quantity_nos !== undefined && data.quantity_nos !== null) {
    formData.append("quantity_nos", String(data.quantity_nos));
  }

  if (data.control_type !== undefined && data.control_type !== null) {
    formData.append("control_type", data.control_type);
  }

  if (
    data.working_hours_per_day !== undefined &&
    data.working_hours_per_day !== null
  ) {
    formData.append(
      "working_hours_per_day",
      String(data.working_hours_per_day)
    );
  }

  if (
    data.working_days_per_year !== undefined &&
    data.working_days_per_year !== null
  ) {
    formData.append(
      "working_days_per_year",
      String(data.working_days_per_year)
    );
  }

  if (data.connected_load_kW !== undefined && data.connected_load_kW !== null) {
    formData.append("connected_load_kW", String(data.connected_load_kW));
  }

  if (
    data.annual_energy_kWh !== undefined &&
    data.annual_energy_kWh !== null
  ) {
    formData.append("annual_energy_kWh", String(data.annual_energy_kWh));
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

export const lightingAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLightingAudit: builder.mutation<
      CreateLightingAuditResponse,
      CreateLightingAuditRequest
    >({
      query: (data) => ({
        url: "/v1/lighting-audits",
        method: "POST",
        body: buildLightingAuditFormData(data),
      }),
      invalidatesTags: ["LightingAudit", "UtilityAccount", "Facility"],
    }),

    getLightingAudits: builder.query<
      GetLightingAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/lighting-audits",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["LightingAudit"],
    }),

    getLightingAuditById: builder.query<
      GetLightingAuditRecordByIdResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/lighting-audits/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "LightingAudit", id }],
    }),

    updateLightingAudit: builder.mutation<
      UpdateLightingAuditResponse,
      UpdateLightingAuditRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/lighting-audits/${id}`,
        method: "PUT",
        body: buildLightingAuditFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "LightingAudit",
        { type: "LightingAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteLightingAudit: builder.mutation<
      DeleteLightingAuditResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/lighting-audits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "LightingAudit",
        { type: "LightingAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateLightingAuditMutation,
  useGetLightingAuditsQuery,
  useGetLightingAuditByIdQuery,
  useUpdateLightingAuditMutation,
  useDeleteLightingAuditMutation,
} = lightingAuditApiSlice;