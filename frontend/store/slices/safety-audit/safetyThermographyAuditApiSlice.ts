import { apiSlice } from "../apiSlice";
import type {
  CreateSafetyAuditRequest,
  DeleteSafetyAuditResponse,
  GetSafetyAuditByIdResponse,
  ListSafetyAuditsResponse,
  MutateSafetyAuditResponse,
  SafetyAuditListArg,
  UpdateSafetyAuditRequest,
} from "./safetyAuditTypes";
import { listParams } from "./safetyAuditListParams";
import { buildSafetyAuditFormData } from "./safetyAuditFormData";

const base = "/v1/safety-thermography-audits";
const tag = "SafetyThermographyAudit" as const;

export const safetyThermographyAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSafetyThermographyAudits: builder.query<ListSafetyAuditsResponse, SafetyAuditListArg>({
      query: (params) => ({
        url: base,
        method: "GET",
        params: listParams(params),
      }),
      providesTags: [tag],
    }),
    getSafetyThermographyAuditById: builder.query<GetSafetyAuditByIdResponse, string>({
      query: (id) => ({ url: `${base}/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: tag, id }],
    }),
    createSafetyThermographyAudit: builder.mutation<
      MutateSafetyAuditResponse,
      CreateSafetyAuditRequest
    >({
      query: (body) => ({
        url: base,
        method: "POST",
        body: buildSafetyAuditFormData(body as Record<string, unknown>),
      }),
      invalidatesTags: [tag, "UtilityAccount", "Facility"],
    }),
    updateSafetyThermographyAudit: builder.mutation<
      MutateSafetyAuditResponse,
      UpdateSafetyAuditRequest
    >({
      query: ({ id, ...body }) => ({
        url: `${base}/${id}`,
        method: "PUT",
        body: buildSafetyAuditFormData(body as Record<string, unknown>),
      }),
      invalidatesTags: (_r, _e, { id: rid }) => [
        tag,
        { type: tag, id: rid },
        "UtilityAccount",
        "Facility",
      ],
    }),
    deleteSafetyThermographyAudit: builder.mutation<DeleteSafetyAuditResponse, string>({
      query: (id) => ({ url: `${base}/${id}`, method: "DELETE" }),
      invalidatesTags: (_r, _e, id) => [
        tag,
        { type: tag, id },
        "UtilityAccount",
        "Facility",
      ],
    }),
  }),
});

export const {
  useGetSafetyThermographyAuditsQuery,
  useGetSafetyThermographyAuditByIdQuery,
  useCreateSafetyThermographyAuditMutation,
  useUpdateSafetyThermographyAuditMutation,
  useDeleteSafetyThermographyAuditMutation,
} = safetyThermographyAuditApiSlice;
