import { apiSlice } from "./apiSlice";

/** Populated user subset from API */
export interface EnquiryUserRef {
  _id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export type EnquiryStatus =
  | "new"
  | "contacted"
  | "in_discussion"
  | "quoted"
  | "negotiation"
  | "won"
  | "lost"
  | "dropped";

export type RequestedAuditType =
  | "Electrical Energy Audit"
  | "Electrical Safety Audit"
  | "Thermal Audit"
  | "Lightning Arrester Audit";

export interface Enquiry {
  _id: string;
  name: string;
  city: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  client_representatives?: {
    name?: string;
    contact_number?: string;
    email?: string;
  }[];
  assigned_to?: string | EnquiryUserRef | null;
  enquiry_status: EnquiryStatus;
  source?: string;
  expected_value?: number;
  requested_audit_types?: RequestedAuditType[];
  notes?: string;
  next_followup_date?: string;
  is_converted_to_facility?: boolean;
  converted_facility_id?: string | { _id?: string; name?: string; city?: string; status?: string };
  created_by: string | EnquiryUserRef;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FollowUp {
  _id: string;
  enquiry_id: string;
  followup_date: string;
  mode?: "call" | "email" | "meeting" | "whatsapp";
  remarks?: string;
  outcome?:
    | "no_response"
    | "interested"
    | "not_interested"
    | "callback_later"
    | "meeting_scheduled";
  next_followup_date?: string;
  created_by: string | EnquiryUserRef;
  deleted_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "sent"
  | "viewed"
  | "revision_requested"
  | "approved"
  | "rejected"
  | "expired";

/** Must match `status` enum on the Quotation model (see `backend/modals/quotation.js`). */

export interface QuotationLineItem {
  audit_type?: RequestedAuditType;
  description?: string;
  price?: number;
}

export interface Quotation {
  _id: string;
  enquiry_id:
    | string
    | {
        _id: string;
        name?: string;
        city?: string;
        enquiry_status?: EnquiryStatus;
      };
  quotation_number?: string;
  amount: number;
  line_items?: QuotationLineItem[];
  status: QuotationStatus;
  valid_till?: string;
  document_url?: string;
  notes?: string;
  created_by: string | EnquiryUserRef;
  deleted_at?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetEnquiriesQueryArgs {
  enquiry_status?: EnquiryStatus;
  city?: string;
  assigned_to?: string;
}

export interface CreateEnquiryRequest {
  name: string;
  city: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  client_representatives?: Enquiry["client_representatives"];
  assigned_to?: string | null;
  enquiry_status?: EnquiryStatus;
  source?: string;
  expected_value?: number;
  requested_audit_types?: RequestedAuditType[];
  notes?: string;
  next_followup_date?: string | null;
}

export interface UpdateEnquiryRequest {
  id: string;
  name?: string;
  city?: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  client_representatives?: Enquiry["client_representatives"];
  assigned_to?: string | null;
  enquiry_status?: EnquiryStatus;
  source?: string;
  expected_value?: number | null;
  requested_audit_types?: RequestedAuditType[];
  notes?: string;
  next_followup_date?: string | null;
  is_converted_to_facility?: boolean;
  converted_facility_id?: string | null;
}

export interface CreateFollowUpRequest {
  enquiryId: string;
  followup_date: string;
  mode?: FollowUp["mode"];
  remarks?: string;
  outcome?: FollowUp["outcome"];
  next_followup_date?: string | null;
}

export interface UpdateFollowUpRequest {
  enquiryId: string;
  followUpId: string;
  followup_date?: string;
  mode?: FollowUp["mode"];
  remarks?: string;
  outcome?: FollowUp["outcome"];
  next_followup_date?: string | null;
}

export interface CreateQuotationRequest {
  enquiryId: string;
  /** Ignored on create: the server assigns a unique number. */
  quotation_number?: string;
  amount: number;
  line_items?: QuotationLineItem[];
  /** Ignored on create: new quotations are always stored as `draft`. */
  status?: QuotationStatus;
  valid_till?: string | null;
  document_url?: string;
  notes?: string;
}

export interface UpdateQuotationRequest {
  enquiryId: string;
  quotationId: string;
  quotation_number?: string | null;
  amount?: number;
  line_items?: QuotationLineItem[];
  status?: QuotationStatus;
  valid_till?: string | null;
  document_url?: string | null;
  notes?: string | null;
  /** Logged onto server `notes` with a timestamp (workflow audit trail). */
  workflow_remark?: string | null;
}

export interface DeleteQuotationRequest {
  enquiryId: string;
  quotationId: string;
  workflow_remark?: string | null;
}

export interface EnquiryMutationResponse<T = Enquiry> {
  success: boolean;
  message: string;
  data: T;
}

export interface EnquiryListResponse {
  success: boolean;
  count: number;
  data: Enquiry[];
}

export interface EnquiryDetailResponse {
  success: boolean;
  data: Enquiry;
}

export interface FollowUpListResponse {
  success: boolean;
  count: number;
  data: FollowUp[];
}

export interface FollowUpDetailResponse {
  success: boolean;
  data: FollowUp;
}

export interface QuotationListResponse {
  success: boolean;
  count: number;
  data: Quotation[];
}

export interface QuotationDetailResponse {
  success: boolean;
  data: Quotation;
}

export interface DeleteMutationResponse {
  success: boolean;
  message: string;
}

function enquiryListTags() {
  return [{ type: "Enquiry" as const, id: "LIST" }];
}

function followUpListTag(enquiryId: string) {
  return { type: "FollowUp" as const, id: `ENQUIRY-${enquiryId}` };
}

function quotationListTag(enquiryId: string) {
  return { type: "Quotation" as const, id: `ENQUIRY-${enquiryId}` };
}

function quotationPendingApprovalListTag() {
  return { type: "Quotation" as const, id: "PENDING_APPROVAL_LIST" };
}

export const enquiryApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createEnquiry: builder.mutation<
      EnquiryMutationResponse,
      CreateEnquiryRequest
    >({
      query: (body) => ({
        url: "/v1/enquiries",
        method: "POST",
        body,
      }),
      invalidatesTags: enquiryListTags,
    }),

    getEnquiries: builder.query<EnquiryListResponse, GetEnquiriesQueryArgs | void>(
      {
        query: (params) => ({
          url: "/v1/enquiries",
          method: "GET",
          params: params ?? {},
        }),
        providesTags: enquiryListTags,
      },
    ),

    getEnquiryById: builder.query<EnquiryDetailResponse, string>({
      query: (id) => ({
        url: `/v1/enquiries/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [
        ...enquiryListTags(),
        { type: "Enquiry", id },
      ],
    }),

    updateEnquiry: builder.mutation<
      EnquiryMutationResponse,
      UpdateEnquiryRequest
    >({
      query: ({ id, ...body }) => ({
        url: `/v1/enquiries/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        ...enquiryListTags(),
        { type: "Enquiry", id },
        followUpListTag(id),
        quotationListTag(id),
      ],
    }),

    deleteEnquiry: builder.mutation<DeleteMutationResponse, string>({
      query: (id) => ({
        url: `/v1/enquiries/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        ...enquiryListTags(),
        { type: "Enquiry", id },
        followUpListTag(id),
        quotationListTag(id),
      ],
    }),

    getFollowUps: builder.query<FollowUpListResponse, string>({
      query: (enquiryId) => ({
        url: `/v1/enquiries/${enquiryId}/follow-ups`,
        method: "GET",
      }),
      providesTags: (_result, _error, enquiryId) => [
        followUpListTag(enquiryId),
      ],
    }),

    getFollowUpById: builder.query<
      FollowUpDetailResponse,
      { enquiryId: string; followUpId: string }
    >({
      query: ({ enquiryId, followUpId }) => ({
        url: `/v1/enquiries/${enquiryId}/follow-ups/${followUpId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { enquiryId, followUpId }) => [
        followUpListTag(enquiryId),
        { type: "FollowUp", id: followUpId },
      ],
    }),

    createFollowUp: builder.mutation<
      EnquiryMutationResponse<FollowUp>,
      CreateFollowUpRequest
    >({
      query: ({ enquiryId, ...body }) => ({
        url: `/v1/enquiries/${enquiryId}/follow-ups`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { enquiryId }) => [
        followUpListTag(enquiryId),
        { type: "Enquiry", id: enquiryId },
      ],
    }),

    updateFollowUp: builder.mutation<
      EnquiryMutationResponse<FollowUp>,
      UpdateFollowUpRequest
    >({
      query: ({ enquiryId, followUpId, ...body }) => ({
        url: `/v1/enquiries/${enquiryId}/follow-ups/${followUpId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { enquiryId, followUpId }) => [
        followUpListTag(enquiryId),
        { type: "FollowUp", id: followUpId },
        { type: "Enquiry", id: enquiryId },
      ],
    }),

    deleteFollowUp: builder.mutation<
      DeleteMutationResponse,
      { enquiryId: string; followUpId: string }
    >({
      query: ({ enquiryId, followUpId }) => ({
        url: `/v1/enquiries/${enquiryId}/follow-ups/${followUpId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, { enquiryId, followUpId }) => [
        followUpListTag(enquiryId),
        { type: "FollowUp", id: followUpId },
        { type: "Enquiry", id: enquiryId },
      ],
    }),

    getQuotations: builder.query<QuotationListResponse, string>({
      query: (enquiryId) => ({
        url: `/v1/enquiries/${enquiryId}/quotations`,
        method: "GET",
      }),
      providesTags: (_result, _error, enquiryId) => [
        quotationListTag(enquiryId),
      ],
    }),

    getPendingQuotationsForApproval: builder.query<
      QuotationListResponse,
      void
    >({
      query: () => ({
        url: "/v1/enquiries/pending-quotations",
        method: "GET",
      }),
      providesTags: () => [quotationPendingApprovalListTag()],
    }),

    getQuotationById: builder.query<
      QuotationDetailResponse,
      { enquiryId: string; quotationId: string }
    >({
      query: ({ enquiryId, quotationId }) => ({
        url: `/v1/enquiries/${enquiryId}/quotations/${quotationId}`,
        method: "GET",
      }),
      providesTags: (_result, _error, { enquiryId, quotationId }) => [
        quotationListTag(enquiryId),
        { type: "Quotation", id: quotationId },
      ],
    }),

    createQuotation: builder.mutation<
      EnquiryMutationResponse<Quotation>,
      CreateQuotationRequest
    >({
      query: ({ enquiryId, ...body }) => ({
        url: `/v1/enquiries/${enquiryId}/quotations`,
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { enquiryId }) => [
        quotationListTag(enquiryId),
        quotationPendingApprovalListTag(),
        { type: "Enquiry", id: enquiryId },
      ],
    }),

    updateQuotation: builder.mutation<
      EnquiryMutationResponse<Quotation>,
      UpdateQuotationRequest
    >({
      query: ({ enquiryId, quotationId, ...body }) => ({
        url: `/v1/enquiries/${enquiryId}/quotations/${quotationId}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { enquiryId, quotationId }) => [
        quotationListTag(enquiryId),
        quotationPendingApprovalListTag(),
        { type: "Quotation", id: quotationId },
        { type: "Enquiry", id: enquiryId },
      ],
    }),

    deleteQuotation: builder.mutation<
      DeleteMutationResponse,
      DeleteQuotationRequest
    >({
      query: ({ enquiryId, quotationId, workflow_remark }) => {
        const trimmed =
          workflow_remark != null ? String(workflow_remark).trim() : "";
        return {
          url: `/v1/enquiries/${enquiryId}/quotations/${quotationId}`,
          method: "DELETE",
          body: trimmed ? { workflow_remark: trimmed } : undefined,
        };
      },
      invalidatesTags: (_result, _error, { enquiryId, quotationId }) => [
        quotationListTag(enquiryId),
        quotationPendingApprovalListTag(),
        { type: "Quotation", id: quotationId },
        { type: "Enquiry", id: enquiryId },
      ],
    }),
  }),
});

export const {
  useCreateEnquiryMutation,
  useGetEnquiriesQuery,
  useGetEnquiryByIdQuery,
  useUpdateEnquiryMutation,
  useDeleteEnquiryMutation,
  useGetFollowUpsQuery,
  useGetFollowUpByIdQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
  useDeleteFollowUpMutation,
  useGetQuotationsQuery,
  useGetPendingQuotationsForApprovalQuery,
  useGetQuotationByIdQuery,
  useCreateQuotationMutation,
  useUpdateQuotationMutation,
  useDeleteQuotationMutation,
} = enquiryApiSlice;
