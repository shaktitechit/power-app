import { apiSlice } from "./apiSlice";

export interface MiscLoadAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface MiscLoadAuditRecord {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  equipment_name: string;
  category?: string;
  location_department?: string;

  quantity?: number | string;
  rated_power_kW?: number | string;
  average_operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  load_factor_percent?: number | string;
  estimated_annual_energy_kWh?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents: MiscLoadAuditDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMiscLoadAuditRequest {
  facility_id: string;
  utility_account_id: string;

  equipment_name: string;
  category?: string;
  location_department?: string;

  quantity?: number | string;
  rated_power_kW?: number | string;
  average_operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  load_factor_percent?: number | string;
  estimated_annual_energy_kWh?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateMiscLoadAuditRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  equipment_name?: string;
  category?: string;
  location_department?: string;

  quantity?: number | string;
  rated_power_kW?: number | string;
  average_operating_hours_per_day?: number | string;
  operating_days_per_year?: number | string;
  load_factor_percent?: number | string;
  estimated_annual_energy_kWh?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateMiscLoadAuditResponse {
  success: boolean;
  message?: string;
  data: MiscLoadAuditRecord;
}

export interface GetMiscLoadAuditsResponse {
  success: boolean;
  count: number;
  data: MiscLoadAuditRecord[];
}

export interface GetMiscLoadAuditByIdResponse {
  success: boolean;
  data: MiscLoadAuditRecord;
}

export interface UpdateMiscLoadAuditResponse {
  success: boolean;
  message?: string;
  data: MiscLoadAuditRecord;
}

export interface DeleteMiscLoadAuditResponse {
  success: boolean;
  message: string;
}

const buildMiscLoadAuditFormData = (
  data: Partial<CreateMiscLoadAuditRequest | UpdateMiscLoadAuditRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.equipment_name !== undefined && data.equipment_name !== null) {
    formData.append("equipment_name", data.equipment_name);
  }

  if (data.category !== undefined && data.category !== null) {
    formData.append("category", data.category);
  }

  if (
    data.location_department !== undefined &&
    data.location_department !== null
  ) {
    formData.append("location_department", data.location_department);
  }

  if (data.quantity !== undefined && data.quantity !== null) {
    formData.append("quantity", String(data.quantity));
  }

  if (data.rated_power_kW !== undefined && data.rated_power_kW !== null) {
    formData.append("rated_power_kW", String(data.rated_power_kW));
  }

  if (
    data.average_operating_hours_per_day !== undefined &&
    data.average_operating_hours_per_day !== null
  ) {
    formData.append(
      "average_operating_hours_per_day",
      String(data.average_operating_hours_per_day)
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
    data.load_factor_percent !== undefined &&
    data.load_factor_percent !== null
  ) {
    formData.append("load_factor_percent", String(data.load_factor_percent));
  }

  if (
    data.estimated_annual_energy_kWh !== undefined &&
    data.estimated_annual_energy_kWh !== null
  ) {
    formData.append(
      "estimated_annual_energy_kWh",
      String(data.estimated_annual_energy_kWh)
    );
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

export const miscLoadAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createMiscLoadAudit: builder.mutation<
      CreateMiscLoadAuditResponse,
      CreateMiscLoadAuditRequest
    >({
      query: (data) => ({
        url: "/v1/misc-load-audits",
        method: "POST",
        body: buildMiscLoadAuditFormData(data),
      }),
      invalidatesTags: ["MiscLoadAudit", "UtilityAccount", "Facility"],
    }),

    getMiscLoadAudits: builder.query<
      GetMiscLoadAuditsResponse,
      { facility_id?: string; utility_account_id?: string; category?: string } | void
    >({
      query: (params) => ({
        url: "/v1/misc-load-audits",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
          ...(params?.category ? { category: params.category } : {}),
        },
      }),
      providesTags: ["MiscLoadAudit"],
    }),

    getMiscLoadAuditById: builder.query<GetMiscLoadAuditByIdResponse, string>({
      query: (id) => ({
        url: `/v1/misc-load-audits/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "MiscLoadAudit", id }],
    }),

    updateMiscLoadAudit: builder.mutation<
      UpdateMiscLoadAuditResponse,
      UpdateMiscLoadAuditRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/misc-load-audits/${id}`,
        method: "PUT",
        body: buildMiscLoadAuditFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "MiscLoadAudit",
        { type: "MiscLoadAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteMiscLoadAudit: builder.mutation<
      DeleteMiscLoadAuditResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/misc-load-audits/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "MiscLoadAudit",
        { type: "MiscLoadAudit", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateMiscLoadAuditMutation,
  useGetMiscLoadAuditsQuery,
  useGetMiscLoadAuditByIdQuery,
  useUpdateMiscLoadAuditMutation,
  useDeleteMiscLoadAuditMutation,
} = miscLoadAuditApiSlice;