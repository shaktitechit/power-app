import { apiSlice } from "./apiSlice";
import type { AppUserRole } from "@/lib/authRoles";

// Request types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role?: AppUserRole;
}

// Auth response type (matches POST /users/login body)
interface AuthResponse {
  _id?: string;
  userId?: string;
  name: string;
  email?: string;
  role: AppUserRole;
  permissions?: UserPermission[];
  status?: string;
}

// Presence / appearance types
interface AuditorAppearance {
  status: "online" | "away" | "offline" | string;
  lastSeen: string | null;
}

// Auditor list types
interface Auditor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  status?: string;
  role: AppUserRole;
  permissions?: UserPermission[];
  appearance?: AuditorAppearance;
}

type PermissionScope = "all" | "assigned" | "own" | "none";

interface UserPermission {
  resource: string;
  actions: string[];
  scope: PermissionScope;
}

interface GetAuditorsResponse {
  success: boolean;
  count: number;
  data: Auditor[];
}

interface UpdateUserRequest {
  id: string;
  name?: string;
  email?: string;
  role?: AppUserRole;
  password?: string;
  status?: string;
}

interface DeleteUserResponse {
  success?: boolean;
  message?: string;
}

interface UpdateUserResponse {
  success?: boolean;
  data?: {
    _id: string;
    name: string;
    email: string;
    role?: AppUserRole;
    status?: string;
  };
}

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (data) => ({
        url: `/v1/users/login`,
        method: "POST",
        body: data,
      }),
    }),

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (data) => ({
        url: `/v1/admin/users`,
        method: "POST",
        body: data,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: `/v1/users/logout`,
        method: "POST",
      }),
    }),

    auditors: builder.query<GetAuditorsResponse, void>({
      query: () => ({
        url: `/v1/admin/users`,
        method: "GET",
      }),
      transformResponse: (response: Auditor[]) => ({
        success: true,
        count: response.length,
        data: response,
      }),
      providesTags: ["User", "PresenceLog"],
    }),
    assignableUsers: builder.query<GetAuditorsResponse, void>({
      query: () => ({
        url: `/v1/admin/users/assignable`,
        method: "GET",
      }),
      transformResponse: (response: Auditor[]) => ({
        success: true,
        count: response.length,
        data: response,
      }),
      providesTags: ["User", "PresenceLog"],
    }),

    updateUser: builder.mutation<UpdateUserResponse, UpdateUserRequest>({
      query: ({ id, ...body }) => ({
        url: `/v1/admin/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User", "PresenceLog", "RecentActivity", "Dashboard"],
    }),

    deleteUser: builder.mutation<DeleteUserResponse, string>({
      query: (id) => ({
        url: `/v1/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User", "PresenceLog", "RecentActivity", "Dashboard"],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useAuditorsQuery,
  useAssignableUsersQuery,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApiSlice;