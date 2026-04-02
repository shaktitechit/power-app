import { apiSlice } from "./apiSlice";

export interface UtilityDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface UtilityAccount {
  _id: string;
  facility_id: string;
  account_number: string;
  connection_type: "LT" | "HT";
  category?: string;
  sanctioned_demand_kVA?: number;

  is_solar_connected: boolean;
  is_dg_connected: boolean;
  is_transformer_connected: boolean;
  is_pump_connected: boolean;
  is_transformer_maintained_by_facility: boolean;
  is_active: boolean;

  provider?: string;
  billing_cycle?: string;
  audit_date?: string;
  auditor_id?: string;

  documents: UtilityDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUtilityAccountRequest {
  facility_id: string;
  account_number: string;
  connection_type: "LT" | "HT";
  category?: string;
  sanctioned_demand_kVA?: number | string;

  is_solar_connected?: boolean;
  is_dg_connected?: boolean;
  is_transformer_connected?: boolean;
  is_pump_connected?: boolean;
  is_transformer_maintained_by_facility?: boolean;
  is_active?: boolean;

  provider?: string;
  billing_cycle?: string;
  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateUtilityAccountRequest {
  id: string;
  account_number?: string;
  connection_type?: "LT" | "HT";
  category?: string;
  sanctioned_demand_kVA?: number | string;

  is_solar_connected?: boolean;
  is_dg_connected?: boolean;
  is_transformer_connected?: boolean;
  is_pump_connected?: boolean;
  is_transformer_maintained_by_facility?: boolean;
  is_active?: boolean;

  provider?: string;
  billing_cycle?: string;
  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateUtilityAccountResponse {
  success: boolean;
  message: string;
  data: UtilityAccount;
}

export interface GetUtilityAccountsResponse {
  success: boolean;
  count: number;
  data: UtilityAccount[];
}

export interface GetUtilityAccountByIdResponse {
  success: boolean;
  data: UtilityAccount;
}

export interface UpdateUtilityAccountResponse {
  success: boolean;
  message: string;
  data: UtilityAccount;
}

export interface DeleteUtilityAccountResponse {
  success: boolean;
  message: string;
}

// Build FormData
const buildUtilityFormData = (
  data: Partial<CreateUtilityAccountRequest | UpdateUtilityAccountRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if (data.account_number !== undefined) {
    formData.append("account_number", data.account_number);
  }

  if (data.connection_type !== undefined) {
    formData.append("connection_type", data.connection_type);
  }

  if (data.category !== undefined) {
    formData.append("category", data.category);
  }

  if (data.sanctioned_demand_kVA !== undefined) {
    formData.append(
      "sanctioned_demand_kVA",
      String(data.sanctioned_demand_kVA)
    );
  }

  if (data.provider !== undefined) {
    formData.append("provider", data.provider);
  }

  if (data.billing_cycle !== undefined) {
    formData.append("billing_cycle", data.billing_cycle);
  }

  if (data.audit_date !== undefined) {
    formData.append("audit_date", data.audit_date);
  }

  if (data.auditor_id !== undefined) {
    formData.append("auditor_id", data.auditor_id);
  }

  if (data.is_solar_connected !== undefined) {
    formData.append(
      "is_solar_connected",
      String(data.is_solar_connected)
    );
  }

  if (data.is_dg_connected !== undefined) {
    formData.append("is_dg_connected", String(data.is_dg_connected));
  }

  if (data.is_transformer_connected !== undefined) {
    formData.append(
      "is_transformer_connected",
      String(data.is_transformer_connected)
    );
  }

  if (data.is_pump_connected !== undefined) {
    formData.append("is_pump_connected", String(data.is_pump_connected));
  }

  if (data.is_transformer_maintained_by_facility !== undefined) {
    formData.append(
      "is_transformer_maintained_by_facility",
      String(data.is_transformer_maintained_by_facility)
    );
  }

  if (data.is_active !== undefined) {
    formData.append("is_active", String(data.is_active));
  }

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  return formData;
};

export const utilityApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUtilityAccount: builder.mutation<
      CreateUtilityAccountResponse,
      CreateUtilityAccountRequest
    >({
      query: (data) => ({
        url: "/v1/utilities",
        method: "POST",
        body: buildUtilityFormData(data),
      }),
      invalidatesTags: ["UtilityAccount", "Facility"],
    }),

    getUtilityAccounts: builder.query<
      GetUtilityAccountsResponse,
      { facility_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/utilities",
        method: "GET",
        params: params?.facility_id ? { facility_id: params.facility_id } : {},
      }),
      providesTags: ["UtilityAccount"],
    }),

    getUtilityAccountById: builder.query<GetUtilityAccountByIdResponse, string>({
      query: (id) => ({
        url: `/v1/utilities/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "UtilityAccount", id }],
    }),

    updateUtilityAccount: builder.mutation<
      UpdateUtilityAccountResponse,
      UpdateUtilityAccountRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/utilities/${id}`,
        method: "PUT",
        body: buildUtilityFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "UtilityAccount",
        { type: "UtilityAccount", id },
        "Facility",
      ],
    }),

    deleteUtilityAccount: builder.mutation<
      DeleteUtilityAccountResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/utilities/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "UtilityAccount",
        { type: "UtilityAccount", id },
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateUtilityAccountMutation,
  useGetUtilityAccountsQuery,
  useGetUtilityAccountByIdQuery,
  useUpdateUtilityAccountMutation,
  useDeleteUtilityAccountMutation,
} = utilityApiSlice;