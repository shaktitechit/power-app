import { apiSlice } from "../apiSlice";
import type {
  CreateMeteringRoomSafetyAuditRequest,
  DeleteSafetyAuditResponse,
  GetSafetyAuditByIdResponse,
  ListSafetyAuditsResponse,
  MutateSafetyAuditResponse,
  SafetyAuditListArg,
  UpdateMeteringRoomSafetyAuditRequest,
} from "./safetyAuditTypes";
import { listParams } from "./safetyAuditListParams";
import { buildSafetyAuditFormData } from "./safetyAuditFormData";

const base = "/v1/safety-metering-room-audits";
const tag = "SafetyMeteringRoomAudit" as const;

export const safetyMeteringRoomAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSafetyMeteringRoomAudits: builder.query<ListSafetyAuditsResponse, SafetyAuditListArg>({
      query: (params) => ({
        url: base,
        method: "GET",
        params: listParams(params),
      }),
      providesTags: [tag],
    }),
    getSafetyMeteringRoomAuditById: builder.query<GetSafetyAuditByIdResponse, string>({
      query: (id) => ({ url: `${base}/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: tag, id }],
    }),
    createSafetyMeteringRoomAudit: builder.mutation<
      MutateSafetyAuditResponse,
      CreateMeteringRoomSafetyAuditRequest
    >({
      query: (body) => ({
        url: base,
        method: "POST",
        body: buildSafetyAuditFormData(body as unknown as Record<string, unknown>),
      }),
      invalidatesTags: [tag, "UtilityAccount", "Facility"],
    }),
    updateSafetyMeteringRoomAudit: builder.mutation<
      MutateSafetyAuditResponse,
      UpdateMeteringRoomSafetyAuditRequest
    >({
      query: ({ id, ...body }) => ({
        url: `${base}/${id}`,
        method: "PUT",
        body: buildSafetyAuditFormData(body as unknown as Record<string, unknown>),
      }),
      invalidatesTags: (_r, _e, { id: rid }) => [
        tag,
        { type: tag, id: rid },
        "UtilityAccount",
        "Facility",
      ],
    }),
    deleteSafetyMeteringRoomAudit: builder.mutation<DeleteSafetyAuditResponse, string>({
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
  useGetSafetyMeteringRoomAuditsQuery,
  useGetSafetyMeteringRoomAuditByIdQuery,
  useCreateSafetyMeteringRoomAuditMutation,
  useUpdateSafetyMeteringRoomAuditMutation,
  useDeleteSafetyMeteringRoomAuditMutation,
} = safetyMeteringRoomAuditApiSlice;
