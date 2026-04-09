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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plug, FileText, ImageIcon } from "lucide-react";
import { useGetUtilityAccountByIdQuery } from "@/store/slices/utilityApiSlice";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import { useGetDGSetByIdQuery } from "@/store/slices/dgSetApiSlice";
import { DGAuditRecordSection } from "@/components/connection/dg-sets/DGAuditRecordSection";
import { useAppSelector } from "@/store/hooks";

type TabItem = {
  id: string;
  label: string;
};

type DGDocument = {
  fileUrl: string;
  fileType: "image" | "pdf";
  fileName?: string;
  uploadedAt?: string;
};

const baseTabs: TabItem[] = [
  { id: "details", label: "DG Set Details" },
  { id: "dg-audits", label: "DG Audit" },
];

export default function ConnectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const facilityId = params.facilityId as string;
  const utilityAccountId = params.utility_account_id as string;
  const dgAccountId = params.dg_audit_id as string;
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.role === "admin";

  const { data: utility, isLoading: utilityAccountLoading } =
    useGetUtilityAccountByIdQuery(utilityAccountId);

  const utilityAccount = utility?.data;

  const { data: facilityById, isLoading: facilityLoading } =
    useGetFacilityByIdQuery(facilityId);

  const facility = facilityById?.data?.facility;

  const { data: dgAccountById, isLoading: dgAccountLoading } =
    useGetDGSetByIdQuery(dgAccountId);

  const dgAccount = dgAccountById?.data;

  const tabs = useMemo(() => baseTabs, []);
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

  if (utilityAccountLoading || facilityLoading || dgAccountLoading) {
    return (
      <DashboardLayout title="Loading DG Set...">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!dgAccount || !facility || !utilityAccount) {
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
      subtitle={`${facility.name} - ${utilityAccount.connection_type} Utility Account - ${dgAccount.dg_number} DG Set`}
    >
      <div className="mb-6">
        <Link
          href={`/facility/${facilityId}/utility-account/${utilityAccountId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {utilityAccount.account_number}
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
                  DG Set Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">DG Set Number</span>
                    <span className="text-right font-medium text-foreground">
                      {dgAccount.dg_number || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Make / Model</span>
                    <span className="text-right text-foreground">
                      {dgAccount.make_model || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Year of Installation
                    </span>
                    <span className="text-right text-foreground">
                      {dgAccount.year_of_installation ?? "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Rated Capacity
                    </span>
                    <span className="text-right text-foreground">
                      {dgAccount.rated_capacity_kVA
                        ? `${dgAccount.rated_capacity_kVA} kVA`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Rated Active Power
                    </span>
                    <span className="text-right text-foreground">
                      {dgAccount.rated_active_power_kW
                        ? `${dgAccount.rated_active_power_kW} kW`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Rated Voltage</span>
                    <span className="text-right text-foreground">
                      {dgAccount.rated_voltage_V
                        ? `${dgAccount.rated_voltage_V} V`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Rated Speed</span>
                    <span className="text-right text-foreground">
                      {dgAccount.rated_speed_RPM
                        ? `${dgAccount.rated_speed_RPM} RPM`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Fuel Type</span>
                    <span className="text-right capitalize text-foreground">
                      {dgAccount.fuel_type || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit Date</span>
                    <span className="text-right text-foreground">
                      {dgAccount.audit_date
                        ? new Date(dgAccount.audit_date).toLocaleDateString()
                        : "-"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
              ) : dgAccount.documents?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {dgAccount.documents.map((doc: DGDocument, index: number) => (
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
                          <p className="text-xs text-muted-foreground">PDF</p>
                        </a>
                      )}

                      <div className="space-y-1 p-2">
                        <p className="truncate text-xs text-foreground">
                          {doc.fileName || `File ${index + 1}`}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {doc.uploadedAt
                            ? new Date(doc.uploadedAt).toLocaleDateString()
                            : "-"}
                        </p>
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

      {activeTab === "dg-audits" && (
        <DGAuditRecordSection
          facilityId={facilityId}
          utilityAccountId={utilityAccountId}
          dgSetId={dgAccountId}
        />
      )}
    </DashboardLayout>
  );
}
