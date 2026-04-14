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
import { useGetUtilityTariffsQuery } from "@/store/slices/utilityTariffApiSlice";
import { useGetUtilityBillingRecordsQuery } from "@/store/slices/utilityBillingRecordApiSlice";
import { useGetSolarGenerationRecordsQuery } from "@/store/slices/solarGenerationRecordApiSlice";
import { useGetDGAuditRecordsQuery } from "@/store/slices/dgAuditRecordApiSlice";
import { useGetTransformerAuditRecordsQuery } from "@/store/slices/transformerAuditRecordApiSlice";
import { useGetPumpAuditRecordsQuery } from "@/store/slices/pumpAuditRecordApiSlice";
import { useGetHVACAuditsQuery } from "@/store/slices/hvacAuditApiSlice";
import { useGetACAuditRecordsQuery } from "@/store/slices/acAuditRecordApiSlice";
import { useGetLightingAuditsQuery } from "@/store/slices/lightingAuditApiSlice";
import { useGetFanAuditRecordsQuery } from "@/store/slices/fanAuditRecordApiSlice";
import { useGetLuxMeasurementsQuery } from "@/store/slices/luxMeasurementApiSlice";
import { useGetMiscLoadAuditsQuery } from "@/store/slices/miscLoadAuditApiSlice";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/utility-audit-steps";
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
import { AuditStepSubmitBar } from "@/components/utility-audit/audit-step-submit-bar";

