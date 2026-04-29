import { apiSlice } from "../apiSlice";

/* =============================
   ðŸ“‚ TYPES
============================= */

export interface TransformerAuditDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface TransformerAuditRecord {
  _id: string;

  transformer_id: string;
  utility_account_id: string;
  facility_id: string;

  total_losses_kW?: number;
  average_load_kVA?: number;
  percent_loading?: number;
  max_load_kVA?: number;
  load_factor_percent?: number;

  operating_hours_per_year?: number;
  annual_energy_supplied_kWh?: number;
  annual_energy_losses_kWh?: number;

  per_unit_cost_rs?: number;
  cost_of_losses_rs?: number;

  power_factor_LT?: number;
  harmonics_THD_percent?: number;

  neutral_earth_resistance_ohms?: number;
  body_to_earth_resistance_ohms?: number;

  silica_gel_cobalt_type?: "good" | "moderate" | "poor";
  silica_gel_non_cobalt_type?: "good" | "moderate" | "poor";
  oil_level?: "low" | "normal" | "high";

  line_voltage_Vr?: number;
  line_voltage_Vy?: number;
  line_voltage_Vb?: number;

  phase_voltage_Vr_n?: number;
  phase_voltage_Vy_n?: number;
  phase_voltage_Vb_n?: number;

  line_current_Ir?: number;
  line_current_Iy?: number;
  line_current_Ib?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: TransformerAuditDocument[];

  created_at?: string;
  updated_at?: string;
}

/* =============================
   ðŸ“¤ REQUEST TYPES
============================= */

export interface CreateTransformerAuditRecordRequest {
  transformer_id: string;
  utility_account_id: string;
  facility_id: string;

  total_losses_kW?: number | string;
  average_load_kVA?: number | string;
  percent_loading?: number | string;
  max_load_kVA?: number | string;
  load_factor_percent?: number | string;

  operating_hours_per_year?: number | string;
  annual_energy_supplied_kWh?: number | string;
  annual_energy_losses_kWh?: number | string;

  per_unit_cost_rs?: number | string;
  cost_of_losses_rs?: number | string;

  power_factor_LT?: number | string;
  harmonics_THD_percent?: number | string;

  neutral_earth_resistance_ohms?: number | string;
  body_to_earth_resistance_ohms?: number | string;

  silica_gel_cobalt_type?: "good" | "moderate" | "poor";
  silica_gel_non_cobalt_type?: "good" | "moderate" | "poor";
  oil_level?: "low" | "normal" | "high";

  line_voltage_Vr?: number | string;
  line_voltage_Vy?: number | string;
  line_voltage_Vb?: number | string;

  phase_voltage_Vr_n?: number | string;
  phase_voltage_Vy_n?: number | string;
  phase_voltage_Vb_n?: number | string;

  line_current_Ir?: number | string;
  line_current_Iy?: number | string;
  line_current_Ib?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateTransformerAuditRecordRequest
  extends Partial<CreateTransformerAuditRecordRequest> {
  id: string;
}

/* =============================
   ðŸ“¥ RESPONSE TYPES
============================= */

export interface CreateTransformerAuditRecordResponse {
  success: boolean;
  message: string;
  data: TransformerAuditRecord;
}

export interface GetTransformerAuditRecordsResponse {
  success: boolean;
  count: number;
  data: TransformerAuditRecord[];
}

export interface GetTransformerAuditRecordByIdResponse {
  success: boolean;
  data: TransformerAuditRecord;
}

export interface UpdateTransformerAuditRecordResponse {
  success: boolean;
  message: string;
  data: TransformerAuditRecord;
}

export interface DeleteTransformerAuditRecordResponse {
  success: boolean;
  message: string;
}

/* =============================
   ðŸ§  FORM DATA BUILDER
============================= */

const buildFormData = (
  data: Partial<CreateTransformerAuditRecordRequest>
) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && key !== "documents") {
      formData.append(key, String(value));
    }
  });

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  return formData;
};

/* =============================
   ðŸš€ API SLICE
============================= */

export const transformerAuditRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({

    // âž• CREATE
    createTransformerAuditRecord: builder.mutation<
      CreateTransformerAuditRecordResponse,
      CreateTransformerAuditRecordRequest
    >({
      query: (data) => ({
        url: "/v1/transformer-audit-records",
        method: "POST",
        body: buildFormData(data),
      }),
      invalidatesTags: ["TransformerAuditRecord", "Transformer"],
    }),

    // ðŸ“¥ GET ALL
    getTransformerAuditRecords: builder.query<
      GetTransformerAuditRecordsResponse,
      { facility_id?: string; utility_account_id?: string; transformer_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/transformer-audit-records",
        method: "GET",
        params: {
          ...(params?.facility_id && { facility_id: params.facility_id }),
          ...(params?.utility_account_id && { utility_account_id: params.utility_account_id }),
          ...(params?.transformer_id && { transformer_id: params.transformer_id }),
        },
      }),
      providesTags: ["TransformerAuditRecord"],
    }),

    // ðŸ“„ GET BY ID
    getTransformerAuditRecordById: builder.query<
      GetTransformerAuditRecordByIdResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/transformer-audit-records/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => [
        { type: "TransformerAuditRecord", id },
      ],
    }),

    // âœï¸ UPDATE
    updateTransformerAuditRecord: builder.mutation<
      UpdateTransformerAuditRecordResponse,
      UpdateTransformerAuditRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/transformer-audit-records/${id}`,
        method: "PUT",
        body: buildFormData(data),
      }),
      invalidatesTags: (_res, _err, { id }) => [
        "TransformerAuditRecord",
        { type: "TransformerAuditRecord", id },
        "Transformer",
      ],
    }),

    // âŒ DELETE
    deleteTransformerAuditRecord: builder.mutation<
      DeleteTransformerAuditRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/transformer-audit-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        "TransformerAuditRecord",
        { type: "TransformerAuditRecord", id },
      ],
    }),
  }),
});

/* =============================
   ðŸŽ£ HOOKS
============================= */

export const {
  useCreateTransformerAuditRecordMutation,
  useGetTransformerAuditRecordsQuery,
  useGetTransformerAuditRecordByIdQuery,
  useUpdateTransformerAuditRecordMutation,
  useDeleteTransformerAuditRecordMutation,
} = transformerAuditRecordApiSlice;