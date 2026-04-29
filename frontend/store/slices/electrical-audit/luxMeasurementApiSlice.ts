import { apiSlice } from "../apiSlice";

export interface LuxMeasurementDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface LuxMeasurementRecord {
  _id: string;
  facility_id: string;
  utility_account_id: string;

  area_location?: string;
  room_type?:
    | "office"
    | "corridor"
    | "warehouse"
    | "hospital"
    | "classroom"
    | "outdoor"
    | "other";

  required_lux?: number | string;
  measured_lux_point_1?: number | string;
  measured_lux_point_2?: number | string;
  measured_lux_point_3?: number | string;
  average_lux?: number | string;
  compliance?: boolean;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents: LuxMeasurementDocument[];

  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLuxMeasurementRequest {
  facility_id: string;
  utility_account_id: string;

  area_location?: string;
  room_type?:
    | "office"
    | "corridor"
    | "warehouse"
    | "hospital"
    | "classroom"
    | "outdoor"
    | "other";

  required_lux?: number | string;
  measured_lux_point_1?: number | string;
  measured_lux_point_2?: number | string;
  measured_lux_point_3?: number | string;
  average_lux?: number | string;
  compliance?: boolean;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface UpdateLuxMeasurementRequest {
  id: string;

  facility_id?: string;
  utility_account_id?: string;

  area_location?: string;
  room_type?:
    | "office"
    | "corridor"
    | "warehouse"
    | "hospital"
    | "classroom"
    | "outdoor"
    | "other";

  required_lux?: number | string;
  measured_lux_point_1?: number | string;
  measured_lux_point_2?: number | string;
  measured_lux_point_3?: number | string;
  average_lux?: number | string;
  compliance?: boolean;
  remarks?: string;

  audit_date?: string;
  auditor_id?: string;

  documents?: File[];
}

export interface CreateLuxMeasurementResponse {
  success: boolean;
  message?: string;
  data: LuxMeasurementRecord;
}

export interface GetLuxMeasurementsResponse {
  success: boolean;
  count: number;
  data: LuxMeasurementRecord[];
}

export interface GetLuxMeasurementByIdResponse {
  success: boolean;
  data: LuxMeasurementRecord;
}

export interface UpdateLuxMeasurementResponse {
  success: boolean;
  message?: string;
  data: LuxMeasurementRecord;
}

export interface DeleteLuxMeasurementResponse {
  success: boolean;
  message: string;
}

const buildLuxMeasurementFormData = (
  data: Partial<CreateLuxMeasurementRequest | UpdateLuxMeasurementRequest>
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

  if (data.room_type !== undefined && data.room_type !== null) {
    formData.append("room_type", data.room_type);
  }

  if (data.required_lux !== undefined && data.required_lux !== null) {
    formData.append("required_lux", String(data.required_lux));
  }

  if (
    data.measured_lux_point_1 !== undefined &&
    data.measured_lux_point_1 !== null
  ) {
    formData.append(
      "measured_lux_point_1",
      String(data.measured_lux_point_1)
    );
  }

  if (
    data.measured_lux_point_2 !== undefined &&
    data.measured_lux_point_2 !== null
  ) {
    formData.append(
      "measured_lux_point_2",
      String(data.measured_lux_point_2)
    );
  }

  if (
    data.measured_lux_point_3 !== undefined &&
    data.measured_lux_point_3 !== null
  ) {
    formData.append(
      "measured_lux_point_3",
      String(data.measured_lux_point_3)
    );
  }

  if (data.average_lux !== undefined && data.average_lux !== null) {
    formData.append("average_lux", String(data.average_lux));
  }

  if (data.compliance !== undefined && data.compliance !== null) {
    formData.append("compliance", String(data.compliance));
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

export const luxMeasurementApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createLuxMeasurement: builder.mutation<
      CreateLuxMeasurementResponse,
      CreateLuxMeasurementRequest
    >({
      query: (data) => ({
        url: "/v1/lux-measurements",
        method: "POST",
        body: buildLuxMeasurementFormData(data),
      }),
      invalidatesTags: ["LuxMeasurement", "UtilityAccount", "Facility"],
    }),

    getLuxMeasurements: builder.query<
      GetLuxMeasurementsResponse,
      { facility_id?: string; utility_account_id?: string } | void
    >({
      query: (params) => ({
        url: "/v1/lux-measurements",
        method: "GET",
        params: {
          ...(params?.facility_id ? { facility_id: params.facility_id } : {}),
          ...(params?.utility_account_id
            ? { utility_account_id: params.utility_account_id }
            : {}),
        },
      }),
      providesTags: ["LuxMeasurement"],
    }),

    getLuxMeasurementById: builder.query<GetLuxMeasurementByIdResponse, string>({
      query: (id) => ({
        url: `/v1/lux-measurements/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "LuxMeasurement", id }],
    }),

    updateLuxMeasurement: builder.mutation<
      UpdateLuxMeasurementResponse,
      UpdateLuxMeasurementRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/lux-measurements/${id}`,
        method: "PUT",
        body: buildLuxMeasurementFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "LuxMeasurement",
        { type: "LuxMeasurement", id },
        "UtilityAccount",
        "Facility",
      ],
    }),

    deleteLuxMeasurement: builder.mutation<
      DeleteLuxMeasurementResponse,
      string
    >({
      query: (id) => ({
        url: `/v1/lux-measurements/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "LuxMeasurement",
        { type: "LuxMeasurement", id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useCreateLuxMeasurementMutation,
  useGetLuxMeasurementsQuery,
  useGetLuxMeasurementByIdQuery,
  useUpdateLuxMeasurementMutation,
  useDeleteLuxMeasurementMutation,
} = luxMeasurementApiSlice;