type TabItem = {
  id: string;
  label: string;
  count?: number;
  completed?: boolean;
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

  const skipBase = !utilityAccountId || !facilityId;

  const { data: tariffData } = useGetUtilityTariffsQuery(
    { utility_account_id: utilityAccountId },
    { skip: !utilityAccountId },
  );
  const { data: billingData } = useGetUtilityBillingRecordsQuery(
    { utility_account_id: utilityAccountId },
    { skip: !utilityAccountId },
  );
  const { data: solarGenData } = useGetSolarGenerationRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: facilityId },
    { skip: skipBase || !utilityAccount?.is_solar_connected },
  );
  const { data: dgAuditData } = useGetDGAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: facilityId },
    { skip: skipBase || !utilityAccount?.is_dg_connected },
  );
  const { data: transformerAuditData } = useGetTransformerAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: facilityId },
    { skip: skipBase || !utilityAccount?.is_transformer_connected },
  );
  const { data: pumpAuditData } = useGetPumpAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: facilityId },
    { skip: skipBase || !utilityAccount?.is_pump_connected },
  );
  const { data: hvacData } = useGetHVACAuditsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: acData } = useGetACAuditRecordsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: lightingData } = useGetLightingAuditsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: fanData } = useGetFanAuditRecordsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: luxData } = useGetLuxMeasurementsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: miscData } = useGetMiscLoadAuditsQuery(
    { facility_id: facilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );

  const tariffCount = tariffData?.data?.length ?? 0;
  const billingCount = billingData?.data?.length ?? 0;
  const solarRecordCount = solarGenData?.data?.length ?? 0;
  const dgAuditCount = dgAuditData?.data?.length ?? 0;
  const transformerAuditCount = transformerAuditData?.data?.length ?? 0;
  const pumpAuditCount = pumpAuditData?.data?.length ?? 0;
  const hvacCount = hvacData?.data?.length ?? 0;
  const acCount = acData?.data?.length ?? 0;
  const lightingCount = lightingData?.data?.length ?? 0;
  const fanCount = fanData?.data?.length ?? 0;
  const luxCount = luxData?.data?.length ?? 0;
  const miscCount = miscData?.data?.length ?? 0;

  const tabs = useMemo<TabItem[]>(() => {
    const subs = utilityAccount?.audit_step_submissions;
    const done = (step: string) => Boolean(subs?.[step]?.submitted_at);

    return [
      { id: "details", label: "Utility Account Details" },
      {
        id: UTILITY_AUDIT_STEP_IDS.TARIFF,
        label: "Utility Tarrif",
        count: tariffCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.TARIFF),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.BILLING,
        label: "Utility Billing Records",
        count: billingCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.BILLING),
      },

      utilityAccount?.is_solar_connected
        ? {
            id: UTILITY_AUDIT_STEP_IDS.SOLAR,
            label: "Solar Audit",
            count: solarRecordCount,
            completed: done(UTILITY_AUDIT_STEP_IDS.SOLAR),
          }
        : null,

      utilityAccount?.is_dg_connected
        ? {
            id: UTILITY_AUDIT_STEP_IDS.DG,
            label: "DG Audit",
            count: dgAuditCount,
            completed: done(UTILITY_AUDIT_STEP_IDS.DG),
          }
        : null,

      utilityAccount?.is_transformer_connected
        ? {
            id: UTILITY_AUDIT_STEP_IDS.TRANSFORMER,
            label: "Transformer Audit",
            count: transformerAuditCount,
            completed: done(UTILITY_AUDIT_STEP_IDS.TRANSFORMER),
          }
        : null,

      utilityAccount?.is_pump_connected
        ? {
            id: UTILITY_AUDIT_STEP_IDS.PUMP,
            label: "Pump Audit",
            count: pumpAuditCount,
            completed: done(UTILITY_AUDIT_STEP_IDS.PUMP),
          }
        : null,

      {
        id: UTILITY_AUDIT_STEP_IDS.HVAC,
        label: "HVAC Audit",
        count: hvacCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.HVAC),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.AC,
        label: "AC Audit",
        count: acCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.AC),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.LIGHTING,
        label: "Lighting Audit",
        count: lightingCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.LIGHTING),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.FAN,
        label: "Fan Audit",
        count: fanCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.FAN),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.LUX,
        label: "LUX Measurement",
        count: luxCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.LUX),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.MISC,
        label: "Misc Audit",
        count: miscCount,
        completed: done(UTILITY_AUDIT_STEP_IDS.MISC),
      },
      {
        id: UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT,
        label: "Preview and Submit",
        completed: done(UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT),
      },
    ].filter(Boolean) as TabItem[];
  }, [
    utilityAccount?.audit_step_submissions,
    utilityAccount?.is_solar_connected,
    utilityAccount?.is_dg_connected,
    utilityAccount?.is_transformer_connected,
    utilityAccount?.is_pump_connected,
    tariffCount,
    billingCount,
    solarRecordCount,
    dgAuditCount,
    transformerAuditCount,
    pumpAuditCount,
    hvacCount,
    acCount,
    lightingCount,
    fanCount,
    luxCount,
    miscCount,
  ]);

  const finalAuditLocked = useMemo(() => {
    const s = utilityAccount?.audit_step_submissions;
    const lock = (id: string) => Boolean(s?.[id]?.submitted_at);
    return lock(UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT);
  }, [utilityAccount?.audit_step_submissions]);
  const auditStatusLabel = finalAuditLocked ? "Completed" : "Pending";
  const finalSubmitMissingItems = useMemo(() => {
    const missing: string[] = [];

    if (tariffCount <= 0) missing.push("Utility tariff records");
    if (billingCount <= 0) missing.push("Utility billing records");
    if (hvacCount <= 0) missing.push("HVAC audit records");
    if (acCount <= 0) missing.push("AC audit records");
    if (lightingCount <= 0) missing.push("Lighting audit records");
    if (fanCount <= 0) missing.push("Fan audit records");
    if (luxCount <= 0) missing.push("LUX measurement records");
    if (miscCount <= 0) missing.push("Misc audit records");

    if (utilityAccount?.is_solar_connected && solarRecordCount <= 0) {
      missing.push("Solar audit records");
    }
    if (utilityAccount?.is_dg_connected && dgAuditCount <= 0) {
      missing.push("DG audit records");
    }
    if (utilityAccount?.is_transformer_connected && transformerAuditCount <= 0) {
      missing.push("Transformer audit records");
    }
    if (utilityAccount?.is_pump_connected && pumpAuditCount <= 0) {
      missing.push("Pump audit records");
    }

    return missing;
  }, [
    utilityAccount?.is_solar_connected,
    utilityAccount?.is_dg_connected,
    utilityAccount?.is_transformer_connected,
    utilityAccount?.is_pump_connected,
    tariffCount,
    billingCount,
    solarRecordCount,
    dgAuditCount,
    transformerAuditCount,
    pumpAuditCount,
    hvacCount,
    acCount,
    lightingCount,
    fanCount,
    luxCount,
    miscCount,
  ]);
  const canFinalSubmit = finalSubmitMissingItems.length === 0;

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
      <div className="mb-6 min-w-0">
        <Link
          href={`/facility/${facilityId}`}
          className="flex min-w-0 max-w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">
            Back to {facility.name}
          </span>
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
                    <span className="text-muted-foreground">Audit Status</span>
                    <span
                      className={`text-right font-medium ${
                        finalAuditLocked
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {auditStatusLabel}
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

                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Audit Status</p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        finalAuditLocked
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-amber-700 dark:text-amber-400"
                      }`}
                    >
                      {auditStatusLabel}
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

      {activeTab === UTILITY_AUDIT_STEP_IDS.TARIFF && (
        <UtilityTariffSection
          utilityAccountId={utilityAccountId}
          auditStepLocked={finalAuditLocked}
        />
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.BILLING && (
        <div className="space-y-4">
          <UtilityBillingRecordSection
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
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

      {utilityAccount.is_solar_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.SOLAR && (
          <div className="space-y-4">
            <SolarPlantSection
              utilityAccountId={utilityAccountId}
              facilityId={facility._id}
              auditStepLocked={finalAuditLocked}
            />
          </div>
        )}

      {utilityAccount.is_dg_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.DG && (
          <div className="space-y-4">
            <DGSetSection
              utilityAccountId={utilityAccountId}
              facilityId={facility._id}
              auditStepLocked={finalAuditLocked}
            />
          </div>
        )}

      {utilityAccount.is_transformer_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.TRANSFORMER && (
          <div className="space-y-4">
            <TransformerSection
              utilityAccountId={utilityAccountId}
              facilityId={facility._id}
              auditStepLocked={finalAuditLocked}
            />
          </div>
        )}

      {utilityAccount.is_pump_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.PUMP && (
          <div className="space-y-4">
            <PumpSection
              utilityAccountId={utilityAccountId}
              facilityId={facility._id}
              auditStepLocked={finalAuditLocked}
            />
          </div>
        )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.HVAC && (
        <div className="space-y-4">
          <HVACAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.AC && (
        <div className="space-y-4">
          <ACAuditRecordSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.LIGHTING && (
        <div className="space-y-4">
          <LightingAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.FAN && (
        <div className="space-y-4">
          <FanAuditRecordSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.LUX && (
        <div className="space-y-4">
          <LuxMeasurementSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.MISC && (
        <div className="space-y-4">
          <MiscLoadAuditSection
            facilityId={facility._id}
            utilityAccountId={utilityAccountId}
            auditStepLocked={finalAuditLocked}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground">
                Audit Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Utility tariff</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tariffCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">
                  Utility billing records
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {billingCount} record(s)
                </p>
              </div>
              {utilityAccount.is_solar_connected ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Solar audit</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {solarRecordCount} record(s)
                  </p>
                </div>
              ) : null}
              {utilityAccount.is_dg_connected ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">DG audit</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {dgAuditCount} record(s)
                  </p>
                </div>
              ) : null}
              {utilityAccount.is_transformer_connected ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">
                    Transformer audit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {transformerAuditCount} record(s)
                  </p>
                </div>
              ) : null}
              {utilityAccount.is_pump_connected ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Pump audit</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {pumpAuditCount} record(s)
                  </p>
                </div>
              ) : null}
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">HVAC audit</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {hvacCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">AC audit</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {acCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Lighting audit</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {lightingCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Fan audit</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {fanCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">LUX measurement</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {luxCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Misc audit</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {miscCount} record(s)
                </p>
              </div>
            </CardContent>
          </Card>

          <AuditStepSubmitBar
            utilityAccountId={utilityAccountId}
            stepId={UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT}
            stepLabel="Final utility audit"
            auditStepLocked={finalAuditLocked}
            disabled={!canFinalSubmit}
          />
          {!finalAuditLocked && !canFinalSubmit ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">
                Final submit is blocked until all required audit data is filled.
              </p>
              <p className="mt-1">
                Missing: {finalSubmitMissingItems.join(", ")}.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </DashboardLayout>
  );
}
