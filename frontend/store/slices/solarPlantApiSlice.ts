import { apiSlice } from "./apiSlice";

export interface SolarPlantDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface SolarPlant {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  plant_name?: string;
  rating_kWp?: number;
  panel_rating_watt?: number;
  no_of_panels?: number;
  inverter_make?: string;
  inverter_rating_kW?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: SolarPlantDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSolarPlantRequest {
  facility_id: string;
  utility_account_id: string;

  plant_name?: string;
  rating_kWp?: number | string;
  panel_rating_watt?: number | string;
  no_of_panels?: number | string;
  inverter_make?: string;
  inverter_rating_kW?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateSolarPlantRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  plant_name?: string;
  rating_kWp?: number | string;
  panel_rating_watt?: number | string;
  no_of_panels?: number | string;
  inverter_make?: string;
  inverter_rating_kW?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateSolarPlantResponse {
  success: boolean;
  message: string;
  data: SolarPlant;
}

export interface GetSolarPlantsResponse {
  success: boolean;
  count: number;
  data: SolarPlant[];
}

export interface GetSolarPlantByIdResponse {
  success: boolean;
  data: SolarPlant;
}

export interface UpdateSolarPlantResponse {
  success: boolean;
  message: string;
  data: SolarPlant;
}

export interface DeleteSolarPlantResponse {
  success: boolean;
  message: string;
}

const buildSolarPlantFormData = (
  data: Partial<CreateSolarPlantRequest | UpdateSolarPlantRequest>
) => {
  const formData = new FormData();

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if (data.plant_name !== undefined) {
    formData.append("plant_name", data.plant_name);
  }

  if (data.rating_kWp !== undefined) {
    formData.append("rating_kWp", String(data.rating_kWp));
  }

  if (data.panel_rating_watt !== undefined) {
    formData.append("panel_rating_watt", String(data.panel_rating_watt));
  }

  if (data.no_of_panels !== undefined) {
    formData.append("no_of_panels", String(data.no_of_panels));
  }

  if (data.inverter_make !== undefined) {
    formData.append("inverter_make", data.inverter_make);
  }

  if (data.inverter_rating_kW !== undefined) {
    formData.append("inverter_rating_kW", String(data.inverter_rating_kW));
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

export const solarPlantApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSolarPlant: builder.mutation<
      CreateSolarPlantResponse,
      CreateSolarPlantRequest
    >({
      query: (data) => ({
        url: "/v1/solar-plants",
        method: "POST",
        body: buildSolarPlantFormData(data),
      }),
      invalidatesTags: ["SolarPlant", "UtilityAccount", "Facility"],
    }),

    getSolarPlants: builder.query<
      GetSolarPlantsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/solar-plants",
        method: "GET",
        params: {
          ...(params?.facility_id
            ? { facility_id: params.facility_id }
            : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["SolarPlant"],
    }),

    getSolarPlantById: builder.query<GetSolarPlantByIdResponse, string>({
      query: (id) => ({
        url: `/v1/solar-plants/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "SolarPlant", id }],
    }),

    updateSolarPlant: builder.mutation<
      UpdateSolarPlantResponse,
      UpdateSolarPlantRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/solar-plants/${id}`,
        method: "PUT",
        body: buildSolarPlantFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "SolarPlant",
        { type: "SolarPlant", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteSolarPlant: builder.mutation<DeleteSolarPlantResponse, string>({
      query: (id) => ({
        url: `/v1/solar-plants/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "SolarPlant",
        { type: "SolarPlant", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateSolarPlantMutation,
  useGetSolarPlantsQuery,
  useGetSolarPlantByIdQuery,
  useUpdateSolarPlantMutation,
  useDeleteSolarPlantMutation,
} = solarPlantApiSlice;