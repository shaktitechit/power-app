"use client";

import { canManageResource, canViewDocuments } from "@/lib/authRoles";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import Link from "next/link";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AddUtilityAccountForm } from "@/components/electrical-audit/connection/create-utility-form";
import { EditUtilityAccountForm } from "@/components/electrical-audit/connection/edit-utility-form";
import { CreateSafetyAuditUtilityForm } from "@/components/safety-audit/utility-account/create-safety-audit-utility-form";
import { EditSafetyAuditUtilityForm } from "@/components/safety-audit/utility-account/edit-safety-audit-utility-form";
import { hasUtilityFinalAuditSubmission } from "@/lib/electrical-audit/utility-audit-steps";
import { cnHideUtilityAuditEdits } from "@/lib/electrical-audit/utility-audit-edits-visibility";

import {
  ArrowLeft,
  Plug,
  Plus,
  MapPin,
  Phone,
  Mail,
  User,
  Building2,
  FileText,
  Activity,
  ImageIcon,
  Pencil,
  Trash2,
  Search,
} from "lucide-react";
import {
  useCloseFacilityAuditMutation,
  useGetFacilityByIdQuery,
  useOpenFacilityAuditMutation,
} from "@/store/slices/facilityApiSlice";
import {
  type UtilityAccount,
  useDeleteUtilityAccountMutation,
  useGetUtilityAccountsQuery,
} from "@/store/slices/electrical-audit/utilityApiSlice";
import { useAppSelector } from "@/store/hooks";
import { toastHandler } from "@/lib/toast";
import {
  AUDIT_TYPE_SLUG,
  facilityUtilityPath,
  isUtilityAccountComingSoonSlug,
  isUtilityAccountWorkspaceSupportedSlug,
} from "@/lib/facilityRoutes";

function formatAuditClosureUser(
  ref:
    | string
    | { _id?: string; name?: string; email?: string }
    | null
    | undefined,
): string {
  if (ref == null || ref === "") return "-";
  if (typeof ref === "object") {
    return ref.name || ref.email || ref._id || "-";
  }
  return String(ref);
}

const UTILITY_ACCOUNTS_PAGE_SIZE = 10;

function utilityAccountSearchHaystack(account: UtilityAccount): string {
  const facilityIdPart =
    typeof account.facility_id === "string"
      ? account.facility_id
      : [
          account.facility_id?._id,
          account.facility_id?.name,
          account.facility_id?.city,
        ]
          .filter(Boolean)
          .join(" ");

  const flagBits = [
    account.is_solar_connected ? "solar" : "",
    account.is_dg_connected ? "dg diesel" : "",
    account.is_transformer_connected ? "transformer" : "",
    account.is_pump_connected ? "pump" : "",
    account.is_transformer_maintained_by_facility
      ? "transformer maintained facility"
      : "",
    account.is_active ? "active" : "inactive",
  ];

  const docBits = (account.documents ?? []).flatMap((d) =>
    [d.fileName, d.fileUrl, d.uploadedAt].filter(Boolean),
  );

  const submissionsJson = account.audit_step_submissions
    ? JSON.stringify(account.audit_step_submissions)
    : "";

  const noDataJson = account.audit_step_no_data
    ? JSON.stringify(account.audit_step_no_data)
    : "";

  const demand =
    account.sanctioned_demand_kVA != null
      ? String(account.sanctioned_demand_kVA)
      : "";

  const auditWords = hasUtilityFinalAuditSubmission(
    account.audit_step_submissions,
  )
    ? "completed done"
    : "pending";

  const parts = [
    account._id,
    account.account_number,
    account.connection_type,
    account.category,
    account.location,
    demand,
    demand ? "kva kv" : "",
    account.provider,
    account.billing_cycle,
    account.audit_date,
    account.auditor_id,
    account.created_at,
    account.updated_at,
    account.createdAt,
    account.updatedAt,
    facilityIdPart,
    ...flagBits,
    ...docBits,
    submissionsJson,
    noDataJson,
    auditWords,
  ];

  return parts.filter(Boolean).join(" ").toLowerCase();
}

