import { apiSlice } from "./apiSlice";

/* ================= TYPES ================= */

export type ReportScope = "facility" | "utility_account";

/**
 * Only `report_type` accepted by POST `/reports/generate` and POST `/reports`.
 * Matches `GENERATION_ALLOWED_REPORT_TYPES` in backend `reportGenerationPolicy.js`.
 */
export const REPORT_GENERATION_TYPE = "full_audit_report" as const;

export type ReportGenerationType = typeof REPORT_GENERATION_TYPE;

/** Per-area electrical safety reports (`{registryKey}_report`) — align with backend `SAFETY_GRANULAR_REPORT_TYPES`. */
export type ElectricalSafetyGranularReportType =
  | "safety_general_report"
  | "safety_documents_report"
  | "safety_earthing_report"
  | "safety_panel_room_report"
  | "safety_metering_room_report"
  | "safety_ldb_report"
  | "safety_transformer_report"
  | "safety_dg_report"
  | "safety_ups_report"
  | "safety_wiring_report"
  | "safety_load_analysis_report"
  | "safety_leak_inspection_report"
  | "safety_thermography_report"
  | "safety_pump_compressor_report"
  | "safety_elevator_report"
  | "safety_pac_ventilation_report"
  | "safety_additional_items_report";

export type ReportType =
  | "full_audit_report"
  | "executive_summary"
  | "solar_report"
  | "dg_report"
  | "transformer_report"
  | "pump_report"
  | "hvac_report"
  | "lighting_report"
  | "ac_report"
  | "fan_report"
  | "lux_report"
  | "misc_report"
  | ElectricalSafetyGranularReportType;

export type ReportStatus = "processing" | "completed" | "failed";

export interface ReportFile {
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  uploadedAt?: string;
}

export interface ReportSnapshotMeta {
  facility_name?: string;
  facility_city?: string;
  utility_account_number?: string;
  report_period_from?: string | null;
  report_period_to?: string | null;
}

/* ================= NORMALIZED TYPES ================= */

export interface ReportFacility {
  _id: string;
  name: string;
  city?: string;
  address?: string;
  /** Present when populated from API (e.g. list/detail). Matches `facility.audit_type`. */
  audit_type?: string;
}

export interface ReportUtilityAccount {
  _id: string;
  account_number?: string;
  connection_type?: string;
  category?: string;
}

export interface ReportUser {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface Report {
  _id: string;
  facility_id: string | ReportFacility;
  utility_account_id?: string | ReportUtilityAccount | null;

  report_scope: ReportScope;
  report_type: ReportType;
  title: string;

  version?: number;
  status: ReportStatus;

  excel_file?: ReportFile;
  pdf_file?: ReportFile;

  created_by: string | ReportUser;
  generated_at?: string;

  error_message?: string;
  snapshot_meta?: ReportSnapshotMeta;

  createdAt?: string;
  updatedAt?: string;
}

/* ================= REQUEST TYPES ================= */

export interface CreateReportRequest {
  facility_id: string;
  utility_account_id?: string;
  report_scope: ReportScope;
  report_type?: ReportGenerationType;
  title: string;
  snapshot_meta?: ReportSnapshotMeta;
}

export interface GenerateReportRequest {
  facility_id: string;
  utility_account_id?: string;
  report_scope: ReportScope;
  report_type?: ReportGenerationType;
  title?: string;
  snapshot_meta?: ReportSnapshotMeta;
}

export interface UpdateReportRequest {
  id: string;
  title?: string;
  snapshot_meta?: ReportSnapshotMeta;
}

export interface GetReportsParams {
  facility_id?: string;
  utility_account_id?: string;
  report_scope?: ReportScope;
  report_type?: ReportType;
  status?: ReportStatus;
}

/* ================= RESPONSE TYPES ================= */

export interface BaseResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface GetReportsResponse {
  success: boolean;
  count: number;
  data: Report[];
}

/* ================= HELPERS ================= */

const buildQuery = (params?: GetReportsParams | void) => {
  if (params == null) return "";

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString() ? `?${searchParams.toString()}` : "";
};

/* ================= API ================= */

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    /* -------- CREATE ONLY -------- */
    createReport: builder.mutation<BaseResponse<Report>, CreateReportRequest>({
      query: (data) => ({
        url: "/v1/reports",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Report"],
    }),

    /* -------- GENERATE (QUEUE BASED) -------- */
    generateReport: builder.mutation<
      BaseResponse<Report>,
      GenerateReportRequest
    >({
      query: (data) => ({
        url: "/v1/reports/generate",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Report"],
    }),

    /* -------- REGENERATE (QUEUE BASED) -------- */
    regenerateReport: builder.mutation<BaseResponse<Report>, string>({
      query: (id) => ({
        url: `/v1/reports/${id}/regenerate`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Report",
        { type: "Report", id },
      ],
    }),

    /* -------- GET ALL -------- */
    getReports: builder.query<GetReportsResponse, GetReportsParams | void>({
      query: (params) => ({
        url: `/v1/reports${buildQuery(params)}`,
        method: "GET",
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.data.map((r) => ({
                type: "Report" as const,
                id: r._id,
              })),
              "Report",
            ]
          : ["Report"],
    }),

    /* -------- GET ONE -------- */
    getReportById: builder.query<BaseResponse<Report>, string>({
      query: (id) => ({
        url: `/v1/reports/${id}`,
        method: "GET",
      }),
      providesTags: (_res, _err, id) => ["Report", { type: "Report", id }],
    }),

    /* -------- UPDATE -------- */
    updateReport: builder.mutation<BaseResponse<Report>, UpdateReportRequest>({
      query: ({ id, ...data }) => ({
        url: `/v1/reports/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: (_res, _err, { id }) => [
        "Report",
        { type: "Report", id },
      ],
    }),

    /* -------- DELETE -------- */
    deleteReport: builder.mutation<BaseResponse<void>, string>({
      query: (id) => ({
        url: `/v1/reports/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_res, _err, id) => [
        "Report",
        { type: "Report", id },
      ],
    }),

    /* -------- DOWNLOAD EXCEL (regenerated on demand; matches GET /v1/reports/:id/excel/download) -------- */
    downloadExcelReport: builder.mutation<Blob, string>({
      query: (id) => ({
        url: `/v1/reports/${id}/excel/download`,
        method: "GET",
        responseHandler: async (response) => response.blob(),
      }),
    }),
  }),
});

/* ================= EXPORT HOOKS ================= */

export const {
  useCreateReportMutation,
  useGenerateReportMutation,
  useRegenerateReportMutation,
  useGetReportsQuery,
  useGetReportByIdQuery,
  useUpdateReportMutation,
  useDeleteReportMutation,
  useDownloadExcelReportMutation,
} = reportApiSlice;