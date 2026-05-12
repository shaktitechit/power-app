"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, CheckCircle2, Download, GaugeCircle, MapPin, Wifi } from "lucide-react";
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
  const daywisePresence = (presenceData?.data?.daywise_presence ?? [])
    .filter((entry) => entry.first_login_at !== null);
  const [activitiesOpen, setActivitiesOpen] = useState(false);
  const [selectedDayActivities, setSelectedDayActivities] = useState<{
    date: string;
    first_login_at: string | null;
    last_logout_at: string | null;
    onsite_login_at: string | null;
    offsite_login_at: string | null;
    screen_time_hours: number;
    screen_time_minutes: number;
    onsite_screen_time_hours: number;
    onsite_screen_time_minutes: number;
    offsite_screen_time_hours: number;
    offsite_screen_time_minutes: number;
    activity_count: number;
    onsite_activity_count: number;
    offsite_activity_count: number;
    activities: {
      _id: string;
      action: string;
      entity_type: string;
      entity_name: string;
      message: string;
      mode: "onsite" | "offsite" | null;
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
    return [y - 2, y - 1, y];
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
                      max={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`}
                    />
                  ) : (
                    <>
                      <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => {
                          const date = new Date(2000, m - 1);
                          const monthName = date.toLocaleString("default", { month: "long" });
                          return (
                            <option
                              key={m}
                              value={m}
                              disabled={selectedYear === now.getFullYear() && m > now.getMonth() + 1}
                            >
                              {monthName}
                            </option>
                          );
                        })}
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
                    className="rounded-md border p-3 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="font-medium">{entry.date}</p>
                        <p className="text-sm text-muted-foreground">
                          First Login: {formatDateTime(entry.first_login_at)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Logout: {formatDateTime(entry.last_logout_at)}
                        </p>
                        {/* Mode login times */}
                        <div className="flex flex-wrap gap-2 pt-0.5">
                          {entry.onsite_login_at ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              <MapPin className="h-3 w-3" />
                              On-site login: {formatDateTime(entry.onsite_login_at)}
                            </span>
                          ) : null}
                          {entry.offsite_login_at ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                              <Wifi className="h-3 w-3" />
                              Off-site login: {formatDateTime(entry.offsite_login_at)}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="shrink-0 text-right space-y-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Screen Time</p>
                        <p className="font-semibold">
                          {entry.screen_time_hours < 1 
                            ? `${Math.round(Number(entry.screen_time_minutes))} min` 
                            : `${entry.screen_time_hours} hr`}
                        </p>

                        {/* Mode split screen time */}
                        {(entry.onsite_screen_time_minutes > 0 || entry.offsite_screen_time_minutes > 0) && (
                          <div className="mt-1 space-y-0.5">
                            {entry.onsite_screen_time_minutes > 0 && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                                <MapPin className="h-3 w-3" />
                                {entry.onsite_screen_time_hours < 1 
                                  ? `${Math.round(Number(entry.onsite_screen_time_minutes))} min` 
                                  : `${entry.onsite_screen_time_hours} hr`}
                              </p>
                            )}
                            {entry.offsite_screen_time_minutes > 0 && (
                              <p className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 justify-end">
                                <Wifi className="h-3 w-3" />
                                {entry.offsite_screen_time_hours < 1 
                                  ? `${Math.round(Number(entry.offsite_screen_time_minutes))} min` 
                                  : `${entry.offsite_screen_time_hours} hr`}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Activity count breakdown by mode */}
                        <div className="mt-1 space-y-0.5">
                          <p className="text-xs text-muted-foreground">
                            Activities: {entry.activity_count ?? 0}
                          </p>
                          {(entry.onsite_activity_count ?? 0) > 0 && (
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                              <MapPin className="h-3 w-3" />
                              On-site: {entry.onsite_activity_count}
                            </p>
                          )}
                          {(entry.offsite_activity_count ?? 0) > 0 && (
                            <p className="text-xs text-sky-600 dark:text-sky-400 flex items-center gap-1 justify-end">
                              <Wifi className="h-3 w-3" />
                              Off-site: {entry.offsite_activity_count}
                            </p>
                          )}
                        </div>

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
                              onsite_login_at: result.data.onsite_login_at,
                              offsite_login_at: result.data.offsite_login_at,
                              screen_time_hours: result.data.screen_time_hours,
                              screen_time_minutes: result.data.screen_time_minutes,
                              onsite_screen_time_hours: result.data.onsite_screen_time_hours,
                              onsite_screen_time_minutes: result.data.onsite_screen_time_minutes,
                              offsite_screen_time_hours: result.data.offsite_screen_time_hours,
                              offsite_screen_time_minutes: result.data.offsite_screen_time_minutes,
                              activity_count: result.data.activity_count,
                              onsite_activity_count: result.data.onsite_activity_count,
                              offsite_activity_count: result.data.offsite_activity_count,
                              activities: result.data.activities,
                            });
                            setActivitiesOpen(true);
                          }}
                        >
                          View Activities
                        </Button>
                      </div>
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
            <p>Login: {formatDateTime(selectedDayActivities?.first_login_at || null)}</p>
            <p>Logout: {formatDateTime(selectedDayActivities?.last_logout_at || null)}</p>

            {/* Mode login times in dialog */}
            <div className="flex flex-wrap gap-2 pt-1">
              {selectedDayActivities?.onsite_login_at ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <MapPin className="h-3 w-3" />
                  On-site login: {formatDateTime(selectedDayActivities.onsite_login_at)}
                </span>
              ) : null}
              {selectedDayActivities?.offsite_login_at ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                  <Wifi className="h-3 w-3" />
                  Off-site login: {formatDateTime(selectedDayActivities.offsite_login_at)}
                </span>
              ) : null}
            </div>

            {/* Mode screen time breakdown */}
            {selectedDayActivities && (
              <div className="mt-2 flex flex-wrap gap-3 border-t pt-2">
                <div className="text-xs">
                  <span className="text-muted-foreground">Total: </span>
                  <span className="font-medium text-foreground">
                    {selectedDayActivities.screen_time_hours < 1 
                      ? `${Math.round(Number(selectedDayActivities.screen_time_minutes))} min` 
                      : `${selectedDayActivities.screen_time_hours} hr`}
                  </span>
                </div>
                {selectedDayActivities.onsite_screen_time_minutes > 0 && (
                  <div className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      On-site: {selectedDayActivities.onsite_screen_time_hours < 1 
                        ? `${Math.round(Number(selectedDayActivities.onsite_screen_time_minutes))} min` 
                        : `${selectedDayActivities.onsite_screen_time_hours} hr`}
                    </span>
                  </div>
                )}
                {selectedDayActivities.offsite_screen_time_minutes > 0 && (
                  <div className="text-xs flex items-center gap-1">
                    <Wifi className="h-3 w-3 text-sky-500" />
                    <span className="text-sky-600 dark:text-sky-400 font-medium">
                      Off-site: {selectedDayActivities.offsite_screen_time_hours < 1 
                        ? `${Math.round(Number(selectedDayActivities.offsite_screen_time_minutes))} min` 
                        : `${selectedDayActivities.offsite_screen_time_hours} hr`}
                    </span>
                  </div>
                )}
              </div>
            )}
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
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{activity.message}</p>
                    {activity.mode === "onsite" && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <MapPin className="h-3 w-3" />
                        On-site
                      </span>
                    )}
                    {activity.mode === "offsite" && (
                      <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-xs font-medium text-sky-600 dark:text-sky-400">
                        <Wifi className="h-3 w-3" />
                        Off-site
                      </span>
                    )}
                  </div>
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
