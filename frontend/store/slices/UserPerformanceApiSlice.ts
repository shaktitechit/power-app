import { apiSlice } from "./apiSlice";

export interface UserPerformanceFacility {
  _id: string;
  name: string;
  city: string;
  status: string;
  facility_type: string;
  audit_closed: boolean;
}

export interface UserPerformanceUtilityAccount {
  _id: string;
  account_number: string;
  connection_type: string;
  category: string;
  is_active: boolean;
  facility: {
    _id: string;
    name: string;
    city: string;
  } | null;
  audit_completed: boolean;
}

export interface UserPerformanceCompletedAudit {
  _id: string;
  account_number: string;
  facility: {
    _id: string;
    name: string;
    city: string;
  } | null;
  completed_at: string | null;
  completed_by: string;
}

export interface UserPerformanceResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: "admin" | "auditor";
      status: "active" | "inactive";
    };
    widgets: {
      connected_facilities: number;
      connected_utility_accounts: number;
      completed_utility_account_audits: number;
      completion_percent: number;
    };
    connected_facilities: UserPerformanceFacility[];
    connected_utility_accounts: UserPerformanceUtilityAccount[];
    completed_utility_account_audits: UserPerformanceCompletedAudit[];
    daywise_presence: {
      date: string;
      first_login_at: string | null;
      last_logout_at: string | null;
      screen_time_minutes: number;
      screen_time_hours: number;
      activity_count: number;
      activities: {
        _id: string;
        action: string;
        entity_type: string;
        entity_name: string;
        message: string;
        created_at: string | null;
        facility_id: string | null;
        utility_account_id: string | null;
      }[];
    }[];
    presence_filter: {
      filter_type: "date" | "month";
      date: string | null;
      month: number | null;
      year: number | null;
    };
  };
}

export interface UserPerformanceSummaryResponse {
  success: boolean;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: "admin" | "auditor";
      status: "active" | "inactive";
    };
    widgets: {
      connected_facilities: number;
      connected_utility_accounts: number;
      completed_utility_account_audits: number;
      completion_percent: number;
    };
  };
}

export interface UserPerformanceFacilitiesResponse {
  success: boolean;
  count: number;
  data: UserPerformanceFacility[];
}

export interface UserPerformanceUtilitiesResponse {
  success: boolean;
  count: number;
  data: UserPerformanceUtilityAccount[];
}

export interface UserPerformanceCompletedAuditsResponse {
  success: boolean;
  count: number;
  data: UserPerformanceCompletedAudit[];
}

export interface UserPerformancePresenceResponse {
  success: boolean;
  data: {
    daywise_presence: {
      date: string;
      first_login_at: string | null;
      last_logout_at: string | null;
      screen_time_minutes: number;
      screen_time_hours: number;
    }[];
    presence_filter: {
      filter_type: "date" | "month";
      date: string | null;
      month: number | null;
      year: number | null;
    };
  };
}

export interface UserPerformancePresenceActivitiesResponse {
  success: boolean;
  data: {
    date: string;
    first_login_at: string | null;
    last_logout_at: string | null;
    activity_count: number;
    activities: {
      _id: string;
      action: string;
      entity_type: string;
      entity_name: string;
      message: string;
      created_at: string | null;
      facility_id: string | null;
      utility_account_id: string | null;
    }[];
  };
}

export const userPerformanceApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUserPerformanceSummary: builder.query<UserPerformanceSummaryResponse, string>({
      query: (userId) => ({
        url: `/v1/user-performance/${userId}/summary`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),
    getUserPerformanceFacilities: builder.query<UserPerformanceFacilitiesResponse, string>({
      query: (userId) => ({
        url: `/v1/user-performance/${userId}/facilities`,
        method: "GET",
      }),
      providesTags: ["Facility"],
    }),
    getUserPerformanceUtilityAccounts: builder.query<
      UserPerformanceUtilitiesResponse,
      string
    >({
      query: (userId) => ({
        url: `/v1/user-performance/${userId}/utility-accounts`,
        method: "GET",
      }),
      providesTags: ["UtilityAccount"],
    }),
    getUserPerformanceCompletedAudits: builder.query<
      UserPerformanceCompletedAuditsResponse,
      string
    >({
      query: (userId) => ({
        url: `/v1/user-performance/${userId}/completed-audits`,
        method: "GET",
      }),
      providesTags: ["UtilityAccount"],
    }),
    getUserPerformancePresence: builder.query<
      UserPerformancePresenceResponse,
      {
        userId: string;
        filterType?: "date" | "month";
        date?: string;
        month?: number;
        year?: number;
      }
    >({
      query: ({ userId, filterType, date, month, year }) => ({
        url: `/v1/user-performance/${userId}/presence`,
        method: "GET",
        params: {
          ...(filterType ? { filter_type: filterType } : {}),
          ...(date ? { date } : {}),
          ...(month ? { month } : {}),
          ...(year ? { year } : {}),
        },
      }),
      providesTags: ["PresenceLog"],
    }),
    getUserPerformancePresenceActivities: builder.query<
      UserPerformancePresenceActivitiesResponse,
      { userId: string; date: string }
    >({
      query: ({ userId, date }) => ({
        url: `/v1/user-performance/${userId}/presence/activities`,
        method: "GET",
        params: { date },
      }),
      providesTags: ["RecentActivity"],
    }),
    getUserPerformance: builder.query<
      UserPerformanceResponse,
      {
        userId: string;
        filterType?: "date" | "month";
        date?: string;
        month?: number;
        year?: number;
      }
    >({
      query: ({ userId, filterType, date, month, year }) => ({
        url: `/v1/user-performance/${userId}`,
        method: "GET",
        params: {
          ...(filterType ? { filter_type: filterType } : {}),
          ...(date ? { date } : {}),
          ...(month ? { month } : {}),
          ...(year ? { year } : {}),
        },
      }),
      providesTags: ["User", "Facility", "UtilityAccount"],
    }),
  }),
});

export const { useGetUserPerformanceQuery } = userPerformanceApiSlice;
export const {
  useGetUserPerformanceSummaryQuery,
  useGetUserPerformanceFacilitiesQuery,
  useGetUserPerformanceUtilityAccountsQuery,
  useGetUserPerformanceCompletedAuditsQuery,
  useGetUserPerformancePresenceQuery,
  useLazyGetUserPerformancePresenceActivitiesQuery,
} = userPerformanceApiSlice;
