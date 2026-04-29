"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, CheckCircle2, Download, GaugeCircle } from "lucide-react";
import {
  useGetUserPerformanceSummaryQuery,
  useGetUserPerformanceFacilitiesQuery,
  useGetUserPerformanceUtilityAccountsQuery,
  useGetUserPerformanceCompletedAuditsQuery,
  useGetUserPerformancePresenceQuery,
  useLazyGetUserPerformancePresenceActivitiesQuery,
} from "@/store/slices/UserPerformanceApiSlice";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { toast } from "sonner";
import type { AppUserRole } from "@/lib/authRoles";

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
};

/** Minutes shown with exactly two decimal places. */
const formatMinutes2 = (n: number) => Number(n).toFixed(2);

export type UserPerformanceContentProps = {
  userId: string;
  backHref: string;
  backLabel: string;
  showDownloadPdf?: boolean;
  /** If set, non-matching user roles are redirected to `backHref` (e.g. admin → managers/auditors only). */
  allowedRoles?: AppUserRole[];
};

export function UserPerformanceContent({
  userId,
  backHref,
  backLabel,
  showDownloadPdf = false,
  allowedRoles,
}: UserPerformanceContentProps) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement | null>(null);
  const now = new Date();
  const [presenceFilterType, setPresenceFilterType] = useState<"date" | "month">(
    "date",
  );
  const [selectedDate, setSelectedDate] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`,
  );
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const { data: summaryData, isLoading: summaryLoading, isError: summaryError } =
    useGetUserPerformanceSummaryQuery(userId, { skip: !userId });
  const { data: facilitiesData, isLoading: facilitiesLoading, isError: facilitiesError } =
    useGetUserPerformanceFacilitiesQuery(userId, { skip: !userId });
  const { data: utilitiesData, isLoading: utilitiesLoading, isError: utilitiesError } =
    useGetUserPerformanceUtilityAccountsQuery(userId, { skip: !userId });
  const {
    data: completedAuditsData,
    isLoading: completedLoading,
    isError: completedError,
  } = useGetUserPerformanceCompletedAuditsQuery(userId, { skip: !userId });
  const { data: presenceData, isLoading: presenceLoading, isError: presenceError } =
    useGetUserPerformancePresenceQuery(
    {
      userId,
      filterType: presenceFilterType,
      ...(presenceFilterType === "date"
        ? { date: selectedDate }
        : { month: selectedMonth, year: selectedYear }),
    },
    {
      skip: !userId,
    },
  );
  const [getPresenceActivities, { isFetching: activitiesLoading }] =
    useLazyGetUserPerformancePresenceActivitiesQuery();

  const user = summaryData?.data?.user;
  const widgets = summaryData?.data?.widgets;
  const connectedFacilities = facilitiesData?.data ?? [];
  const connectedUtilities = utilitiesData?.data ?? [];
  const completedAudits = completedAuditsData?.data ?? [];
  const daywisePresence = presenceData?.data?.daywise_presence ?? [];
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [selectedDayActivities, setSelectedDayActivities] = useState<{
    date: string;
    first_login_at: string | null;
    last_logout_at: string | null;
    activities: {
      _id: string;
      action: string;
      entity_type: string;
      entity_name: string;
      message: string;
      created_at: string | null;
    }[];
  } | null>(null);

  const completionTone = useMemo(() => {
    const value = widgets?.completion_percent ?? 0;
    if (value >= 80) return "text-green-600";
    if (value >= 50) return "text-yellow-600";
    return "text-red-600";
  }, [widgets?.completion_percent]);
  const yearOptions = useMemo(() => {
    const y = now.getFullYear();
    return [y - 2, y - 1, y, y + 1];
  }, [now]);

  const presencePeriodLabel = useMemo(() => {
    if (presenceFilterType === "date") {
      const d = new Date(`${selectedDate}T12:00:00`);
      if (Number.isNaN(d.getTime())) return selectedDate;
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return new Date(selectedYear, selectedMonth - 1, 1).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });
  }, [presenceFilterType, selectedDate, selectedMonth, selectedYear]);

  const totalLoginMinutes = useMemo(
    () =>
      daywisePresence.reduce(
        (sum, d) => sum + (Number(d.screen_time_minutes) || 0),
        0,
      ),
    [daywisePresence],
  );

  const totalLoginTimeLabel = useMemo(() => {
    const total = totalLoginMinutes;
    if (total <= 0) return "0.00 min";
    const h = Math.floor(total / 60);
    const m = total - h * 60;
    const mStr = formatMinutes2(m);
    if (h <= 0) return `${mStr} min`;
    if (m < 0.005) return `${h} hr`;
    return `${h} hr ${mStr} min`;
  }, [totalLoginMinutes]);

  const isLoading =
    summaryLoading ||
    facilitiesLoading ||
    utilitiesLoading ||
    completedLoading ||
    presenceLoading;
  const isError =
    summaryError ||
    facilitiesError ||
    utilitiesError ||
    completedError ||
    presenceError;

  useEffect(() => {
    if (!user?.role || !allowedRoles?.length) return;
    if (!allowedRoles.includes(user.role as AppUserRole)) {
      router.replace(backHref);
    }
  }, [user?.role, allowedRoles, backHref, router]);

  /** System print → “Save as PDF” / “Microsoft Print to PDF” — works with Tailwind v4 (oklch/lab). */
  const handleSaveAsPdf = () => {
    if (!printRef.current) {
      toast.error("Nothing to print yet.");
      return;
    }
    setActivitiesOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="User Performance">
        <p className="text-sm text-muted-foreground">Loading performance data...</p>
      </DashboardLayout>
    );
  }

  if (isError || !user || !widgets) {
    return (
      <DashboardLayout title="User Performance">
        <div className="space-y-3">
          <p className="text-sm text-destructive">Unable to load user performance.</p>
          <Button variant="outline" onClick={() => router.push(backHref)}>
            {backLabel}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={`${user.name} Performance`}
      subtitle={`${user.email} • ${user.role}`}
    >
      <div className="user-performance-print-area">
        <div className="user-performance-no-print mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button asChild variant="ghost" className="w-fit pl-0">
            <Link href={backHref}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
          {showDownloadPdf ? (
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveAsPdf}
              title="Opens print. Choose “Save as PDF” or “Microsoft Print to PDF” as the printer."
            >
              <Download className="mr-2 h-4 w-4" />
              Save as PDF
            </Button>
          ) : null}
        </div>

        <div className="mb-2 hidden print:block print:border-b print:pb-3">
          <h1 className="text-xl font-semibold text-neutral-900">
            {user.name} — Performance
          </h1>
          <p className="text-sm text-neutral-600">
            {user.email} • {user.role}
          </p>
          <p className="mt-1 text-sm text-neutral-800">
            Total login time ({presencePeriodLabel}): {totalLoginTimeLabel}
          </p>
        </div>

        <div id="performance-pdf-capture" ref={printRef} className="space-y-0">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 print:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connected Facilities
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-bold">{widgets?.connected_facilities ?? 0}</p>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connected Utility Accounts
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {widgets?.connected_utility_accounts ?? 0}
              </p>
              <GaugeCircle className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Utility Audits
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <p className="text-3xl font-bold">
                {widgets?.completed_utility_account_audits ?? 0}
              </p>
              <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Utility Audit Completion
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${completionTone}`}>
                {widgets?.completion_percent ?? 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2 print:hidden">
          <Card className="print:mb-4 print:break-inside-avoid">
            <CardHeader>
              <CardTitle>
                Connected Facilities ({connectedFacilities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {connectedFacilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No connected facilities.</p>
              ) : (
                connectedFacilities.map((facility) => (
                  <div
                    key={facility._id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{facility.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {facility.city} • {facility.facility_type || "other"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={facility.status === "active" ? "default" : "secondary"}>
                        {facility.status}
                      </Badge>
                      <Badge variant={facility.audit_closed ? "default" : "outline"}>
                        {facility.audit_closed ? "Audit Closed" : "Audit Open"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="print:mb-4 print:break-inside-avoid">
            <CardHeader>
              <CardTitle>
                Connected Utility Accounts ({connectedUtilities.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
              {connectedUtilities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No connected utility accounts.
                </p>
              ) : (
                connectedUtilities.map((utility) => (
                  <div
                    key={utility._id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="font-medium">{utility.account_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {utility.facility?.name || "Unknown Facility"} •{" "}
                        {utility.connection_type}
                        {utility.category ? ` • ${utility.category}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={utility.is_active ? "default" : "secondary"}>
                        {utility.is_active ? "Active" : "Inactive"}
                      </Badge>
                      <Badge variant={utility.audit_completed ? "default" : "outline"}>
                        {utility.audit_completed ? "Completed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6 print:mb-4 print:break-inside-avoid print:hidden">
          <CardHeader>
            <CardTitle>
              Completed Utility Account Audits ({completedAudits.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
            {completedAudits.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed utility audits.</p>
            ) : (
              completedAudits.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{entry.account_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.facility?.name || "Unknown Facility"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Completed By: {entry.completed_by || "-"}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Completed: {formatDateTime(entry.completed_at)}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 print:mb-4 print:break-inside-avoid">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Daywise Login/Logout & Screen Time</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground print:text-neutral-700">
                  Total login time for {presencePeriodLabel}:{" "}
                  <span className="font-semibold text-foreground">{totalLoginTimeLabel}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 print:hidden">
                <select
                  value={presenceFilterType}
                  onChange={(e) =>
                    setPresenceFilterType(e.target.value as "date" | "month")
                  }
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="date">Single Date</option>
                  <option value="month">Full Month</option>
                </select>

                {presenceFilterType === "date" ? (
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[180px]"
                  />
                ) : (
                  <>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(Number(e.target.value))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      <option value={1}>January</option>
                      <option value={2}>February</option>
                      <option value={3}>March</option>
                      <option value={4}>April</option>
                      <option value={5}>May</option>
                      <option value={6}>June</option>
                      <option value={7}>July</option>
                      <option value={8}>August</option>
                      <option value={9}>September</option>
                      <option value={10}>October</option>
                      <option value={11}>November</option>
                      <option value={12}>December</option>
                    </select>

                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(Number(e.target.value))}
                      className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                    >
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-3 overflow-y-auto pr-1 print:max-h-none print:overflow-visible">
            {daywisePresence.length === 0 ? (
              <p className="text-sm text-muted-foreground">No daywise presence data.</p>
            ) : (
              daywisePresence.map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="font-medium">{entry.date}</p>
                    <p className="text-sm text-muted-foreground">
                      First Login: {formatDateTime(entry.first_login_at)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last Logout: {formatDateTime(entry.last_logout_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Screen Time</p>
                    <p className="font-medium">{entry.screen_time_hours} hr</p>
                    <p className="text-xs text-muted-foreground">
                      ({formatMinutes2(Number(entry.screen_time_minutes) || 0)} min)
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Activities: {entry.activity_count}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2 print:hidden"
                      onClick={async () => {
                        const result = await getPresenceActivities({
                          userId,
                          date: entry.date,
                        }).unwrap();
                        setSelectedDayActivities({
                          date: result.data.date,
                          first_login_at: result.data.first_login_at,
                          last_logout_at: result.data.last_logout_at,
                          activities: result.data.activities,
                        });
                        setActivitiesOpen(true);
                      }}
                    >
                      View Activities
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        </div>
      </div>

      <Dialog open={activitiesOpen} onOpenChange={setActivitiesOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Activities for {selectedDayActivities?.date || "-"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Login: {formatDateTime(selectedDayActivities?.first_login_at || null)}
            </p>
            <p>
              Logout: {formatDateTime(selectedDayActivities?.last_logout_at || null)}
            </p>
          </div>

          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {activitiesLoading ? (
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            ) : null}
            {!selectedDayActivities?.activities?.length ? (
              <p className="text-sm text-muted-foreground">
                No activities in this login period.
              </p>
            ) : (
              selectedDayActivities.activities.map((activity) => (
                <div key={activity._id} className="rounded-md border p-3">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {activity.action} • {activity.entity_type}
                    {activity.entity_name ? ` • ${activity.entity_name}` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(activity.created_at)}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
