import { apiSlice } from "./apiSlice";

export interface DGSetDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface DGSet {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  dg_number: string;
  make_model?: string;
  year_of_installation?: number;
  rated_capacity_kVA?: number;
  rated_active_power_kW?: number;
  rated_voltage_V?: number;
  rated_speed_RPM?: number;
  fuel_type?: "diesel" | "gas" | "dual";

  audit_date?: string;
  auditor_id?: string;

  documents: DGSetDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDGSetRequest {
  facility_id: string;
  utility_account_id: string;

  dg_number: string;
  make_model?: string;
  year_of_installation?: number | string;
  rated_capacity_kVA?: number | string;
  rated_active_power_kW?: number | string;
  rated_voltage_V?: number | string;
  rated_speed_RPM?: number | string;
  fuel_type?: "diesel" | "gas" | "dual";

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateDGSetRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  dg_number?: string;
  make_model?: string;
  year_of_installation?: number | string;
  rated_capacity_kVA?: number | string;
  rated_active_power_kW?: number | string;
  rated_voltage_V?: number | string;
  rated_speed_RPM?: number | string;
  fuel_type?: "diesel" | "gas" | "dual";

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateDGSetResponse {
  success: boolean;
  message: string;
  data: DGSet;
}

export interface GetDGSetsResponse {
  success: boolean;
  count: number;
  data: DGSet[];
}

export interface GetDGSetByIdResponse {
  success: boolean;
  data: DGSet;
}

export interface UpdateDGSetResponse {
  success: boolean;
  message: string;
  data: DGSet;
}

export interface DeleteDGSetResponse {
  success: boolean;
  message: string;
}

const buildDGSetFormData = (
  data: Partial<CreateDGSetRequest | UpdateDGSetRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.dg_number !== undefined) {
    formData.append("dg_number", data.dg_number);
  }

  if (data.make_model !== undefined) {
    formData.append("make_model", data.make_model);
  }

  if (data.year_of_installation !== undefined) {
    formData.append(
      "year_of_installation",
      String(data.year_of_installation)
    );
  }

  if (data.rated_capacity_kVA !== undefined) {
    formData.append("rated_capacity_kVA", String(data.rated_capacity_kVA));
  }

  if (data.rated_active_power_kW !== undefined) {
    formData.append(
      "rated_active_power_kW",
      String(data.rated_active_power_kW)
    );
  }

  if (data.rated_voltage_V !== undefined) {
    formData.append("rated_voltage_V", String(data.rated_voltage_V));
  }

  if (data.rated_speed_RPM !== undefined) {
    formData.append("rated_speed_RPM", String(data.rated_speed_RPM));
  }

  if (data.fuel_type !== undefined) {
    formData.append("fuel_type", data.fuel_type);
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

export const dgSetApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createDGSet: builder.mutation<CreateDGSetResponse, CreateDGSetRequest>({
      query: (data) => ({
        url: "/v1/dg-sets",
        method: "POST",
        body: buildDGSetFormData(data),
      }),
      invalidatesTags: ["DGSet", "UtilityAccount", "Facility"],
    }),

    getDGSets: builder.query<
      GetDGSetsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/dg-sets",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["DGSet"],
    }),

    getDGSetById: builder.query<GetDGSetByIdResponse, string>({
      query: (id) => ({
        url: `/v1/dg-sets/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "DGSet", id }],
    }),

    updateDGSet: builder.mutation<UpdateDGSetResponse, UpdateDGSetRequest>({
      query: ({ id, ...data }) => ({
        url: `/v1/dg-sets/${id}`,
        method: "PUT",
        body: buildDGSetFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "DGSet",
        { type: "DGSet", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteDGSet: builder.mutation<DeleteDGSetResponse, string>({
      query: (id) => ({
        url: `/v1/dg-sets/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "DGSet",
        { type: "DGSet", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateDGSetMutation,
  useGetDGSetsQuery,
  useGetDGSetByIdQuery,
  useUpdateDGSetMutation,
  useDeleteDGSetMutation,
} = dgSetApiSlice;