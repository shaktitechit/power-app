"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Building2, Activity, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useAppSelector } from "@/store/hooks";
import { useEffect, useMemo, useState } from "react";
import { useGetDashboardOverviewQuery } from "@/store/slices/dashboardApiSlice";
import { useGetFacilitiesQuery } from "@/store/slices/facilityApiSlice";
import { usePresenceMap } from "@/hooks/presenceMap";

const formatRelativeTime = (dateString?: string | null) => {
  if (!dateString) return "No activity";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "No activity";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hr ago`;
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;

  return date.toLocaleDateString();
};

const getPresenceDotClass = (status?: string) => {
  switch (status) {
    case "online":
      return "bg-green-500";
    case "away":
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
};

type TeamMember = {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  appearance?: {
    status?: string;
    lastSeen?: string | null;
  };
};

export default function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);
  const [mounted, setMounted] = useState(false);
  const presenceMap = usePresenceMap();

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    isFetching: dashboardFetching,
  } = useGetDashboardOverviewQuery(undefined, {
    pollingInterval: 30000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: facilitiesResponse, isLoading: facilitiesLoading } =
    useGetFacilitiesQuery();

  useEffect(() => {
    setMounted(true);
  }, []);

  const recentActivities = dashboardData?.data?.recentActivities || [];
  const userAppearance: TeamMember[] =
    dashboardData?.data?.userAppearance || [];

  const recentFacilities = useMemo(() => {
    const facilities = facilitiesResponse?.data || facilitiesResponse || [];

    if (!Array.isArray(facilities)) return [];

    return [...facilities]
      .sort((a: any, b: any) => {
        const aDate = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const bDate = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return bDate - aDate;
      })
      .slice(0, 6);
  }, [facilitiesResponse]);

  const getMergedPresenceStatus = (member: TeamMember) => {
    return presenceMap[member._id] || member.appearance?.status || "offline";
  };

  const getMergedPresenceTime = (member: TeamMember) => {
    const liveStatus = presenceMap[member._id];

    if (liveStatus === "online" || liveStatus === "away") {
      return "Live now";
    }

    return formatRelativeTime(member.appearance?.lastSeen);
  };

  if (!mounted) return null;

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={`Welcome back, ${user?.name || "User"}`}
    >
      {/* Facilities — primary focus */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg text-card-foreground">
                Recent facilities
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest updates across your portfolio
              </p>
            </div>
          </div>
          <Link
            href="/facilities"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {facilitiesLoading ? (
              <p className="col-span-full text-sm text-muted-foreground">
                Loading facilities...
              </p>
            ) : recentFacilities.length > 0 ? (
              recentFacilities.map((facility: any) => (
                <Link
                  key={facility._id}
                  href={`/facility/${facility._id}`}
                  className="group rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                        {facility.name}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {facility.city || "Unknown city"}
                      </p>
                    </div>
                    <StatusBadge status={facility.status || "active"} />
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground sm:text-sm">
                    <span>{facility.facility_type || "Facility"}</span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <TrendingUp className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      Updated{" "}
                      {formatRelativeTime(
                        facility.updatedAt || facility.createdAt,
                      )}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="col-span-full text-sm text-muted-foreground">
                No facilities found.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity & team */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border/60 pb-4">
            <div>
              <CardTitle className="text-card-foreground">
                Recent activity
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Latest actions in your workspace
              </p>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-3">
              {dashboardLoading || dashboardFetching ? (
                <p className="text-sm text-muted-foreground">
                  Loading activities...
                </p>
              ) : recentActivities.length > 0 ? (
                recentActivities.slice(0, 6).map((activity) => (
                  <div
                    key={activity._id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 p-3"
                  >
                    <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {activity.message || activity.entity_name || "Activity"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {activity.facility?.name || "No facility"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.actor?.name || "User"} •{" "}
                        {formatRelativeTime(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No recent activity found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="border-b border-border/60 pb-4">
            <CardTitle className="text-card-foreground">Team presence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Who is online right now
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="space-y-3">
              {dashboardLoading || dashboardFetching ? (
                <p className="text-sm text-muted-foreground">
                  Loading presence...
                </p>
              ) : userAppearance.length > 0 ? (
                userAppearance.slice(0, 8).map((member) => {
                  const mergedStatus = getMergedPresenceStatus(member);
                  const mergedTime = getMergedPresenceTime(member);

                  return (
                    <div
                      key={member._id}
                      className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 shrink-0 rounded-full ${getPresenceDotClass(
                            mergedStatus,
                          )}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {member.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs font-medium capitalize text-foreground">
                          {mergedStatus}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {mergedTime}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground">
                  No presence data found.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
