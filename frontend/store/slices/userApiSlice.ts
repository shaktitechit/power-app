import { apiSlice } from "./apiSlice";

// Request types
interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// Auth response type
interface AuthResponse {
  _id?: string;
  userId?: string;
  name: string;
  email?: string;
  role: "admin" | "auditor";
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
  role: "admin" | "auditor";
  appearance?: AuditorAppearance;
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
  role?: "admin" | "auditor";
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
    role?: "admin" | "auditor";
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
        url: `/v1/users/register`,
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
        url: `/v1/users/auditors`,
        method: "GET",
      }),
      providesTags: ["User", "PresenceLog"],
    }),

    updateUser: builder.mutation<UpdateUserResponse, UpdateUserRequest>({
      query: ({ id, ...body }) => ({
        url: `/v1/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: ["User", "PresenceLog", "RecentActivity", "Dashboard"],
    }),

    deleteUser: builder.mutation<DeleteUserResponse, string>({
      query: (id) => ({
        url: `/v1/users/${id}`,
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
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApiSlice;