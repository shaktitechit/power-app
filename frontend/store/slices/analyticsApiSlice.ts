import { apiSlice } from "./apiSlice";

export type DashboardTrend = "increase" | "decrease" | "no_change";

export interface DashboardStatComparison {
  total: number;
  lastMonthTotal: number;
  difference: number;
  percentage: number;
  trend: DashboardTrend;
}

export interface AnalyticsSummary {
  totalFacilities: number;
  completedAudits: number;
  inProgressAudits?: number;
  pendingAudits: number;
  utilityAuditsCompleted: number;
  utilityAuditsPending: number;
  closedFacilities: number;
  openFacilities: number;
  totalCapacity: number;
  totalConnections: number;
  dgCapacity: number;
  solarCapacity: number;
  totalDGSystems: number;
  totalSolarSystems: number;
  totalTransformers: number;
  totalPumps: number;
}

export interface AnalyticsStatusItem {
  name: string;
  value: number;
}

export interface AnalyticsEnergySourceItem {
  name: string;
  value: number;
}

export interface AnalyticsCapacityByCityItem {
  city: string;
  capacity: number;
}

export interface AnalyticsTimeSeriesItem {
  date: string;
  audits: number;
}

export interface AnalyticsStats {
  facilities: DashboardStatComparison;
  utilityAccounts: DashboardStatComparison;
  solarPlants: DashboardStatComparison;
  dgSets: DashboardStatComparison;
  transformers: DashboardStatComparison;
  pumps: DashboardStatComparison;
}

export interface AnalyticsData {
  analytics: AnalyticsSummary;
  stats: AnalyticsStats;
  statusData: AnalyticsStatusItem[];
  energySourceData: AnalyticsEnergySourceItem[];
  capacityByCity: AnalyticsCapacityByCityItem[];
  timeSeriesData: AnalyticsTimeSeriesItem[];
}

export interface GetAnalyticsResponse {
  success: boolean;
  data: AnalyticsData;
}

export const analyticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAnalytics: builder.query<GetAnalyticsResponse, void>({
      query: () => ({
        url: "/v1/analytics",
        method: "GET",
      }),
      providesTags: ["Analytics"],
    }),
  }),
});

export const { useGetAnalyticsQuery } = analyticsApiSlice;