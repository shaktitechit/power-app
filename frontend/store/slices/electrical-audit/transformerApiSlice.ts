import { apiSlice } from "../apiSlice";

export interface TransformerDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface Transformer {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  transformer_tag: string;
  rated_capacity_kVA?: number;
  type_of_cooling?: "ONAN" | "ONAF" | "OFWF" | "ODAF" | "dry";
  rated_HV_kV?: number;
  rated_LV_V?: number;
  rated_HV_current_A?: number;
  rated_LV_current_A?: number;
  no_load_loss_kW?: number;
  full_load_loss_kW?: number;
  nameplate_efficiency_percent?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: TransformerDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTransformerRequest {
  facility_id: string;
  utility_account_id: string;

  transformer_tag: string;
  rated_capacity_kVA?: number | string;
  type_of_cooling?: "ONAN" | "ONAF" | "OFWF" | "ODAF" | "dry";
  rated_HV_kV?: number | string;
  rated_LV_V?: number | string;
  rated_HV_current_A?: number | string;
  rated_LV_current_A?: number | string;
  no_load_loss_kW?: number | string;
  full_load_loss_kW?: number | string;
  nameplate_efficiency_percent?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateTransformerRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  transformer_tag?: string;
  rated_capacity_kVA?: number | string;
  type_of_cooling?: "ONAN" | "ONAF" | "OFWF" | "ODAF" | "dry";
  rated_HV_kV?: number | string;
  rated_LV_V?: number | string;
  rated_HV_current_A?: number | string;
  rated_LV_current_A?: number | string;
  no_load_loss_kW?: number | string;
  full_load_loss_kW?: number | string;
  nameplate_efficiency_percent?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateTransformerResponse {
  success: boolean;
  message: string;
  data: Transformer;
}

export interface GetTransformersResponse {
  success: boolean;
  count: number;
  data: Transformer[];
}

export interface GetTransformerByIdResponse {
  success: boolean;
  data: Transformer;
}

export interface UpdateTransformerResponse {
  success: boolean;
  message: string;
  data: Transformer;
}

export interface DeleteTransformerResponse {
  success: boolean;
  message: string;
}

const buildTransformerFormData = (
  data: Partial<CreateTransformerRequest | UpdateTransformerRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.transformer_tag !== undefined) {
    formData.append("transformer_tag", data.transformer_tag);
  }

  if (data.rated_capacity_kVA !== undefined) {
    formData.append("rated_capacity_kVA", String(data.rated_capacity_kVA));
  }

  if (data.type_of_cooling !== undefined) {
    formData.append("type_of_cooling", data.type_of_cooling);
  }

  if (data.rated_HV_kV !== undefined) {
    formData.append("rated_HV_kV", String(data.rated_HV_kV));
  }

  if (data.rated_LV_V !== undefined) {
    formData.append("rated_LV_V", String(data.rated_LV_V));
  }

  if (data.rated_HV_current_A !== undefined) {
    formData.append("rated_HV_current_A", String(data.rated_HV_current_A));
  }

  if (data.rated_LV_current_A !== undefined) {
    formData.append("rated_LV_current_A", String(data.rated_LV_current_A));
  }

  if (data.no_load_loss_kW !== undefined) {
    formData.append("no_load_loss_kW", String(data.no_load_loss_kW));
  }

  if (data.full_load_loss_kW !== undefined) {
    formData.append("full_load_loss_kW", String(data.full_load_loss_kW));
  }

  if (data.nameplate_efficiency_percent !== undefined) {
    formData.append(
      "nameplate_efficiency_percent",
      String(data.nameplate_efficiency_percent)
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

export const transformerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createTransformer: builder.mutation<
      CreateTransformerResponse,
      CreateTransformerRequest
    >({
      query: (data) => ({
        url: "/v1/transformers",
        method: "POST",
        body: buildTransformerFormData(data),
      }),
      invalidatesTags: ["Transformer", "UtilityAccount", "Facility"],
    }),

    getTransformers: builder.query<
      GetTransformersResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/transformers",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["Transformer"],
    }),

    getTransformerById: builder.query<GetTransformerByIdResponse, string>({
      query: (id) => ({
        url: `/v1/transformers/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Transformer", id }],
    }),

    updateTransformer: builder.mutation<
      UpdateTransformerResponse,
      UpdateTransformerRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/transformers/${id}`,
        method: "PUT",
        body: buildTransformerFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Transformer",
        { type: "Transformer", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteTransformer: builder.mutation<DeleteTransformerResponse, string>({
      query: (id) => ({
        url: `/v1/transformers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Transformer",
        { type: "Transformer", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateTransformerMutation,
  useGetTransformersQuery,
  useGetTransformerByIdQuery,
  useUpdateTransformerMutation,
  useDeleteTransformerMutation,
} = transformerApiSlice;