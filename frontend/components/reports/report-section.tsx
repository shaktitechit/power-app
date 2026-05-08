"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

import { toSameOriginFileManagementUrl } from "@/lib/fileManagementUrls";

import {
  canGenerateReports,
  canManageResource,
} from "@/lib/authRoles";
import {
  useDeleteReportMutation,
  useGenerateReportMutation,
  useGetReportsQuery,
  useRegenerateReportMutation,
  REPORT_GENERATION_TYPE,
  type Report,
  type ReportScope,
  type ReportType,
} from "@/store/slices/reportApiSlice";

import { useGetFacilitiesQuery } from "@/store/slices/facilityApiSlice";
import {
  useGetUtilityAccountsQuery,
  type UtilityAccount,
} from "@/store/slices/electrical-audit/utilityApiSlice";
import { toastHandler } from "@/lib/toast";
import { useAppSelector } from "@/store/hooks";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import {
  AUDIT_TYPE_OPTIONS,
  ELECTRICAL_SAFETY_AUDIT,
  type AuditTypeOption,
} from "@/lib/facilityConstants";
import { ELECTRICAL_ENERGY_REPORT_TYPE_LABELS } from "@/lib/reports/electricalEnergyReportTypes";
import {
  ELECTRICAL_SAFETY_AUDIT_REPORT_TYPE_LABELS,
  ELECTRICAL_SAFETY_GRANULAR_REPORT_TYPE_LABELS,
  isElectricalSafetyAuditReportType,
} from "@/lib/reports/electricalSafetyAuditReportTypes";
import { labelForFullAuditGeneration } from "@/lib/reports/generationReportPolicy";

type FacilityOption = {
  _id: string;
  name: string;
  city?: string;
  audit_type?: string;
  audit_closure?: {
    closed_at?: string;
  };
};

type ReportsSectionProps = {
  defaultFacilityId?: string;
  defaultUtilityAccountId?: string;
};

const REPORT_TYPE_LABEL_MAP: Record<ReportType, string> = {
  ...ELECTRICAL_ENERGY_REPORT_TYPE_LABELS,
  ...ELECTRICAL_SAFETY_GRANULAR_REPORT_TYPE_LABELS,
};

const REPORT_SCOPE_LABEL_MAP: Record<ReportScope, string> = {
  facility: "Facility",
  utility_account: "Utility Account",
};

const REPORT_SCOPE_OPTIONS: { label: string; value: ReportScope }[] = [
  { label: "Facility", value: "facility" },
  { label: "Utility Account", value: "utility_account" },
];

