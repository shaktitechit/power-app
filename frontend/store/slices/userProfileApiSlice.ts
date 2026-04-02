import { apiSlice } from "./apiSlice";

export interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "auditor";
}

export interface GetUserProfileResponse {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "auditor";
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface UpdateUserProfileResponse {
  message: string;
  user: UserProfile;
}

export const userProfileApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserProfile: builder.query<GetUserProfileResponse, void>({
      query: () => ({
        url: "/v1/user/profile",
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    updateUserProfile: builder.mutation<
      UpdateUserProfileResponse,
      UpdateUserProfileRequest
    >({
      query: (data) => ({
        url: "/v1/user/profile",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
} = userProfileApiSlice;