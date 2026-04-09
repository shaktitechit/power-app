"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Plug,
  Zap,
  Activity,
  ClipboardList,
  FileText,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { useGetUtilityAccountByIdQuery } from "@/store/slices/utilityApiSlice";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import { UtilityTariffSection } from "@/components/utility-tariff/utility-tariff-section";
import { UtilityBillingRecordSection } from "@/components/utility-billing-record/utility-billing-record-section";
import { SolarPlantSection } from "@/components/solar-plants/solar-plant-section";
import { DGSetSection } from "@/components/connection/dg-sets/dg-set-section";
import { TransformerSection } from "@/components/transformers/transformer-section";
import { PumpSection } from "@/components/pumps/pump-section";
import { HVACAuditSection } from "@/components/hvac/hvac-audit-section";
import { LightingAuditSection } from "@/components/lighting/lighting-audit-section";
import { LuxMeasurementSection } from "@/components/lux/lux-measurement-section";
import { MiscLoadAuditSection } from "@/components/misc/misc-load-audit-section";
import { ACAuditRecordSection } from "@/components/ac/ac-audit-record-section";
import { FanAuditRecordSection } from "@/components/fan/fan-audit-record";
import { useAppSelector } from "@/store/hooks";

type TabItem = {
  id: string;
  label: string;
};

type UtilityDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

