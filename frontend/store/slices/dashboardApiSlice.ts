import { apiSlice } from "./apiSlice";

export type DashboardTrend = "increase" | "decrease" | "no_change";

export interface DashboardStatComparison {
  total: number;
  lastMonthTotal: number;
  difference: number;
  percentage: number;
  trend: DashboardTrend;
}

export interface DashboardStats {
  facilities: DashboardStatComparison;
  utilityAccounts: DashboardStatComparison;
  solarPlants: DashboardStatComparison;
  dgSets: DashboardStatComparison;
  transformers: DashboardStatComparison;
  pumps: DashboardStatComparison;
}

export interface DashboardActivityActor {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface DashboardActivityFacility {
  _id: string;
  name: string;
  city?: string;
}

export interface DashboardActivityUtilityAccount {
  _id: string;
  account_number: string;
}

export interface DashboardRecentActivity {
  _id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  message: string;
  meta?: Record<string, unknown>;
  actor: DashboardActivityActor | null;
  facility: DashboardActivityFacility | null;
  utility_account: DashboardActivityUtilityAccount | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type DashboardPresenceStatus = "online" | "away" | "offline";

export interface DashboardUserAppearance {
  _id: string;
  name: string;
  email: string;
  role: string;
  appearance: {
    status: DashboardPresenceStatus;
    lastSeen: string | null;
  };
}

export interface DashboardAuditStats {
  totalAudits: DashboardStatComparison;
  acAudits: DashboardStatComparison;
  hvacAudits: DashboardStatComparison;
  fanAudits: DashboardStatComparison;
  lightingAudits: DashboardStatComparison;
  luxMeasurements: DashboardStatComparison;
  miscLoadAudits: DashboardStatComparison;
  dgAudits: DashboardStatComparison;
  pumpAudits: DashboardStatComparison;
  transformerAudits: DashboardStatComparison;
  solarGenerationRecords: DashboardStatComparison;
  linkedAssets: {
    solarPlants: DashboardStatComparison;
    dgSets: DashboardStatComparison;
    transformers: DashboardStatComparison;
    pumps: DashboardStatComparison;
  };
  facilitiesCovered: DashboardStatComparison;
}

export interface GetDashboardStatsResponse {
  success: boolean;
  data: DashboardStats & {
    auditStats: DashboardAuditStats;
  };
}

export interface GetDashboardRecentActivitiesResponse {
  success: boolean;
  count: number;
  data: DashboardRecentActivity[];
}

export interface GetDashboardUserAppearanceResponse {
  success: boolean;
  count: number;
  data: DashboardUserAppearance[];
}

export interface GetDashboardOverviewResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
    auditStats: DashboardAuditStats;
    recentActivities: DashboardRecentActivity[];
    userAppearance: DashboardUserAppearance[];
  };
}

export const dashboardApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDashboardOverview: builder.query<GetDashboardOverviewResponse, void>({
      query: () => ({
        url: "/v1/dashboard/overview",
        method: "GET",
      }),
      providesTags: ["Dashboard", "RecentActivity", "PresenceLog"],
    }),

    getDashboardStats: builder.query<GetDashboardStatsResponse, void>({
      query: () => ({
        url: "/v1/dashboard/stats",
        method: "GET",
      }),
      providesTags: ["Dashboard"],
    }),

    getDashboardRecentActivities:
      builder.query<GetDashboardRecentActivitiesResponse, void>({
        query: () => ({
          url: "/v1/dashboard/recent-activities",
          method: "GET",
        }),
        providesTags: ["RecentActivity"],
      }),

    getDashboardUserAppearance:
      builder.query<GetDashboardUserAppearanceResponse, void>({
        query: () => ({
          url: "/v1/dashboard/user-appearance",
          method: "GET",
        }),
        providesTags: ["PresenceLog"],
      }),
  }),
});

export const {
  useGetDashboardOverviewQuery,
  useGetDashboardStatsQuery,
  useGetDashboardRecentActivitiesQuery,
  useGetDashboardUserAppearanceQuery,
} = dashboardApiSlice;