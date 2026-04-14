"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StatsCard } from "@/components/ui/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2,
  Plug,
  Fuel,
  Sun,
  CheckCircle,
  Clock,
  Zap,
  TrendingUp,
} from "lucide-react";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

import { useGetAnalyticsQuery } from "@/store/slices/analyticsApiSlice";

const STATUS_COLORS: Record<string, string> = {
  Completed: "oklch(0.7 0.15 160)",
  "In Progress": "oklch(0.65 0.18 220)",
  Pending: "oklch(0.75 0.15 80)",
};

const ENERGY_COLORS: Record<string, string> = {
  Grid: "oklch(0.65 0.18 220)",
  DG: "oklch(0.75 0.15 80)",
  Solar: "oklch(0.7 0.15 160)",
};

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useGetAnalyticsQuery();
  const statusDataRaw = data?.data?.statusData ?? [];
  const statusMap = Object.fromEntries(
    statusDataRaw.map((item) => [item.name, Number(item.value) || 0]),
  ) as Record<string, number>;

  const analytics = data?.data?.analytics
    ? (() => {
        const raw = data.data.analytics;
        const totalFacilities = raw.totalFacilities ?? 0;
        const closedFacilities = raw.closedFacilities ?? 0;
        const totalConnections = raw.totalConnections ?? 0;
        const utilityAuditsCompleted = raw.utilityAuditsCompleted ?? 0;

        return {
          totalFacilities,
          completedAudits: raw.completedAudits ?? statusMap.Completed ?? 0,
          inProgressAudits: raw.inProgressAudits ?? statusMap["In Progress"] ?? 0,
          pendingAudits: raw.pendingAudits ?? statusMap.Pending ?? 0,
          utilityAuditsCompleted,
          utilityAuditsPending:
            raw.utilityAuditsPending ?? Math.max(totalConnections - utilityAuditsCompleted, 0),
          closedFacilities,
          openFacilities:
            raw.openFacilities ?? Math.max(totalFacilities - closedFacilities, 0),
          totalCapacity: raw.totalCapacity ?? 0,
          totalConnections,
          dgCapacity: raw.dgCapacity ?? 0,
          solarCapacity: raw.solarCapacity ?? 0,
        };
      })()
    : null;
  const statusData =
    statusDataRaw.map((item) => ({
      ...item,
      color: STATUS_COLORS[item.name] || "oklch(0.65 0 0)",
    })) ?? [];

  const energySourceData =
    data?.data?.energySourceData?.map((item) => ({
      ...item,
      fill: ENERGY_COLORS[item.name] || "oklch(0.65 0 0)",
    })) ?? [];

  const capacityByCity = data?.data?.capacityByCity ?? [];
  const timeSeriesData = data?.data?.timeSeriesData ?? [];

  // 🔄 Loading
  if (isLoading) {
    return (
      <DashboardLayout title="Analytics" subtitle="Power insights">
        <div className="py-10 text-center text-sm text-muted-foreground">
          Loading analytics...
        </div>
      </DashboardLayout>
    );
  }

  // ❌ Error
  if (isError || !analytics) {
    return (
      <DashboardLayout title="Analytics" subtitle="Power insights">
        <div className="py-10 text-center text-sm text-destructive">
          Failed to load analytics.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Power infrastructure insights and trends"
    >
      {/* 🔹 Key Metrics */}
      <div className="grid min-w-0 grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Facilities"
          value={analytics.totalFacilities}
          icon={Building2}
        />

        <StatsCard
          title="Closed Facilities"
          value={analytics.closedFacilities}
          icon={CheckCircle}
          description="Audit closure done"
        />

        <StatsCard
          title="Open Facilities"
          value={analytics.openFacilities}
          icon={Clock}
          description={`${analytics.inProgressAudits ?? 0} in progress`}
        />

        <StatsCard
          title="Total Capacity"
          value={`${(analytics.totalCapacity / 1000).toFixed(1)} MW`}
          icon={Zap}
        />
      </div>

      {/* 🔹 Charts Row 1 */}
      <div className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        {/* Audit Trends */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Audit Trends
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient
                      id="colorAudits"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopOpacity={0.3} />
                      <stop offset="95%" stopOpacity={0} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="audits"
                    stroke="oklch(0.7 0.15 160)"
                    fillOpacity={1}
                    fill="url(#colorAudits)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Audit Status */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Audit Status Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value">
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Charts Row 2 */}
      <div className="mt-4 grid min-w-0 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        {/* Capacity by City */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Capacity by City</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={capacityByCity} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="city" />
                  <Tooltip />
                  <Bar dataKey="capacity" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Energy Source */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Energy Source Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px] min-h-[200px] w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={energySourceData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value">
                    {energySourceData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🔹 Summary Cards */}
      <div className="mt-6 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Connections"
          value={analytics.totalConnections}
          icon={Plug}
        />

        <StatsCard
          title="Utility Audits Completed"
          value={analytics.utilityAuditsCompleted}
          icon={CheckCircle}
        />

        <StatsCard
          title="Utility Audits Pending"
          value={analytics.utilityAuditsPending}
          icon={Clock}
        />

        <StatsCard
          title="DG Capacity"
          value={`${analytics.dgCapacity} kVA`}
          icon={Fuel}
        />

        <StatsCard
          title="Solar Capacity"
          value={`${analytics.solarCapacity} kWp`}
          icon={Sun}
        />
      </div>
    </DashboardLayout>
  );
}