export default function FacilityWorkspacePage() {
  type EditUtilityAccountValue = ComponentProps<
    typeof EditUtilityAccountForm
  >["utilityAccount"];
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const facilityId = params.facilityId as string;
  const auditTypeSlug = (params.auditType as string) || "";
  const isElectricalEnergyAuditRoute =
    auditTypeSlug === AUDIT_TYPE_SLUG.ELECTRICAL_ENERGY;
  const isElectricalSafetyAuditRoute =
    auditTypeSlug === AUDIT_TYPE_SLUG.ELECTRICAL_SAFETY;
  const isUtilityAccountWorkspaceRoute =
    isUtilityAccountWorkspaceSupportedSlug(auditTypeSlug);
  const isUtilityAccountComingSoonRoute =
    isUtilityAccountComingSoonSlug(auditTypeSlug);

  const [editOpen, setEditOpen] = useState(false);
  const [selectedUtilityAccount, setSelectedUtilityAccount] =
    useState<EditUtilityAccountValue>(null);
  const [isConnectionWizardOpen, setIsConnectionWizardOpen] = useState(false);
  const [closeAuditDialogOpen, setCloseAuditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetUtility, setDeleteTargetUtility] =
    useState<UtilityAccount | null>(null);
  const [utilitySearchQuery, setUtilitySearchQuery] = useState("");
  const [utilityPage, setUtilityPage] = useState(1);

  const [deleteUtilityAccount] = useDeleteUtilityAccountMutation();
  const [closeFacilityAudit, { isLoading: closingFacilityAudit }] =
    useCloseFacilityAuditMutation();
  const [openFacilityAudit, { isLoading: openingFacilityAudit }] =
    useOpenFacilityAuditMutation();

  const user = useAppSelector((state) => state.auth.user);
  const canViewDocs = canViewDocuments(user?.role, user?.permissions || []);
  const canCloseFacilityAuditAction = canManageResource(
    user?.role,
    user?.permissions || [],
    "facility",
    "close_facility_audit",
  );
  const canReopenFacilityAudit = canManageResource(
    user?.role,
    user?.permissions || [],
    "facility",
    "reopen_facility_audit",
  );
  const canCreateUtilityAccount = canManageResource(
    user?.role,
    user?.permissions || [],
    "utility_account",
    "create",
  );
  const canUpdateUtilityAccount = canManageResource(
    user?.role,
    user?.permissions || [],
    "utility_account",
    "update",
  );
  const canDeleteUtilityAccount =
    user?.role === "super_admin" || user?.role === "admin";

  const { data: utilities, isLoading: utilitiesLoading } =
    useGetUtilityAccountsQuery({
      facility_id: facilityId,
    });

  const UtilityAccounts = utilities?.data || [];

  const filteredUtilityAccounts = useMemo(() => {
    const q = utilitySearchQuery.trim().toLowerCase();
    if (!q) return UtilityAccounts;
    return UtilityAccounts.filter((u) =>
      utilityAccountSearchHaystack(u).includes(q),
    );
  }, [UtilityAccounts, utilitySearchQuery]);

  const utilityTotalFiltered = filteredUtilityAccounts.length;
  const utilityTotalPages =
    utilityTotalFiltered === 0
      ? 1
      : Math.ceil(utilityTotalFiltered / UTILITY_ACCOUNTS_PAGE_SIZE);

  const paginatedUtilityAccounts = useMemo(() => {
    const start = (utilityPage - 1) * UTILITY_ACCOUNTS_PAGE_SIZE;
    return filteredUtilityAccounts.slice(start, start + UTILITY_ACCOUNTS_PAGE_SIZE);
  }, [filteredUtilityAccounts, utilityPage]);

  useEffect(() => {
    setUtilityPage(1);
  }, [utilitySearchQuery]);

  useEffect(() => {
    setUtilityPage((p) => Math.min(p, utilityTotalPages));
  }, [utilityTotalPages]);

  useEffect(() => {
    setUtilitySearchQuery("");
    setUtilityPage(1);
  }, [facilityId]);

  const utilityAuditCompletedCount = UtilityAccounts.filter((utility) =>
    hasUtilityFinalAuditSubmission(utility.audit_step_submissions),
  ).length;
  const utilityAuditPendingCount = Math.max(
    UtilityAccounts.length - utilityAuditCompletedCount,
    0,
  );
  const canCloseFacilityAudit =
    UtilityAccounts.length > 0 &&
    utilityAuditCompletedCount === UtilityAccounts.length;

  const { data } = useGetFacilityByIdQuery(facilityId);

  const facility = data?.data?.facility;
  const facilityAuditClosed = Boolean(facility?.audit_closure?.closed_at);
  const assignedAuditors = data?.data?.assignedAuditors ?? [];
  const clientRepresentatives =
    facility?.client_representatives && facility.client_representatives.length > 0
      ? facility.client_representatives
      : [
          {
            name: facility?.client_representative || "",
            contact_number: facility?.client_contact_number || "",
            email: facility?.client_email || "",
          },
        ].filter((rep) => rep.name || rep.contact_number || rep.email);

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      {
        id: "utility_accounts",
        label: "Utility Accounts",
        count: UtilityAccounts?.length || 0,
      },
      { id: "preview_closure", label: "Preview and Closure" },
    ],
    [UtilityAccounts?.length],
  );

  const validTabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const getValidTab = (tab: string | null) => {
    if (tab && validTabIds.includes(tab)) return tab;
    return "overview";
  };

  const [activeTab, setActiveTab] = useState<string>(() =>
    getValidTab(searchParams.get("tab")),
  );

  useEffect(() => {
    const urlTab = getValidTab(searchParams.get("tab"));

    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab, validTabIds]);

  const handleTabChange = (tabId: string) => {
    const validTab = getValidTab(tabId);

    setActiveTab(validTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", validTab);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleEditUtilityAccount = (
    e: React.MouseEvent<HTMLButtonElement>,
    utilityAccount: UtilityAccount,
  ) => {
    e.stopPropagation();
    if (!canUpdateUtilityAccount) return;
    setSelectedUtilityAccount({
      ...utilityAccount,
      facility_id:
        typeof utilityAccount.facility_id === "string"
          ? utilityAccount.facility_id
          : utilityAccount.facility_id?._id,
    });
    setEditOpen(true);
  };

  const handleDeleteUtilityAccount = async (
    e: React.MouseEvent<HTMLButtonElement>,
    utilityAccount: UtilityAccount,
  ) => {
    e.stopPropagation();
    if (!canDeleteUtilityAccount) return;
    setDeleteTargetUtility(utilityAccount);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteUtilityAccount = async () => {
    if (!deleteTargetUtility?._id) return;
    try {
      await deleteUtilityAccount(deleteTargetUtility._id).unwrap();
      setDeleteDialogOpen(false);
      setDeleteTargetUtility(null);
    } catch (error) {
      console.error("Failed to delete utility account:", error);
    }
  };

  if (!facility) {
    return (
      <DashboardLayout title="Loading Facility...">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            The requested facility was not found.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/facilities")}
          >
            Back to Facilities
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isUtilityAuditComplete = (ua: UtilityAccount) =>
    hasUtilityFinalAuditSubmission(ua.audit_step_submissions);
  const showUtilityActionsColumn =
    isUtilityAccountWorkspaceRoute &&
    !facilityAuditClosed &&
    UtilityAccounts.some((ua) => !isUtilityAuditComplete(ua)) &&
    (canUpdateUtilityAccount || canDeleteUtilityAccount);

  const UtilityAccountColumn: Column<UtilityAccount>[] = [
    {
      key: "name",
      header: "Utility Accounts",
      render: (row) => (
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 sm:h-9 sm:w-9">
            <Plug className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {row.account_number}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {row.connection_type} Connection
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "sanctioned_demand_kVA",
      header: "Sanctioned Demand",
      hideOnMobile: true,
      render: (row) => (
        <span className="text-foreground">{row.sanctioned_demand_kVA} kVA</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideOnMobile: true,
      render: (row) => <span className="text-foreground">{row.location || "-"}</span>,
    },
    
    {
      key: "audit_status",
      header: "Audit Status",
      render: (row) => {
        const isAuditCompleted = isUtilityAuditComplete(row);
        return (
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
              isAuditCompleted
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
            }`}
          >
            {isAuditCompleted ? "Completed" : "Pending"}
          </span>
        );
      },
    },
    ...(showUtilityActionsColumn
      ? [
          {
            key: "actions",
            header: "Actions",
            render: (row: UtilityAccount) => {
              const auditComplete = isUtilityAuditComplete(row);
              const editDisabled = auditComplete || facilityAuditClosed;
              if (editDisabled) return null;
              return (
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {canUpdateUtilityAccount ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => handleEditUtilityAccount(e, row)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </Button>
                  ) : null}
                  {canDeleteUtilityAccount ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDeleteUtilityAccount(e, row)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </Button>
                  ) : null}
                </div>
              );
            },
          } satisfies Column<UtilityAccount>,
        ]
      : []),
  ];

  const handleConnectionClick = (utilityAccount: UtilityAccount) => {
    router.push(
      facilityUtilityPath(facility?.audit_type, facilityId, utilityAccount._id),
    );
  };

  const handleEditComplete = async () => {
    setEditOpen(false);
    setSelectedUtilityAccount(null);
  };

  const handleCloseFacilityAudit = async () => {
    if (!facilityId || !canCloseFacilityAuditAction || !canCloseFacilityAudit)
      return;
    setCloseAuditDialogOpen(false);
    await toastHandler({
      action: () => closeFacilityAudit(facilityId).unwrap(),
      loading: "Closing facility audit...",
      success: "Facility audit closed successfully",
    });
  };

  const handleOpenFacilityAudit = async () => {
    if (!facilityId) return;
    await toastHandler({
      action: () => openFacilityAudit(facilityId).unwrap(),
      loading: "Opening facility audit...",
      success: "Facility audit opened successfully",
    });
  };

  const UtilityAccountsTable = DataTable as any;

  return (
    <DashboardLayout
      title={facility.name}
      subtitle={`${facility.city}`}
    >
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/facilities"
          className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Back to Facilities</span>
        </Link>
        <StatusBadge status={facility.status} />
      </div>

      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-4 sm:mb-6"
      />

      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Building2 className="h-5 w-5 text-primary" />
                  Facility Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">
                    {facility?.name || "-"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                      {facility?.facility_type?.trim() || "—"}
                    </span>
                    {facility?.audit_type ? (
                      <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                        {facility.audit_type}
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        facility?.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                          : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                      }`}
                    >
                      {facility?.status || "-"}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      {facility?.address || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {facility?.city || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit Type</span>
                    <span className="max-w-[60%] text-right text-foreground">
                      {facility?.audit_type || "—"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit Date</span>
                    <span className="text-right text-foreground">
                      {facility?.audit_date
                        ? new Date(facility.audit_date).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Start Date</span>
                    <span className="text-right text-foreground">
                      {facility?.start_date
                        ? new Date(facility.start_date).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Closure Date</span>
                    <span className="text-right text-foreground">
                      {facility?.closure_date
                        ? new Date(facility.closure_date).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Team</span>
                    <span className="text-right text-foreground">
                      {facility?.auditor_id?.name ||
                        facility?.auditor_id?.email ||
                        (assignedAuditors?.length
                          ? assignedAuditors
                              .map((a) => {
                                const userInfo = a?.user_id;
                                if (!userInfo || typeof userInfo === "string") return "";
                                return userInfo.name || userInfo.email || "";
                              })
                              .filter(Boolean)
                              .join(", ")
                          : "-")}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-right text-foreground">
                      {facility?.created_at
                        ? new Date(facility.created_at).toLocaleString()
                        : facility?.createdAt
                          ? new Date(facility.createdAt).toLocaleString()
                          : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="text-right text-foreground">
                      {facility?.updated_at
                        ? new Date(facility.updated_at).toLocaleString()
                        : facility?.updatedAt
                          ? new Date(facility.updatedAt).toLocaleString()
                          : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Closure Status</span>
                    <span
                      className={`text-right font-medium ${
                        facilityAuditClosed
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {facilityAuditClosed ? "Closed" : "Open"}
                    </span>
                  </div>

                  {facilityAuditClosed ? (
                    <>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">
                          Audit closure date
                        </span>
                        <span className="text-right text-foreground">
                          {facility?.audit_closure?.closed_at
                            ? new Date(
                                facility.audit_closure.closed_at,
                              ).toLocaleString()
                            : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-muted-foreground">Closed by</span>
                        <span className="text-right text-foreground">
                          {formatAuditClosureUser(
                            facility?.audit_closure?.closed_by,
                          )}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <User className="h-5 w-5 text-primary" />
                  Contact Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                {clientRepresentatives.length > 0 ? (
                  <div className="space-y-3">
                    {clientRepresentatives.map((rep, index) => (
                      <div
                        key={`client-rep-${index}`}
                        className="rounded-lg border border-border bg-muted/20 p-3"
                      >
                        <div className="mb-2 text-xs font-medium text-muted-foreground">
                          Representative {index + 1}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-foreground">
                              {rep?.name || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="truncate text-foreground">
                              {rep?.email || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="text-foreground">
                              {rep?.contact_number || "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No client representative details.
                  </p>
                )}

                <div className="grid gap-3 border-t border-border pt-4 text-sm">
                  
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <Activity className="h-5 w-5 text-primary" />
                Quick Summary
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3 xl:grid-cols-5">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Utility Connections
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {UtilityAccounts?.length || 0}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Facility Status</p>
                <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                  {facility?.status || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Facility Type</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {facility?.facility_type?.trim() || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Audit Type</p>
                <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
                  {facility?.audit_type || "—"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Total Documents</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {facility?.documents?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <ImageIcon className="h-5 w-5 text-primary" />
                Images & Documents
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
              {!canViewDocs ? (
                <p className="text-sm text-muted-foreground">
                  Only super admin, admin, and manager can view uploaded documents.
                </p>
              ) : facility?.documents?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {facility.documents.map((doc: any, index: number) => (
                    <div
                      key={index}
                      className="group overflow-hidden rounded-xl border border-border bg-muted/20"
                    >
                      {doc.fileType === "image" ? (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                          <img
                            src={doc.fileUrl}
                            alt={doc.fileName || `Image ${index + 1}`}
                            className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                          />
                        </a>
                      ) : (
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-32 flex-col items-center justify-center gap-2"
                        >
                          <FileText className="h-8 w-8 text-destructive" />
                          <p className="text-xs text-muted-foreground">
                            PDF Document
                          </p>
                        </a>
                      )}

                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs font-medium text-foreground">
                          {doc.fileName || `File ${index + 1}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "-"}
                        </p>

                        {doc.fileType === "pdf" && (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block text-xs text-primary hover:underline"
                          >
                            Open PDF
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "utility_accounts" && (
        <div className="space-y-4">
          {isUtilityAccountComingSoonRoute ? (
            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-card-foreground">
                  Utility Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm text-muted-foreground">
                  Right now, only <span className="font-medium text-foreground">Electrical Energy Audit</span> and{" "}
                  <span className="font-medium text-foreground">Electrical Safety Audit</span> support utility
                  account workflows here. <span className="font-medium text-foreground">Thermal Audit</span> and{" "}
                  <span className="font-medium text-foreground">Lightning Arrester Audit</span> are coming soon.
                </p>
              </CardContent>
            </Card>
          ) : isUtilityAccountWorkspaceRoute ? (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <h3 className="text-base font-medium text-foreground sm:text-lg">
                    Utility Accounts
                  </h3>
                  <div className="relative max-w-xl">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search account, location, type, provider, flags..."
                      value={utilitySearchQuery}
                      onChange={(e) => setUtilitySearchQuery(e.target.value)}
                      className="bg-input pl-9"
                    />
                  </div>
                </div>
                {canCreateUtilityAccount ? (
                  <Button
                    onClick={() => setIsConnectionWizardOpen(true)}
                    className={cnHideUtilityAuditEdits(
                      facilityAuditClosed,
                      "w-full shrink-0 sm:w-auto",
                    )}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Utility Account
                  </Button>
                ) : null}
              </div>

              <UtilityAccountsTable
                columns={UtilityAccountColumn}
                data={paginatedUtilityAccounts}
                loading={utilitiesLoading}
                onRowClick={(row?: UtilityAccount) =>
                  row ? handleConnectionClick(row) : undefined
                }
                emptyMessage={
                  utilitySearchQuery.trim()
                    ? "No utility accounts match your search"
                    : "No connections found for this facility"
                }
              />

              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {utilitiesLoading ? (
                    "Loading utility accounts…"
                  ) : utilityTotalFiltered === 0 ? (
                    <>
                      {UtilityAccounts.length === 0
                        ? "No utility accounts yet."
                        : "No utility accounts match your search."}
                    </>
                  ) : (
                    <>
                      Showing {(utilityPage - 1) * UTILITY_ACCOUNTS_PAGE_SIZE + 1}–
                      {Math.min(
                        utilityPage * UTILITY_ACCOUNTS_PAGE_SIZE,
                        utilityTotalFiltered,
                      )}{" "}
                      of {utilityTotalFiltered} accounts
                    </>
                  )}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      utilityPage <= 1 || utilitiesLoading || UtilityAccounts.length === 0
                    }
                    onClick={() =>
                      setUtilityPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span className="tabular-nums text-xs text-muted-foreground sm:text-sm">
                    Page {utilityPage} of {utilityTotalPages}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      utilityPage >= utilityTotalPages ||
                      utilitiesLoading ||
                      utilityTotalFiltered === 0
                    }
                    onClick={() =>
                      setUtilityPage((p) =>
                        Math.min(utilityTotalPages, p + 1),
                      )
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-card-foreground">
                  Utility Accounts
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                <p className="text-sm text-muted-foreground">
                  Utility account management is not available for this URL. Use an Electrical Energy or
                  Electrical Safety audit facility link, or check back when additional audit types are
                  supported.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "preview_closure" && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground">
                Audit Preview and Closure
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-3 sm:p-6 sm:pt-0">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Total Utility Accounts</p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {UtilityAccounts.length}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Utility Audits Completed
                </p>
                <p className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-400">
                  {utilityAuditCompletedCount}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Utility Audits Pending
                </p>
                <p className="mt-1 text-lg font-semibold text-amber-700 dark:text-amber-400">
                  {utilityAuditPendingCount}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border bg-card">
            <CardContent className="flex min-w-0 flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="min-w-0 text-sm text-muted-foreground">
                {facilityAuditClosed ? (
                  "Facility audit is currently closed."
                ) : UtilityAccounts.length === 0 ? (
                  "Add at least one utility account, then complete every utility audit before you can close the facility audit."
                ) : !canCloseFacilityAudit ? (
                  <>
                    {utilityAuditPendingCount} utility audit
                    {utilityAuditPendingCount === 1 ? "" : "s"} still pending.
                    Complete all utility account audits to enable facility audit
                    closure.
                  </>
                ) : (
                  "All utility audits are completed. You can close the facility audit now."
                )}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                {!facilityAuditClosed ? (
                  <Button
                    onClick={() => setCloseAuditDialogOpen(true)}
                    disabled={
                      !canCloseFacilityAuditAction ||
                      !canCloseFacilityAudit ||
                      closingFacilityAudit ||
                      openingFacilityAudit
                    }
                  >
                    {closingFacilityAudit ? "Closing..." : "Audit Close"}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleOpenFacilityAudit}
                      disabled={
                        !canReopenFacilityAudit ||
                        openingFacilityAudit ||
                        closingFacilityAudit
                      }
                    >
                      {openingFacilityAudit ? "Opening..." : "Open Audit"}
                    </Button>
                    {!canReopenFacilityAudit ? (
                      <span className="text-xs text-muted-foreground">
                        You do not have permission to open facility audit.
                      </span>
                    ) : null}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <AlertDialog
            open={closeAuditDialogOpen}
            onOpenChange={setCloseAuditDialogOpen}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Close facility audit?</AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    You are about to close the audit for{" "}
                    <span className="font-medium text-foreground">
                      {facility.name}
                    </span>
                    . Utility account data will be locked for editing until an
                    administrator re-opens the facility audit.
                  </span>
                  <span className="block text-amber-800 dark:text-amber-200">
                    Only continue if every utility account audit is finished and
                    you are ready to finalize this facility.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={closingFacilityAudit}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={closingFacilityAudit}
                  onClick={() => void handleCloseFacilityAudit()}
                >
                  {closingFacilityAudit ? "Closing..." : "Yes, close audit"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {canCreateUtilityAccount && isElectricalEnergyAuditRoute ? (
        <AddUtilityAccountForm
          open={isConnectionWizardOpen}
          onOpenChange={setIsConnectionWizardOpen}
          onComplete={() => {
            setIsConnectionWizardOpen(false);
            console.log("Connection added");
          }}
          facilityId={facilityId}
        />
      ) : null}

      {canCreateUtilityAccount && isElectricalSafetyAuditRoute ? (
        <CreateSafetyAuditUtilityForm
          open={isConnectionWizardOpen}
          onOpenChange={setIsConnectionWizardOpen}
          onComplete={() => {
            setIsConnectionWizardOpen(false);
            console.log("Connection added");
          }}
          facilityId={facilityId}
        />
      ) : null}

      {canUpdateUtilityAccount && isElectricalEnergyAuditRoute ? (
        <EditUtilityAccountForm
          open={editOpen}
          onOpenChange={setEditOpen}
          onComplete={handleEditComplete}
          utilityAccount={selectedUtilityAccount}
        />
      ) : null}

      {canUpdateUtilityAccount && isElectricalSafetyAuditRoute ? (
        <EditSafetyAuditUtilityForm
          open={editOpen}
          onOpenChange={setEditOpen}
          onComplete={handleEditComplete}
          utilityAccount={selectedUtilityAccount}
        />
      ) : null}

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDeleteTargetUtility(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete utility account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTargetUtility?.account_number || "this account"}</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmDeleteUtilityAccount()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
