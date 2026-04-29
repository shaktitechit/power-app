import { apiSlice } from "../apiSlice";

export interface UtilityTariffDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface UtilityTariff {
  _id: string;
  utility_account_id: string;

  effective_from: string;
  effective_to?: string | null;

  basic_energy_charges_rs_per_unit?: number;
  fixed_charges_rs_per_kW_or_per_kVA?: number;
  ed_percent?: number;
  octroi_rs_per_unit?: number;
  surcharge_rs?: number;
  cow_cess_rs?: number;
  rental_rs?: number;
  infracess_rs?: number;
  other_charges_or_rebates_rs?: number;
  any_other_rs?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: UtilityTariffDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUtilityTariffRequest {
  utility_account_id: string;

  effective_from: string;
  effective_to?: string | null;

  basic_energy_charges_rs_per_unit?: number | string;
  fixed_charges_rs_per_kW_or_per_kVA?: number | string;
  ed_percent?: number | string;
  octroi_rs_per_unit?: number | string;
  surcharge_rs?: number | string;
  cow_cess_rs?: number | string;
  rental_rs?: number | string;
  infracess_rs?: number | string;
  other_charges_or_rebates_rs?: number | string;
  any_other_rs?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateUtilityTariffRequest {
  id: string;

  effective_from?: string;
  effective_to?: string | null;

  basic_energy_charges_rs_per_unit?: number | string;
  fixed_charges_rs_per_kW_or_per_kVA?: number | string;
  ed_percent?: number | string;
  octroi_rs_per_unit?: number | string;
  surcharge_rs?: number | string;
  cow_cess_rs?: number | string;
  rental_rs?: number | string;
  infracess_rs?: number | string;
  other_charges_or_rebates_rs?: number | string;
  any_other_rs?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateUtilityTariffResponse {
  success: boolean;
  message: string;
  data: UtilityTariff;
}

export interface GetUtilityTariffsResponse {
  success: boolean;
  count: number;
  data: UtilityTariff[];
}

export interface GetUtilityTariffByIdResponse {
  success: boolean;
  data: UtilityTariff;
}

export interface UpdateUtilityTariffResponse {
  success: boolean;
  message: string;
  data: UtilityTariff;
}

export interface DeleteUtilityTariffResponse {
  success: boolean;
  message: string;
}

const buildUtilityTariffFormData = (
  data: Partial<CreateUtilityTariffRequest | UpdateUtilityTariffRequest>
) => {
  const formData = new FormData();

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.effective_from !== undefined) {
    formData.append("effective_from", data.effective_from);
  }

  if (data.effective_to !== undefined && data.effective_to !== null) {
    formData.append("effective_to", data.effective_to);
  }

  if (data.basic_energy_charges_rs_per_unit !== undefined) {
    formData.append(
      "basic_energy_charges_rs_per_unit",
      String(data.basic_energy_charges_rs_per_unit)
    );
  }

  if (data.fixed_charges_rs_per_kW_or_per_kVA !== undefined) {
    formData.append(
      "fixed_charges_rs_per_kW_or_per_kVA",
      String(data.fixed_charges_rs_per_kW_or_per_kVA)
    );
  }

  if (data.ed_percent !== undefined) {
    formData.append("ed_percent", String(data.ed_percent));
  }

  if (data.octroi_rs_per_unit !== undefined) {
    formData.append("octroi_rs_per_unit", String(data.octroi_rs_per_unit));
  }

  if (data.surcharge_rs !== undefined) {
    formData.append("surcharge_rs", String(data.surcharge_rs));
  }

  if (data.cow_cess_rs !== undefined) {
    formData.append("cow_cess_rs", String(data.cow_cess_rs));
  }

  if (data.rental_rs !== undefined) {
    formData.append("rental_rs", String(data.rental_rs));
  }

  if (data.infracess_rs !== undefined) {
    formData.append("infracess_rs", String(data.infracess_rs));
  }

  if (data.other_charges_or_rebates_rs !== undefined) {
    formData.append(
      "other_charges_or_rebates_rs",
      String(data.other_charges_or_rebates_rs)
    );
  }

  if (data.any_other_rs !== undefined) {
    formData.append("any_other_rs", String(data.any_other_rs));
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

export const utilityTariffApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUtilityTariff: builder.mutation<
      CreateUtilityTariffResponse,
      CreateUtilityTariffRequest
    >({
      query: (data) => ({
        url: "/v1/utility-tariffs",
        method: "POST",
        body: buildUtilityTariffFormData(data),
      }),
      invalidatesTags: ["UtilityTariff", "UtilityAccount"],
    }),

    getUtilityTariffs: builder.query<
      GetUtilityTariffsResponse,
      { utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/utility-tariffs",
        method: "GET",
        params: params?.utility_account_id
          ? { utility_account_id: params.utility_account_id }
          : {},
      }),
      providesTags: ["UtilityTariff"],
    }),

    getUtilityTariffById: builder.query<GetUtilityTariffByIdResponse, string>({
      query: (id) => ({
        url: `/v1/utility-tariffs/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "UtilityTariff", id }],
    }),

    updateUtilityTariff: builder.mutation<
      UpdateUtilityTariffResponse,
      UpdateUtilityTariffRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/utility-tariffs/${id}`,
        method: "PUT",
        body: buildUtilityTariffFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "UtilityTariff",
        { type: "UtilityTariff", id },
        "UtilityAccount",
      ],
    }),

    deleteUtilityTariff: builder.mutation<
      DeleteUtilityTariffResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/utility-tariffs/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "UtilityTariff",
        { type: "UtilityTariff", id },
        "UtilityAccount",
      ],
    }),
  }),
});

export const {
  useCreateUtilityTariffMutation,
  useGetUtilityTariffsQuery,
  useGetUtilityTariffByIdQuery,
  useUpdateUtilityTariffMutation,
  useDeleteUtilityTariffMutation,
} = utilityTariffApiSlice;