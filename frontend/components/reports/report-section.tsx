"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  RotateCcw,
  Trash2,
} from "lucide-react";

import {
  useDeleteReportMutation,
  useGenerateReportMutation,
  useGetReportsQuery,
  useRegenerateReportMutation,
  type Report,
  type ReportScope,
  type ReportType,
} from "@/store/slices/reportApiSlice";

import { useGetFacilitiesQuery } from "@/store/slices/facilityApiSlice";
import { useGetUtilityAccountsQuery } from "@/store/slices/utilityApiSlice";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";

type FacilityOption = {
  _id: string;
  name: string;
  city?: string;
};

type UtilityAccountOption = {
  _id: string;
  account_number?: string;
  connection_type?: string;
  category?: string;
  facility_id?: string;
};

type ReportsSectionProps = {
  defaultFacilityId?: string;
  defaultUtilityAccountId?: string;
};

const REPORT_TYPE_OPTIONS: { label: string; value: ReportType }[] = [
  { label: "Full Audit Report", value: "full_audit_report" },
  { label: "Executive Summary", value: "executive_summary" },
  { label: "Solar Report", value: "solar_report" },
  { label: "DG Report", value: "dg_report" },
  { label: "Transformer Report", value: "transformer_report" },
  { label: "Pump Report", value: "pump_report" },
  { label: "HVAC Report", value: "hvac_report" },
  { label: "Lighting Report", value: "lighting_report" },
  { label: "AC Report", value: "ac_report" },
  { label: "Fan Report", value: "fan_report" },
  { label: "Lux Report", value: "lux_report" },
  { label: "Misc Report", value: "misc_report" },
];

const REPORT_SCOPE_OPTIONS: { label: string; value: ReportScope }[] = [
  { label: "Facility", value: "facility" },
  { label: "Utility Account", value: "utility_account" },
];

const REPORT_TYPE_LABEL_MAP: Record<ReportType, string> = {
  full_audit_report: "Full Audit Report",
  executive_summary: "Executive Summary",
  solar_report: "Solar Report",
  dg_report: "DG Report",
  transformer_report: "Transformer Report",
  pump_report: "Pump Report",
  hvac_report: "HVAC Report",
  lighting_report: "Lighting Report",
  ac_report: "AC Report",
  fan_report: "Fan Report",
  lux_report: "Lux Report",
  misc_report: "Misc Report",
};

const REPORT_SCOPE_LABEL_MAP: Record<ReportScope, string> = {
  facility: "Facility",
  utility_account: "Utility Account",
};