export default function ConnectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const facilityId = params.facilityId as string;
  const utilityAccountId = params.utility_account_id as string;
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const { data: utility, isLoading: utilityAccountLoading } =
    useGetUtilityAccountByIdQuery(utilityAccountId);

  const utilityAccount = utility?.data;

  const { data: facilityById, isLoading: facilityLoading } =
    useGetFacilityByIdQuery(facilityId);

  const facility = facilityById?.data?.facility;

  const tabs = useMemo<TabItem[]>(
    () =>
      [
        { id: "details", label: "Utility Account Details" },
        { id: "tarrif", label: "Utility Tarrif" },
        { id: "utility-billing-records", label: "Utility Billing Records" },

        utilityAccount?.is_solar_connected
          ? { id: "solar-plants", label: "Solar Audit" }
          : null,

        utilityAccount?.is_dg_connected
          ? { id: "dg-sets", label: "DG Audit" }
          : null,

        utilityAccount?.is_transformer_connected
          ? { id: "transformer", label: "Transformer Audit" }
          : null,

        utilityAccount?.is_pump_connected
          ? { id: "pump", label: "Pump Audit" }
          : null,

        { id: "hvac", label: "HVAC Audit" },
        { id: "ac", label: "AC Audit" },
        { id: "lighting", label: "Lighting Audit" },
        { id: "fan", label: "Fan Audit" },
        { id: "lux", label: "LUX Measurement" },
        { id: "misc", label: "Misc Audit" },
      ].filter(Boolean) as TabItem[],
    [utilityAccount],
  );

  const validTabIds = useMemo(() => tabs.map((tab) => tab.id), [tabs]);

  const getValidTab = (tab: string | null) => {
    if (tab && validTabIds.includes(tab)) return tab;
    return "details";
  };

  const [activeTab, setActiveTab] = useState<string>("details");

  useEffect(() => {
    if (!validTabIds.length) return;

    const urlTab = getValidTab(searchParams.get("tab"));
    setActiveTab((prev) => (prev === urlTab ? prev : urlTab));
  }, [searchParams, validTabIds]);

  const handleTabChange = (tabId: string) => {
    const validTab = getValidTab(tabId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", validTab);

    setActiveTab(validTab);

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };

  if (utilityAccountLoading || facilityLoading) {
    return (
      <DashboardLayout title="Loading Connection...">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!facility || !utilityAccount) {
    return (
      <DashboardLayout title="Connection Not Found">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">
            The requested connection was not found.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push(`/facility/${facilityId}`)}
          >
            Back to Facility
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={utilityAccount.account_number}
      subtitle={`${facility.name} - ${utilityAccount.connection_type} Utility Account`}
    >
      <div className="mb-6">
        <Link
          href={`/facility/${facilityId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {facility.name}
        </Link>
      </div>

      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-4 sm:mb-6"
      />

      {activeTab === "details" && (
        <div className="space-y-4 sm:space-y-6">
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Plug className="h-5 w-5 text-primary" />
                  Utility Account Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {utilityAccount.account_number || "-"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {utilityAccount.connection_type || "-"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Category</span>
                    <span className="text-right text-foreground">
                      {utilityAccount.category || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-right text-foreground">
                      {utilityAccount.location || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Sanctioned Demand
                    </span>
                    <span className="text-right text-foreground">
                      {utilityAccount.sanctioned_demand_kVA != null
                        ? `${utilityAccount.sanctioned_demand_kVA} kVA`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="text-right text-foreground">
                      {utilityAccount.provider || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Billing Cycle</span>
                    <span className="text-right text-foreground">
                      {utilityAccount.billing_cycle || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Status</span>
                    <span
                      className={`text-right font-medium ${
                        utilityAccount.is_active
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-destructive"
                      }`}
                    >
                      {utilityAccount.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit Date</span>
                    <span className="text-right text-foreground">
                      {utilityAccount.audit_date
                        ? new Date(
                            utilityAccount.audit_date,
                          ).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Transformer Maintained by Facility
                    </span>
                    <span className="text-right text-foreground">
                      {utilityAccount.is_transformer_maintained_by_facility
                        ? "Yes"
                        : "No"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-card-foreground">
                  <Activity className="h-5 w-5 text-primary" />
                  Connection Summary
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      utilityAccount.is_solar_connected
                        ? "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Solar{" "}
                    {utilityAccount.is_solar_connected
                      ? "Connected"
                      : "Not Connected"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      utilityAccount.is_dg_connected
                        ? "bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    DG{" "}
                    {utilityAccount.is_dg_connected
                      ? "Connected"
                      : "Not Connected"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      utilityAccount.is_transformer_connected
                        ? "bg-purple-100 text-purple-900 dark:bg-purple-500/20 dark:text-purple-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Transformer{" "}
                    {utilityAccount.is_transformer_connected
                      ? "Connected"
                      : "Not Connected"}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      utilityAccount.is_pump_connected
                        ? "bg-cyan-100 text-cyan-900 dark:bg-cyan-500/20 dark:text-cyan-200"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    Pump{" "}
                    {utilityAccount.is_pump_connected
                      ? "Connected"
                      : "Not Connected"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      Connection Type
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {utilityAccount.connection_type || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {utilityAccount.provider || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">
                      Billing Cycle
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {utilityAccount.billing_cycle || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Status</p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {utilityAccount.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-card-foreground">
                <ClipboardList className="h-5 w-5 text-primary" />
                Audit & Record Details
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Audit Date</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {utilityAccount.audit_date
                    ? new Date(utilityAccount.audit_date).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Created At</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {utilityAccount.created_at
                    ? new Date(utilityAccount.created_at).toLocaleDateString()
                    : "-"}
                </p>
              </div>

              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Updated At</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {utilityAccount.updated_at
                    ? new Date(utilityAccount.updated_at).toLocaleDateString()
                    : "-"}
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
              {!isAdmin ? (
                <p className="text-sm text-muted-foreground">
                  Documents are visible to admin users only.
                </p>
              ) : utilityAccount.documents?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {utilityAccount.documents.map(
                    (doc: UtilityDocument, index: number) => (
                      <div
                        key={index}
                        className="group overflow-hidden rounded-xl border border-border bg-muted/20"
                      >
                        {doc.fileType === "image" ? (
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
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
                            <p className="text-xs text-muted-foreground">PDF</p>
                          </a>
                        )}

                        <div className="space-y-1 p-2">
                          <p className="truncate text-xs font-medium text-foreground">
                            {doc.fileName || `File ${index + 1}`}
                          </p>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-muted-foreground">
                              {doc.uploadedAt
                                ? new Date(doc.uploadedAt).toLocaleDateString()
                                : "-"}
                            </p>

                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              download={doc.fileType === "pdf"}
                              className="text-xs text-primary hover:underline"
                            >
                              Open
                            </a>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
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

      {activeTab === "tarrif" && (
        <UtilityTariffSection utilityAccountId={utilityAccountId} />
      )}

      {activeTab === "utility-billing-records" && (
        <div className="space-y-4">
          <UtilityBillingRecordSection
            utilityAccountId={utilityAccountId}
            billingCycle={
              utilityAccount?.billing_cycle === "monthly" ||
              utilityAccount?.billing_cycle === "bi-monthly" ||
              utilityAccount?.billing_cycle === "quarterly"
                ? utilityAccount.billing_cycle
                : "monthly"
            }
          />
        </div>
      )}

      {utilityAccount.is_solar_connected && activeTab === "solar-plants" && (
        <div className="space-y-4">
          <SolarPlantSection
            utilityAccountId={utilityAccountId}
            facilityId={facility._id}
          />
        </div>
      )}

      {utilityAccount.is_dg_connected && activeTab === "dg-sets" && (
        <div className="space-y-4">
          <DGSetSection
            utilityAccountId={utilityAccountId}
            facilityId={facility._id}
          />
        </div>
      )}

      {utilityAccount.is_transformer_connected &&
        activeTab === "transformer" && (
          <div className="space-y-4">
            <TransformerSection
              utilityAccountId={utilityAccountId}
              facilityId={facility._id}
            />
          </div>
        )}

      {utilityAccount.is_pump_connected && activeTab === "pump" && (
        <div className="space-y-4">
          <PumpSection
            utilityAccountId={utilityAccountId}
            facilityId={facility._id}
          />
        </div>
      )}

      {activeTab === "hvac" && (
        <div className="space-y-4">
          <HVACAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}

      {activeTab === "ac" && (
        <div className="space-y-4">
          <ACAuditRecordSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}

      {activeTab === "lighting" && (
        <div className="space-y-4">
          <LightingAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}

      {activeTab === "fan" && (
        <div className="space-y-4">
          <FanAuditRecordSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}

      {activeTab === "lux" && (
        <div className="space-y-4">
          <LuxMeasurementSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}

      {activeTab === "misc" && (
        <div className="space-y-4">
          <MiscLoadAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
          />
        </div>
      )}
    </DashboardLayout>
  );
}
