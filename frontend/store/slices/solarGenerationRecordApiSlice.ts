import { apiSlice } from "./apiSlice";

export interface SolarGenerationRecordDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface SolarGenerationRecord {
  _id: string;
  solar_plant_id: string;
  utility_account_id: string;
  facility_id: string;

  billing_period_start: string;
  billing_period_end: string;
  billing_days?: number;
  bill_no?: string;

  import_kWh?: number;
  import_kVAh?: number;
  import_kVA?: number;

  export_kWh?: number;
  export_kVAh?: number;
  export_kVA?: number;

  net_kWh?: number;
  net_kVAh?: number;
  net_kVA?: number;

  solar_generation_kWh?: number;
  solar_generation_kVAh?: number;
  solar_generation_kVA?: number;

  audit_date?: string;
  auditor_id?: string;

  documents: SolarGenerationRecordDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSolarGenerationRecordRequest {
  solar_plant_id: string;
  utility_account_id: string;
  facility_id: string;

  billing_period_start: string;
  billing_period_end: string;
  billing_days?: number | string;
  bill_no?: string;

  import_kWh?: number | string;
  import_kVAh?: number | string;
  import_kVA?: number | string;

  export_kWh?: number | string;
  export_kVAh?: number | string;
  export_kVA?: number | string;

  net_kWh?: number | string;
  net_kVAh?: number | string;
  net_kVA?: number | string;

  solar_generation_kWh?: number | string;
  solar_generation_kVAh?: number | string;
  solar_generation_kVA?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateSolarGenerationRecordRequest {
  id: string;

  solar_plant_id?: string;
  utility_account_id?: string;
  facility_id?: string;

  billing_period_start?: string;
  billing_period_end?: string;
  billing_days?: number | string;
  bill_no?: string;

  import_kWh?: number | string;
  import_kVAh?: number | string;
  import_kVA?: number | string;

  export_kWh?: number | string;
  export_kVAh?: number | string;
  export_kVA?: number | string;

  net_kWh?: number | string;
  net_kVAh?: number | string;
  net_kVA?: number | string;

  solar_generation_kWh?: number | string;
  solar_generation_kVAh?: number | string;
  solar_generation_kVA?: number | string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateSolarGenerationRecordResponse {
  success: boolean;
  message: string;
  data: SolarGenerationRecord;
}

export interface GetSolarGenerationRecordsResponse {
  success: boolean;
  count: number;
  data: SolarGenerationRecord[];
}

export interface GetSolarGenerationRecordByIdResponse {
  success: boolean;
  data: SolarGenerationRecord;
}

export interface UpdateSolarGenerationRecordResponse {
  success: boolean;
  message: string;
  data: SolarGenerationRecord;
}

export interface DeleteSolarGenerationRecordResponse {
  success: boolean;
  message: string;
}

const buildSolarGenerationRecordFormData = (
  data: Partial<
    CreateSolarGenerationRecordRequest | UpdateSolarGenerationRecordRequest
  >
) => {
  const formData = new FormData();

  if ("solar_plant_id" in data && data.solar_plant_id !== undefined) {
    formData.append("solar_plant_id", data.solar_plant_id);
  }

  if ("utility_account_id" in data && data.utility_account_id !== undefined) {
    formData.append("utility_account_id", data.utility_account_id);
  }

  if ("facility_id" in data && data.facility_id !== undefined) {
    formData.append("facility_id", data.facility_id);
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

  if (data.import_kWh !== undefined) {
    formData.append("import_kWh", String(data.import_kWh));
  }

  if (data.import_kVAh !== undefined) {
    formData.append("import_kVAh", String(data.import_kVAh));
  }

  if (data.import_kVA !== undefined) {
    formData.append("import_kVA", String(data.import_kVA));
  }

  if (data.export_kWh !== undefined) {
    formData.append("export_kWh", String(data.export_kWh));
  }

  if (data.export_kVAh !== undefined) {
    formData.append("export_kVAh", String(data.export_kVAh));
  }

  if (data.export_kVA !== undefined) {
    formData.append("export_kVA", String(data.export_kVA));
  }

  if (data.net_kWh !== undefined) {
    formData.append("net_kWh", String(data.net_kWh));
  }

  if (data.net_kVAh !== undefined) {
    formData.append("net_kVAh", String(data.net_kVAh));
  }

  if (data.net_kVA !== undefined) {
    formData.append("net_kVA", String(data.net_kVA));
  }

  if (data.solar_generation_kWh !== undefined) {
    formData.append("solar_generation_kWh", String(data.solar_generation_kWh));
  }

  if (data.solar_generation_kVAh !== undefined) {
    formData.append(
      "solar_generation_kVAh",
      String(data.solar_generation_kVAh)
    );
  }

  if (data.solar_generation_kVA !== undefined) {
    formData.append("solar_generation_kVA", String(data.solar_generation_kVA));
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

export const solarGenerationRecordApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createSolarGenerationRecord: builder.mutation<
      CreateSolarGenerationRecordResponse,
      CreateSolarGenerationRecordRequest
    >({
      query: (data) => ({
        url: "/v1/solar-generation-records",
        method: "POST",
        body: buildSolarGenerationRecordFormData(data),
      }),
      invalidatesTags: [
        "SolarGenerationRecord",
        "SolarPlant",
        "UtilityAccount",
        "Facility",
      ],
    }),

    getSolarGenerationRecords: builder.query<
      GetSolarGenerationRecordsResponse,
      { facility_id?: string; utility_account_id?: string; solar_plant_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/solar-generation-records",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
          ...(params?.solar_plant_id
            ? { solar_plant_id: params.solar_plant_id }
            : {}),
        },
      }),
      providesTags: ["SolarGenerationRecord"],
    }),

    getSolarGenerationRecordById: builder.query<
      GetSolarGenerationRecordByIdResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/solar-generation-records/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        { type: "SolarGenerationRecord", id },
      ],
    }),

    updateSolarGenerationRecord: builder.mutation<
      UpdateSolarGenerationRecordResponse,
      UpdateSolarGenerationRecordRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/solar-generation-records/${id}`,
        method: "PUT",
        body: buildSolarGenerationRecordFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "SolarGenerationRecord",
        { type: "SolarGenerationRecord", id },
        "SolarPlant",
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteSolarGenerationRecord: builder.mutation<
      DeleteSolarGenerationRecordResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/solar-generation-records/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "SolarGenerationRecord",
        { type: "SolarGenerationRecord", id },
        "SolarPlant",
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateSolarGenerationRecordMutation,
  useGetSolarGenerationRecordsQuery,
  useGetSolarGenerationRecordByIdQuery,
  useUpdateSolarGenerationRecordMutation,
  useDeleteSolarGenerationRecordMutation,
} = solarGenerationRecordApiSlice;