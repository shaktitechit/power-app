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

  const analytics = data?.data?.analytics ?? null;
  const stats = data?.data?.stats ?? null; // 🔥 future ready

  const statusData =
    data?.data?.statusData?.map((item) => ({
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
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Facilities"
          value={analytics.totalFacilities}
          icon={Building2}
        />

        <StatsCard
          title="Completed Audits"
          value={analytics.completedAudits}
          icon={CheckCircle}
        />

        <StatsCard
          title="Pending Audits"
          value={analytics.pendingAudits}
          icon={Clock}
          description="Requires attention"
        />

        <StatsCard
          title="Total Capacity"
          value={`${(analytics.totalCapacity / 1000).toFixed(1)} MW`}
          icon={Zap}
        />
      </div>

      {/* 🔹 Charts Row 1 */}
      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        {/* Audit Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Audit Trends
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px]">
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
        <Card>
          <CardHeader>
            <CardTitle>Audit Status Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer>
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
      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
        {/* Capacity by City */}
        <Card>
          <CardHeader>
            <CardTitle>Capacity by City</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer>
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
        <Card>
          <CardHeader>
            <CardTitle>Energy Source Distribution</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer>
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
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Connections"
          value={analytics.totalConnections}
          icon={Plug}
        />

        <StatsCard
          title="DG Capacity"
          value={analytics.dgCapacity}
          icon={Fuel}
        />

        <StatsCard
          title="Solar Capacity"
          value={analytics.solarCapacity}
          icon={Sun}
        />
      </div>
    </DashboardLayout>
  );
}
