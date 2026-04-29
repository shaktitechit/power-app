import { apiSlice } from "../apiSlice";

export interface UtilityBillingRecordDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface UtilityBillingRecord {
  _id: string;
  utility_account_id: string;

  billing_period_start: string;
  billing_period_end: string;
  billing_days?: number;

  bill_no?: string;

  mdi_kVA?: number;
  units_kWh?: number;
  units_kVAh?: number;
  pf?: number;

  fixed_charges_rs?: number;
  energy_charges_rs?: number;
  taxes_and_rent_rs?: number;
  other_charges_rs?: number;
  rebate_subsidy_rs?: number;
  monthly_electricity_bill_rs?: number;

  unit_consumption_per_day_kVAh?: number;
  average_per_unit_cost_rs?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: UtilityBillingRecordDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUtilityBillingRecordRequest {
  utility_account_id: string;

  billing_period_start: string;
  billing_period_end: string;
  billing_days?: number | string;

  bill_no?: string;

  mdi_kVA?: number | string;
  units_kWh?: number | string;
  units_kVAh?: number | string;
  pf?: number | string;

  fixed_charges_rs?: number | string;
  energy_charges_rs?: number | string;
  taxes_and_rent_rs?: number | string;
  other_charges_rs?: number | string;
  rebate_subsidy_rs?: number | string;
  monthly_electricity_bill_rs?: number | string;

  unit_consumption_per_day_kVAh?: number | string;
  average_per_unit_cost_rs?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateUtilityBillingRecordRequest {
  id: string;

  billing_period_start?: string;
  billing_period_end?: string;
  billing_days?: number | string;

  bill_no?: string;

  mdi_kVA?: number | string;
  units_kWh?: number | string;
  units_kVAh?: number | string;
  pf?: number | string;

  fixed_charges_rs?: number | string;
  energy_charges_rs?: number | string;
  taxes_and_rent_rs?: number | string;
  other_charges_rs?: number | string;
  rebate_subsidy_rs?: number | string;
  monthly_electricity_bill_rs?: number | string;

  unit_consumption_per_day_kVAh?: number | string;
  average_per_unit_cost_rs?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateUtilityBillingRecordResponse {
  success: boolean;
  message: string;
  data: UtilityBillingRecord;
}

export interface GetUtilityBillingRecordsResponse {
  success: boolean;
  count: number;
  data: UtilityBillingRecord[];
}

export interface GetUtilityBillingRecordByIdResponse {
  success: boolean;
  data: UtilityBillingRecord;
}

export interface UpdateUtilityBillingRecordResponse {
  success: boolean;
  message: string;
  data: UtilityBillingRecord;
}

export interface DeleteUtilityBillingRecordResponse {
  success: boolean;
  message: string;
}

const buildUtilityBillingRecordFormData = (
  data: Partial<
    CreateUtilityBillingRecordRequest | UpdateUtilityBillingRecordRequest
  >
) => {
  const formData = new FormData();

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.billing_period_start !== undefined) {
    formData.append("billing_period_start", data.billing_period_start);
  }

  if (data.billing_period_end !== undefined) {
    formData.append("billing_period_end", data.billing_period_end);
  }

  if (data.billing_days !== undefined) {
    formData.append("billing_days", String(data.billing_days));
  }

  if (data.bill_no !== undefined) {
    formData.append("bill_no", data.bill_no);
  }

  if (data.mdi_kVA !== undefined) {
    formData.append("mdi_kVA", String(data.mdi_kVA));
  }

  if (data.units_kWh !== undefined) {
    formData.append("units_kWh", String(data.units_kWh));
  }

  if (data.units_kVAh !== undefined) {
    formData.append("units_kVAh", String(data.units_kVAh));
  }

  if (data.pf !== undefined) {
    formData.append("pf", String(data.pf));
  }

  if (data.fixed_charges_rs !== undefined) {
    formData.append("fixed_charges_rs", String(data.fixed_charges_rs));
  }

  if (data.energy_charges_rs !== undefined) {
    formData.append("energy_charges_rs", String(data.energy_charges_rs));
  }

  if (data.taxes_and_rent_rs !== undefined) {
    formData.append("taxes_and_rent_rs", String(data.taxes_and_rent_rs));
  }

  if (data.other_charges_rs !== undefined) {
    formData.append("other_charges_rs", String(data.other_charges_rs));
  }

  if (data.rebate_subsidy_rs !== undefined) {
    formData.append("rebate_subsidy_rs", String(data.rebate_subsidy_rs));
  }

  if (data.monthly_electricity_bill_rs !== undefined) {
    formData.append(
      "monthly_electricity_bill_rs",
      String(data.monthly_electricity_bill_rs)
    );
  }

  if (data.unit_consumption_per_day_kVAh !== undefined) {
    formData.append(
      "unit_consumption_per_day_kVAh",
      String(data.unit_consumption_per_day_kVAh)
    );
  }

  if (data.average_per_unit_cost_rs !== undefined) {
    formData.append(
      "average_per_unit_cost_rs",
      String(data.average_per_unit_cost_rs)
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

export const utilityBillingRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createUtilityBillingRecord: builder.mutation<
      CreateUtilityBillingRecordResponse,
      CreateUtilityBillingRecordRequest
    >({
      query: (data) => ({
        url: "/v1/utility-billing-records",
        method: "POST",
        body: buildUtilityBillingRecordFormData(data),
      }),
      invalidatesTags: ["UtilityBillingRecord", "UtilityAccount"],
    }),

    getUtilityBillingRecords: builder.query<
      GetUtilityBillingRecordsResponse,
      { utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/utility-billing-records",
        method: "GET",
        params: params?.utility_account_id
          ? { utility_account_id: params.utility_account_id }
          : {},
      }),
      providesTags: ["UtilityBillingRecord"],
    }),

    getUtilityBillingRecordById: builder.query<
      GetUtilityBillingRecordByIdResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/utility-billing-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "UtilityBillingRecord", id },
      ],
    }),

    updateUtilityBillingRecord: builder.mutation<
      UpdateUtilityBillingRecordResponse,
      UpdateUtilityBillingRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/utility-billing-records/${id}`,
        method: "PUT",
        body: buildUtilityBillingRecordFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "UtilityBillingRecord",
        { type: "UtilityBillingRecord", id },
        "UtilityAccount",
      ],
    }),

    deleteUtilityBillingRecord: builder.mutation<
      DeleteUtilityBillingRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/utility-billing-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "UtilityBillingRecord",
        { type: "UtilityBillingRecord", id },
        "UtilityAccount",
      ],
    }),
  }),
});

export const {
  useCreateUtilityBillingRecordMutation,
  useGetUtilityBillingRecordsQuery,
  useGetUtilityBillingRecordByIdQuery,
  useUpdateUtilityBillingRecordMutation,
  useDeleteUtilityBillingRecordMutation,
} = utilityBillingRecordApiSlice;