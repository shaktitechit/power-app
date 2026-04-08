"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddUtilityAccountForm } from "@/components/connection/create-utility-form";
import { EditUtilityAccountForm } from "@/components/connection/edit-utility-form";
import { UtilityAccount } from "@/lib/dummy-types";

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
} from "lucide-react";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import {
  useDeleteUtilityAccountMutation,
  useGetUtilityAccountsQuery,
} from "@/store/slices/utilityApiSlice";
import { useAppSelector } from "@/store/hooks";

export default function FacilityWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const facilityId = params.facilityId as string;

  const [editOpen, setEditOpen] = useState(false);
  const [selectedUtilityAccount, setSelectedUtilityAccount] = useState<
    UtilityAccount | string | null
  >(null);
  const [isConnectionWizardOpen, setIsConnectionWizardOpen] = useState(false);

  const [deleteUtilityAccount] = useDeleteUtilityAccountMutation();

  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const { data: utilities } = useGetUtilityAccountsQuery({
    facility_id: facilityId,
  });

  const UtilityAccounts = utilities?.data || [];

  const { data } = useGetFacilityByIdQuery(facilityId);

  const facility = data?.data?.facility;
  const assignedAuditors = data?.data?.assignedAuditors ?? [];

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview" },
      { id: "utility_accounts", label: "Utility Accounts" },
    ],
    [],
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
    setSelectedUtilityAccount(utilityAccount);
    setEditOpen(true);
  };

  const handleDeleteUtilityAccount = async (
    e: React.MouseEvent<HTMLButtonElement>,
    utilityAccount: UtilityAccount,
  ) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      `Are you sure you want to delete "${utilityAccount.account_number}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteUtilityAccount(utilityAccount._id).unwrap();
    } catch (error) {
      console.error("Failed to delete utility account:", error);
    }
  };

  if (!facility) {
    return (
      <DashboardLayout title="Facility Not Found">
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
      key: "category",
      header: "Category",
      hideOnMobile: true,
      render: (row) => <span className="text-foreground">{row.category}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <StatusBadge status={row.is_active === true ? "active" : "fault"} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: UtilityAccount) => (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => handleEditUtilityAccount(e, row)}
          >
            <Pencil className="mr-1 h-4 w-4" />
            Edit
          </Button>
        </div>
      ),
    },
  ];

  const handleConnectionClick = (utilityAccount: UtilityAccount) => {
    router.push(
      `/facility/${facilityId}/utility-account/${utilityAccount._id}`,
    );
  };

  const handleEditComplete = async () => {
    setEditOpen(false);
    setSelectedUtilityAccount(null);
  };

  return (
    <DashboardLayout
      title={facility.name}
      subtitle={`${facility.city}, ${facility.address}`}
    >
      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/facilities"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Facilities
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
                    <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium capitalize text-foreground">
                      {facility?.facility_type || "other"}
                    </span>
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
                    <span className="text-muted-foreground">Audit Date</span>
                    <span className="text-right text-foreground">
                      {facility?.audit_date
                        ? new Date(facility.audit_date).toLocaleDateString()
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
                              .map((a) => a?.user_id?.name || a?.user_id?.email)
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
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">
                    {facility?.client_representative || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate text-foreground">
                    {facility?.client_email || "-"}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-foreground">
                    {facility?.client_contact_number || "-"}
                  </span>
                </div>

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

            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-4">
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
                <p className="mt-1 text-lg font-semibold capitalize text-foreground">
                  {facility?.facility_type || "-"}
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
              {facility?.documents?.length > 0 ? (
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
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-base font-medium text-foreground sm:text-lg">
              Utility Accounts
            </h3>
            <Button
              onClick={() => setIsConnectionWizardOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Utility Account
            </Button>
          </div>

          <DataTable
            columns={UtilityAccountColumn}
            data={UtilityAccounts}
            onRowClick={handleConnectionClick}
            emptyMessage="No connections found for this facility"
          />
        </div>
      )}

      <AddUtilityAccountForm
        open={isConnectionWizardOpen}
        onOpenChange={setIsConnectionWizardOpen}
        onComplete={() => {
          setIsConnectionWizardOpen(false);
          console.log("Connection added");
        }}
        facilityId={facilityId}
      />

      <EditUtilityAccountForm
        open={editOpen}
        onOpenChange={setEditOpen}
        onComplete={handleEditComplete}
        utilityAccount={selectedUtilityAccount}
      />
    </DashboardLayout>
  );
}
