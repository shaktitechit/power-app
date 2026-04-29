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

const base = "/v1/safety-panel-room-audits";
const tag = "SafetyPanelRoomAudit" as const;

export const safetyPanelRoomAuditApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getSafetyPanelRoomAudits: builder.query<ListSafetyAuditsResponse, SafetyAuditListArg>({
      query: (params) => ({
        url: base,
        method: "GET",
        params: listParams(params),
      }),
      providesTags: [tag],
    }),
    getSafetyPanelRoomAuditById: builder.query<GetSafetyAuditByIdResponse, string>({
      query: (id) => ({ url: `${base}/${id}`, method: "GET" }),
      providesTags: (_r, _e, id) => [{ type: tag, id }],
    }),
    createSafetyPanelRoomAudit: builder.mutation<
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
    updateSafetyPanelRoomAudit: builder.mutation<
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
    deleteSafetyPanelRoomAudit: builder.mutation<DeleteSafetyAuditResponse, string>({
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
  useGetSafetyPanelRoomAuditsQuery,
  useGetSafetyPanelRoomAuditByIdQuery,
  useCreateSafetyPanelRoomAuditMutation,
  useUpdateSafetyPanelRoomAuditMutation,
  useDeleteSafetyPanelRoomAuditMutation,
} = safetyPanelRoomAuditApiSlice;
