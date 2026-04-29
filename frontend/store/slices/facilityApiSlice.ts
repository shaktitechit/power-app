import { apiSlice } from "./apiSlice";

export interface FacilityDocument {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
}

export interface AssignedAuditor {
  _id?: string;
  user_id:
    | string
    | {
        _id?: string;
        name?: string;
        email?: string;
      };
  assigned_by?: string;
  createdAt?: string;
}

export interface Facility {
  _id: string;
  owner_user_id: string;
  name: string;
  city: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  start_date?: string;
  client_representatives?: {
    name?: string;
    contact_number?: string;
    email?: string;
  }[];
  facility_type?: string;
  audit_type?: string;
  status: "active" | "inactive";
  audit_date?: string;
  auditor_id?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  closure_date?: string;
  audit_closure?: {
    closed_at?: string;
    closed_by?:
      | string
      | {
          _id?: string;
          name?: string;
          email?: string;
        };
    reopened_at?: string;
    reopened_by?:
      | string
      | {
          _id?: string;
          name?: string;
          email?: string;
        };
  };
  created_by: string;
  documents: FacilityDocument[];
  created_at?: string;
  updated_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFacilityRequest {
  name: string;
  city: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  start_date?: string;
  client_representatives?: {
    name?: string;
    contact_number?: string;
    email?: string;
  }[];
  facility_type?: string;
  audit_type?: string;
  status?: "active" | "inactive";
  closure_date?: string;
  auditor_ids?: string[];
  documents?: File[];
}

export interface UpdateFacilityRequest {
  id: string;
  name?: string;
  city?: string;
  address?: string;
  client_representative?: string;
  client_contact_number?: string;
  client_email?: string;
  start_date?: string;
  client_representatives?: {
    name?: string;
    contact_number?: string;
    email?: string;
  }[];
  facility_type?: string;
  audit_type?: string;
  status?: "active" | "inactive";
  closure_date?: string;
  auditor_ids?: string[];
  documents?: File[];
  removed_document_ids?: string[];
}

export interface CreateFacilityResponse {
  success: boolean;
  message: string;
  data: Facility;
}

export interface GetFacilitiesResponse {
  success: boolean;
  count: number;
  data: Facility[];
}

export interface GetFacilityByIdResponse {
  success: boolean;
  data: {
    facility: Facility;
    assignedAuditors: AssignedAuditor[];
  };
}

export interface UpdateFacilityResponse {
  success: boolean;
  message: string;
  data: {
    facility: Facility;
    assignedAuditors: AssignedAuditor[];
  };
}

export interface DeleteFacilityResponse {
  success: boolean;
  message: string;
}

export interface FacilityAuditClosureResponse {
  success: boolean;
  message: string;
  data: Facility;
}

// Build FormData
const buildFacilityFormData = (
  data: Partial<CreateFacilityRequest | UpdateFacilityRequest>
) => {
  const formData = new FormData();

  if (data.name !== undefined) formData.append("name", data.name);
  if (data.city !== undefined) formData.append("city", data.city);
  if (data.address !== undefined) formData.append("address", data.address);
  if (data.client_representative !== undefined) {
    formData.append("client_representative", data.client_representative);
  }
  if (data.client_contact_number !== undefined) {
    formData.append("client_contact_number", data.client_contact_number);
  }
  if (data.client_email !== undefined) {
    formData.append("client_email", data.client_email);
  }
  if (data.start_date !== undefined) {
    formData.append("start_date", data.start_date);
  }
  if (data.client_representatives !== undefined) {
    formData.append(
      "client_representatives",
      JSON.stringify(data.client_representatives),
    );
  }
  if (data.facility_type !== undefined) {
    formData.append("facility_type", data.facility_type);
  }
  if (data.audit_type !== undefined) {
    formData.append("audit_type", data.audit_type);
  }
  if (data.status !== undefined) {
    formData.append("status", data.status);
  }
  if (data.closure_date !== undefined) {
    formData.append("closure_date", data.closure_date);
  }

  if (data.auditor_ids !== undefined) {
    formData.append("auditor_ids", JSON.stringify(data.auditor_ids));
  }

  if (data.documents?.length) {
    data.documents.forEach((file) => {
      formData.append("documents", file);
    });
  }

  if ("removed_document_ids" in data && Array.isArray(data.removed_document_ids)) {
    formData.append(
      "removed_document_ids",
      JSON.stringify(data.removed_document_ids),
    );
  }

  return formData;
};

export const facilityApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createFacility: builder.mutation<
      CreateFacilityResponse,
      CreateFacilityRequest
    >({
      query: (data) => ({
        url: "/v1/facilities",
        method: "POST",
        body: buildFacilityFormData(data),
      }),
      invalidatesTags: ["Facility"],
    }),

    getFacilities: builder.query<GetFacilitiesResponse, void>({
      query: () => ({
        url: "/v1/facilities",
        method: "GET",
      }),
      providesTags: ["Facility"],
    }),

    getFacilityById: builder.query<GetFacilityByIdResponse, string>({
      query: (id) => ({
        url: `/v1/facilities/${id}`,
        method: "GET",
      }),
      providesTags: (_result, _error, id) => [{ type: "Facility", id }],
    }),

    updateFacility: builder.mutation<
      UpdateFacilityResponse,
      UpdateFacilityRequest
    >({
      query: ({ id, ...data }) => ({
        url: `/v1/facilities/${id}`,
        method: "PUT",
        body: buildFacilityFormData(data),
      }),
      invalidatesTags: (_result, _error, { id }) => [
        "Facility",
        { type: "Facility", id },
      ],
    }),

    deleteFacility: builder.mutation<DeleteFacilityResponse, string>({
      query: (id) => ({
        url: `/v1/facilities/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Facility",
        { type: "Facility", id },
      ],
    }),

    closeFacilityAudit: builder.mutation<FacilityAuditClosureResponse, string>({
      query: (id) => ({
        url: `/v1/facilities/${id}/audit-close`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Facility",
        { type: "Facility", id },
      ],
    }),

    openFacilityAudit: builder.mutation<FacilityAuditClosureResponse, string>({
      query: (id) => ({
        url: `/v1/facilities/${id}/audit-open`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [
        "Facility",
        { type: "Facility", id },
      ],
    }),
  }),
});

export const {
  useCreateFacilityMutation,
  useGetFacilitiesQuery,
  useGetFacilityByIdQuery,
  useUpdateFacilityMutation,
  useDeleteFacilityMutation,
  useCloseFacilityAuditMutation,
  useOpenFacilityAuditMutation,
} = facilityApiSlice;