const getStatusClasses = (status?: string) => {
  switch (status) {
    case "queued":
      return "border-blue-200 bg-blue-100 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300";
    case "completed":
      return "border-green-200 bg-green-100 text-green-800 dark:border-green-500/40 dark:bg-green-500/15 dark:text-green-300";
    case "processing":
      return "border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200";
    case "failed":
      return "border-red-200 bg-red-100 text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-300";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
};

const getStatusLabel = (status?: string) => {
  switch (status) {
    case "queued":
      return "Queued";
    case "processing":
      return "Processing";
    case "completed":
      return "Completed";
    case "failed":
      return "Failed";
    default:
      return "-";
  }
};

const formatDateTime = (value?: string) => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getFacilityName = (facility: Report["facility_id"]) => {
  if (!facility) return "-";
  if (typeof facility === "string") return facility;
  return facility.name || "-";
};

const getUtilityAccountNumber = (
  utilityAccount: Report["utility_account_id"],
) => {
  if (!utilityAccount) return "-";
  if (typeof utilityAccount === "string") return utilityAccount;
  return utilityAccount.account_number || "-";
};

export default function ReportsSection({
  defaultFacilityId = "",
  defaultUtilityAccountId = "",
}: ReportsSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewDocuments = user?.role === "admin";
  const [facilityId, setFacilityId] = useState(defaultFacilityId);
  const [utilityAccountId, setUtilityAccountId] = useState(
    defaultUtilityAccountId,
  );
  const [reportScope, setReportScope] = useState<ReportScope>(
    defaultUtilityAccountId ? "utility_account" : "facility",
  );
  const [reportType, setReportType] = useState<ReportType>("full_audit_report");
  const [customTitle, setCustomTitle] = useState("");

  const { data: facilitiesResponse, isLoading: facilitiesLoading } =
    useGetFacilitiesQuery(undefined);

  const facilities: FacilityOption[] = useMemo(() => {
    const raw = facilitiesResponse?.data ?? facilitiesResponse ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [facilitiesResponse]);

  const { data: utilityAccountsResponse, isLoading: utilityAccountsLoading } =
    useGetUtilityAccountsQuery(
      facilityId ? { facility_id: facilityId } : undefined,
      { skip: !facilityId },
    );

  const utilityAccounts: UtilityAccountOption[] = useMemo(() => {
    const raw = utilityAccountsResponse?.data ?? utilityAccountsResponse ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [utilityAccountsResponse]);

  const {
    data: reportsResponse,
    isLoading: reportsLoading,
    isFetching: reportsFetching,
    refetch: refetchReports,
  } = useGetReportsQuery(
    facilityId
      ? {
          facility_id: facilityId,
        }
      : undefined,
  );

  const reports: Report[] = useMemo(() => {
    return reportsResponse?.data ?? [];
  }, [reportsResponse]);

  const [generateReport, { isLoading: isGenerating }] =
    useGenerateReportMutation();
  const [regenerateReport, { isLoading: isRegenerating }] =
    useRegenerateReportMutation();
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  useEffect(() => {
    if (defaultFacilityId) {
      setFacilityId(defaultFacilityId);
    }
  }, [defaultFacilityId]);

  useEffect(() => {
    if (defaultUtilityAccountId) {
      setUtilityAccountId(defaultUtilityAccountId);
      setReportScope("utility_account");
    }
  }, [defaultUtilityAccountId]);

  useEffect(() => {
    if (reportScope === "facility") {
      setUtilityAccountId("");
    }
  }, [reportScope]);

  const selectedFacility = useMemo(
    () => facilities.find((item) => item._id === facilityId),
    [facilities, facilityId],
  );

  const selectedUtilityAccount = useMemo(
    () => utilityAccounts.find((item) => item._id === utilityAccountId),
    [utilityAccounts, utilityAccountId],
  );

  const hasActiveReports = useMemo(
    () =>
      reports.some(
        (report) =>
          report.status === "queued" || report.status === "processing",
      ),
    [reports],
  );

  useEffect(() => {
    if (!hasActiveReports) return;

    const interval = setInterval(() => {
      refetchReports();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasActiveReports, refetchReports]);

  const isSubmitDisabled =
    !facilityId ||
    (reportScope === "utility_account" && !utilityAccountId) ||
    isGenerating;

  const handleGenerateReport = async () => {
    try {
      await toastHandler({
        action: () =>
          generateReport({
            facility_id: facilityId,
            utility_account_id:
              reportScope === "utility_account" ? utilityAccountId : undefined,
            report_scope: reportScope,
            report_type: reportType,
            title: customTitle.trim() || undefined,
            snapshot_meta: {
              facility_name: selectedFacility?.name || "",
              facility_city: selectedFacility?.city || "",
              utility_account_number:
                reportScope === "utility_account"
                  ? selectedUtilityAccount?.account_number || ""
                  : "",
            },
          }).unwrap(),
        loading: "Queuing report...",
        success: "Report queued successfully",
      });

      setCustomTitle("");
      refetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  const handleRegenerateReport = async (reportId: string) => {
    try {
      await toastHandler({
        action: () => regenerateReport(reportId).unwrap(),
        loading: "Queuing regeneration...",
        success: "Report regeneration queued",
      });

      refetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this report?",
    );

    if (!confirmed) return;

    try {
      await toastHandler({
        action: () => deleteReport(reportId).unwrap(),
        loading: "Deleting report...",
        success: "Report deleted successfully",
      });

      refetchReports();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-2xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Generate Reports
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="min-w-0 space-y-2">
              <Label>Facility</Label>
              <Select
                value={facilityId || undefined}
                onValueChange={(value) => {
                  setFacilityId(value);
                  setUtilityAccountId("");
                }}
              >
                <SelectTrigger className="h-9 w-full max-w-full min-w-0">
                  <SelectValue
                    placeholder={
                      facilitiesLoading
                        ? "Loading facilities..."
                        : "Select facility"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {facilities.map((facility) => (
                    <SelectItem key={facility._id} value={facility._id}>
                      {facility.name}
                      {facility.city ? ` - ${facility.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report Scope</Label>
              <Select
                value={reportScope}
                onValueChange={(value: ReportScope) => setReportScope(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select report scope" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_SCOPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Utility Account</Label>
              <Select
                value={utilityAccountId || undefined}
                onValueChange={setUtilityAccountId}
                disabled={!facilityId || reportScope !== "utility_account"}
              >
                <SelectTrigger className="h-9 w-full max-w-full min-w-0">
                  <SelectValue
                    placeholder={
                      !facilityId
                        ? "Select facility first"
                        : utilityAccountsLoading
                          ? "Loading utility accounts..."
                          : reportScope !== "utility_account"
                            ? "Not required for facility report"
                            : "Select utility account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {utilityAccounts.map((account) => (
                    <SelectItem key={account._id} value={account._id}>
                      {account.account_number || "No Account Number"}
                      {account.connection_type
                        ? ` - ${account.connection_type}`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={(value: ReportType) => setReportType(value)}
              >
                <SelectTrigger className="h-9 w-full max-w-full min-w-0">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {REPORT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0 space-y-2">
              <Label>Custom Title (Optional)</Label>
              <Input
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Enter report title or leave blank for auto title"
                className="h-9 w-full"
              />
            </div>

            <div className="flex w-full shrink-0 items-end md:w-auto md:justify-end">
              <Button
                onClick={handleGenerateReport}
                disabled={isSubmitDisabled}
                className="inline-flex h-9 w-full min-w-[11.5rem] md:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Queuing...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold">
            Generated Reports
          </CardTitle>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchReports()}
            disabled={reportsLoading || reportsFetching}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${
                reportsLoading || reportsFetching ? "animate-spin" : ""
              }`}
            />
            Refresh
          </Button>
        </CardHeader>

        <CardContent>
          {reportsLoading ? (
            <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading reports...
            </div>
          ) : reports.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No reports found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full overflow-hidden rounded-xl border border-border border-separate border-spacing-0">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm font-medium text-foreground">
                    <th className="border-b px-4 py-3">Title</th>
                    <th className="border-b px-4 py-3">Facility</th>
                    <th className="border-b px-4 py-3">Utility Account</th>
                    <th className="border-b px-4 py-3">Type</th>
                    <th className="border-b px-4 py-3">Scope</th>
                    <th className="border-b px-4 py-3">Status</th>
                    <th className="border-b px-4 py-3">Generated At</th>
                    <th className="border-b px-4 py-3 text-center">Files</th>
                    <th className="border-b px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="bg-card">
                  {reports.map((report) => (
                    <tr key={report._id} className="text-sm text-foreground">
                      <td className="border-b px-4 py-3 font-medium">
                        {report.title || "-"}
                      </td>

                      <td className="border-b px-4 py-3">
                        {getFacilityName(report.facility_id)}
                      </td>

                      <td className="border-b px-4 py-3">
                        {getUtilityAccountNumber(report.utility_account_id)}
                      </td>

                      <td className="border-b px-4 py-3">
                        {REPORT_TYPE_LABEL_MAP[report.report_type] ||
                          report.report_type}
                      </td>

                      <td className="border-b px-4 py-3">
                        {REPORT_SCOPE_LABEL_MAP[report.report_scope] ||
                          report.report_scope}
                      </td>

                      <td className="border-b px-4 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                            report.status,
                          )}`}
                        >
                          {getStatusLabel(report.status)}
                        </span>
                      </td>

                      <td className="border-b px-4 py-3">
                        {formatDateTime(report.generated_at)}
                      </td>

                      <td className="border-b px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-green-200 text-green-800 hover:bg-green-50 dark:border-green-500/40 dark:text-green-300 dark:hover:bg-green-500/10"
                            disabled={!canViewDocuments || !report.excel_file?.fileUrl}
                            onClick={() => {
                              if (report.excel_file?.fileUrl) {
                                window.open(
                                  report.excel_file.fileUrl,
                                  "_blank",
                                );
                              }
                            }}
                          >
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Excel
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-blue-200 text-blue-800 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
                            disabled={!canViewDocuments || !report.pdf_file?.fileUrl}
                            onClick={() => {
                              if (report.pdf_file?.fileUrl) {
                                window.open(report.pdf_file.fileUrl, "_blank");
                              }
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            PDF
                          </Button>
                        </div>

                        {report.status === "failed" && report.error_message ? (
                          <p className="mt-2 text-xs text-destructive">
                            {report.error_message}
                          </p>
                        ) : null}
                        {!canViewDocuments ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Report files are visible to admin users only.
                          </p>
                        ) : null}
                      </td>

                      <td className="border-b px-4 py-3">
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={
                              report.status === "queued" ||
                              report.status === "processing" ||
                              isRegenerating
                            }
                            onClick={() => handleRegenerateReport(report._id)}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Regenerate
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-800 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                            disabled={isDeleting}
                            onClick={() => handleDeleteReport(report._id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