const getStatusClasses = (status?: string) => {
  switch (status) {
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

type FacilityLike = NonNullable<Report["facility_id"]>;
type FacilityWithAudit = Extract<FacilityLike, { audit_type?: string }>;

function getReportTypeRowLabel(report: Report): string {
  const facility = report.facility_id;
  const auditType =
    typeof facility === "object" &&
    facility !== null &&
    "audit_type" in facility
      ? (facility as FacilityWithAudit).audit_type
      : undefined;

  if (
    auditType === ELECTRICAL_SAFETY_AUDIT &&
    isElectricalSafetyAuditReportType(report.report_type)
  ) {
    return ELECTRICAL_SAFETY_AUDIT_REPORT_TYPE_LABELS[report.report_type];
  }

  return REPORT_TYPE_LABEL_MAP[report.report_type] ?? report.report_type;
}

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

const getCurrentUserId = (user: any): string => {
  if (!user) return "";
  if (typeof user._id === "string" && user._id) return user._id;
  if (typeof user.id === "string" && user.id) return user.id;
  return "";
};

const getReportCreatorId = (report: Report): string => {
  if (typeof report.created_by === "string") return report.created_by;
  if (report.created_by && typeof report.created_by._id === "string") {
    return report.created_by._id;
  }
  return "";
};

const getFacilityClosureStatusLabel = (facility: FacilityOption) => {
  return facility.audit_closure?.closed_at ? "Closed" : "Open";
};

const getUtilityAuditStatusLabel = (account: UtilityAccount) => {
  const isAuditCompleted = Boolean(
    account.audit_step_submissions?.[UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT]
      ?.submitted_at,
  );
  return isAuditCompleted ? "Audit Completed" : "Audit Pending";
};

export default function ReportsSection({
  defaultFacilityId = "",
  defaultUtilityAccountId = "",
}: ReportsSectionProps) {
  const user = useAppSelector((state) => state.auth.user);
  const canViewReport = canManageResource(
    user?.role,
    user?.permissions || [],
    "report",
    "view_report",
  );
  const canGenerateReport = canGenerateReports(
    user?.role,
    user?.permissions || [],
  );
  const canExportReport = canManageResource(
    user?.role,
    user?.permissions || [],
    "report",
    "export",
  );
  const canDownloadReport = canManageResource(
    user?.role,
    user?.permissions || [],
    "report",
    "download",
  );
  const canDeleteReport = canManageResource(
    user?.role,
    user?.permissions || [],
    "report",
    "delete",
  );
  /** Report outputs are gated by report permissions; file-management URLs are not a separate “file” grant for non-admins. */
  const canOpenReportFiles =
    canViewReport || canExportReport || canDownloadReport;
  const [auditType, setAuditType] = useState<AuditTypeOption | "">("");
  const [facilityId, setFacilityId] = useState(defaultFacilityId);
  const [utilityAccountId, setUtilityAccountId] = useState(
    defaultUtilityAccountId,
  );
  const [reportScope, setReportScope] = useState<ReportScope>(
    defaultUtilityAccountId ? "utility_account" : "facility",
  );
  const [customTitle, setCustomTitle] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null);

  const { data: facilitiesResponse, isLoading: facilitiesLoading } =
    useGetFacilitiesQuery(undefined);

  const facilities: FacilityOption[] = useMemo(() => {
    const raw = facilitiesResponse?.data ?? facilitiesResponse ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [facilitiesResponse]);

  const facilitiesForAuditType = useMemo(() => {
    if (!auditType) return [];
    return facilities.filter((f) => {
      const t = f.audit_type || "Electrical Energy Audit";
      return t === auditType;
    });
  }, [facilities, auditType]);

  const { data: utilityAccountsResponse, isLoading: utilityAccountsLoading } =
    useGetUtilityAccountsQuery(
      facilityId ? { facility_id: facilityId } : undefined,
      { skip: !facilityId },
    );

  const utilityAccounts: UtilityAccount[] = useMemo(() => {
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
  const currentUserId = useMemo(() => getCurrentUserId(user), [user]);
  const visibleReports: Report[] = useMemo(() => {
    if (!currentUserId) return [];
    return reports.filter(
      (report) => getReportCreatorId(report) === currentUserId,
    );
  }, [reports, currentUserId]);

  const [generateReport, { isLoading: isGenerating }] =
    useGenerateReportMutation();
  const [regenerateReport, { isLoading: isRegenerating }] =
    useRegenerateReportMutation();
  const [deleteReport, { isLoading: isDeleting }] = useDeleteReportMutation();

  useEffect(() => {
    if (!defaultFacilityId) return;
    setFacilityId(defaultFacilityId);
  }, [defaultFacilityId]);

  useEffect(() => {
    if (!defaultFacilityId || !facilities.length) return;
    if (facilityId !== defaultFacilityId) return;
    const match = facilities.find((f) => f._id === defaultFacilityId);
    if (match?.audit_type) {
      setAuditType(match.audit_type as AuditTypeOption);
    }
  }, [defaultFacilityId, facilities, facilityId]);

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

  useEffect(() => {
    if (!facilityId || !auditType) return;
    const stillValid = facilitiesForAuditType.some((f) => f._id === facilityId);
    if (!stillValid) {
      setFacilityId("");
      setUtilityAccountId("");
    }
  }, [facilityId, auditType, facilitiesForAuditType]);

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
      visibleReports.some(
        (report) => report.status === "processing",
      ),
    [visibleReports],
  );

  useEffect(() => {
    if (!hasActiveReports) return;

    const interval = setInterval(() => {
      refetchReports();
    }, 5000);

    return () => clearInterval(interval);
  }, [hasActiveReports, refetchReports]);

  const isSubmitDisabled =
    !canGenerateReport ||
    !auditType ||
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
            report_type: REPORT_GENERATION_TYPE,
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

  const handleDeleteReport = (reportId: string) => {
    setDeleteReportId(reportId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDeleteReport = async () => {
    if (!deleteReportId) return;
    try {
      await toastHandler({
        action: () => deleteReport(deleteReportId).unwrap(),
        loading: "Deleting report...",
        success: "Report deleted successfully",
      });

      refetchReports();
      setDeleteDialogOpen(false);
      setDeleteReportId(null);
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="min-w-0 space-y-2">
              <Label>Audit type</Label>
              <Select
                value={auditType || undefined}
                onValueChange={(value: AuditTypeOption) => {
                  setAuditType(value);
                  setFacilityId("");
                  setUtilityAccountId("");
                  setReportScope("facility");
                }}
              >
                <SelectTrigger className="h-9 w-full max-w-full min-w-0">
                  <SelectValue placeholder="Select audit type" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIT_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Facility</Label>
              <Select
                value={facilityId || undefined}
                onValueChange={(value) => {
                  setFacilityId(value);
                  setUtilityAccountId("");
                }}
                disabled={!auditType || facilitiesLoading}
              >
                <SelectTrigger className="h-9 w-full max-w-full min-w-0">
                  <SelectValue
                    placeholder={
                      !auditType
                        ? "Select audit type first"
                        : facilitiesLoading
                          ? "Loading facilities..."
                          : facilitiesForAuditType.length === 0
                            ? "No facilities for this audit type"
                            : "Select facility"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {facilitiesForAuditType.map((facility) => (
                    <SelectItem key={facility._id} value={facility._id}>
                      {facility.name}
                      {facility.city ? ` - ${facility.city}` : ""}
                      {` (${getFacilityClosureStatusLabel(facility)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report scope</Label>
              <Select
                value={reportScope}
                onValueChange={(value: ReportScope) => setReportScope(value)}
                disabled={!facilityId}
              >
                <SelectTrigger className="h-9 w-full min-w-0">
                  <SelectValue
                    placeholder={
                      !facilityId
                        ? "Select facility first"
                        : "Select report scope"
                    }
                  />
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
              <Label>Utility account</Label>
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
                      {` (${getUtilityAuditStatusLabel(account)})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-2">
              <Label>Report type</Label>
              <div
                className="flex h-9 w-full max-w-full min-w-0 items-center rounded-md border border-input bg-muted/30 px-3 text-sm text-foreground"
                title={REPORT_GENERATION_TYPE}
              >
                {!auditType
                  ? "Select audit type first"
                  : !facilityId
                    ? "Select facility first"
                    : labelForFullAuditGeneration(auditType)}
              </div>
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
          ) : visibleReports.length === 0 ? (
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
                  {visibleReports.map((report) => (
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
                        {getReportTypeRowLabel(report)}
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
                            disabled={
                              !canOpenReportFiles || !report.excel_file?.fileUrl
                            }
                            onClick={() => {
                              if (report.excel_file?.fileUrl) {
                                window.open(toSameOriginFileManagementUrl(report.excel_file.fileUrl),
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
                            disabled={
                              !canOpenReportFiles || !report.pdf_file?.fileUrl
                            }
                            onClick={() => {
                              if (report.pdf_file?.fileUrl) {
                                window.open(toSameOriginFileManagementUrl(report.pdf_file.fileUrl), "_blank");
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
                        {!canOpenReportFiles ? (
                          <p className="mt-2 text-xs text-muted-foreground">
                            You do not have permission to open report files.
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
                              !canGenerateReport ||
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
                            disabled={!canDeleteReport || isDeleting}
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
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteReportId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete report?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete this report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmDeleteReport();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
