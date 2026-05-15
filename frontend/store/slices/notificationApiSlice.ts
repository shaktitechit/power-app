import { apiSlice } from "./apiSlice";

export interface Notification {
  _id: string;
  recipient: string | { _id: string; name: string; email: string };
  sender: string | { _id: string; name: string; email: string } | null;
  title: string;
  message: string;
  type: "facility" | "utility" | "enquiry" | "system";
  referenceId: string | null;
  isRead: boolean;
  superAdminRead?: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationsResponse {
  success: boolean;
  count: number;
  data: Notification[];
}

export interface NotificationResponse {
  success: boolean;
  data: Notification;
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsResponse, { all?: boolean } | void>({
      query: (params) => ({
        url: "/v1/notifications",
        method: "GET",
        params: params?.all ? { all: "true" } : {},
      }),
      providesTags: ["Notification"],
      keepUnusedDataFor: 0,
    }),
    markAsRead: builder.mutation<NotificationResponse, { id: string; all?: boolean }>({
      query: ({ id, all }) => ({
        url: `/v1/notifications/${id}/read`,
        method: "PUT",
        params: all ? { all: "true" } : {},
      }),
      invalidatesTags: ["Notification"],
    }),
    markAllAsRead: builder.mutation<MessageResponse, { all?: boolean } | void>({
      query: (params) => ({
        url: "/v1/notifications/read-all",
        method: "PUT",
        params: params?.all ? { all: "true" } : {},
      }),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApiSlice;
