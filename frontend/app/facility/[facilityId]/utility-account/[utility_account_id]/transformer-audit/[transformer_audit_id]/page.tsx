"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useParams,
  useRouter,
  usePathname,
  useSearchParams,
} from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plug, FileText, ImageIcon } from "lucide-react";
import Link from "next/link";
import { useGetUtilityAccountByIdQuery } from "@/store/slices/utilityApiSlice";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import { useGetTransformerByIdQuery } from "@/store/slices/transformerApiSlice";
import { TransformerAuditRecordSection } from "@/components/transformers/transformer-audit-record-section";

type TabItem = {
  id: string;
  label: string;
};

const baseTabs: TabItem[] = [
  { id: "details", label: "Transformer Details" },
  { id: "transformer-audits", label: "Transformer Audit" },
];

export default function ConnectionDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const facilityId = params.facilityId as string;
  const utilityAccountId = params.utility_account_id as string;
  const transformerAccountId = params.transformer_audit_id as string;

  const { data: utility, isLoading: utilityLoading } =
    useGetUtilityAccountByIdQuery(utilityAccountId);

  const UtilityAccount = utility?.data;

  const { data: facilitybyid, isLoading: facilityLoading } =
    useGetFacilityByIdQuery(facilityId);

  const facility = facilitybyid?.data?.facility;

  const { data: transformerAccountById, isLoading: transformerLoading } =
    useGetTransformerByIdQuery(transformerAccountId);

  const transformerAccount = transformerAccountById?.data;

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

  // ✅ Loading State (important fix)
  if (utilityLoading || facilityLoading || transformerLoading) {
    return (
      <DashboardLayout title="Loading Transformer...">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!transformerAccount || !facility || !UtilityAccount) {
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
      title={UtilityAccount.account_number}
      subtitle={`${facility.name} - ${UtilityAccount.connection_type} Utility Account - ${transformerAccount.transformer_tag} Transformer`}
    >
      <div className="mb-6">
        <Link
          href={`/facility/${facilityId}/utility-account/${utilityAccountId}`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {UtilityAccount.account_number}
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
                  Transformer Information
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4 p-4 pt-0 sm:p-6 sm:pt-0">
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Transformer Tag
                    </span>
                    <span className="text-right font-medium text-foreground">
                      {transformerAccount?.transformer_tag || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Rated Capacity
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.rated_capacity_kVA != null
                        ? `${transformerAccount.rated_capacity_kVA} kVA`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Type of Cooling
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.type_of_cooling || "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Rated HV</span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.rated_HV_kV != null
                        ? `${transformerAccount.rated_HV_kV} kV`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Rated LV</span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.rated_LV_V != null
                        ? `${transformerAccount.rated_LV_V} V`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Rated HV Current
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.rated_HV_current_A != null
                        ? `${transformerAccount.rated_HV_current_A} A`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Rated LV Current
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.rated_LV_current_A != null
                        ? `${transformerAccount.rated_LV_current_A} A`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">No Load Loss</span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.no_load_loss_kW != null
                        ? `${transformerAccount.no_load_loss_kW} kW`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Full Load Loss
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.full_load_loss_kW != null
                        ? `${transformerAccount.full_load_loss_kW} kW`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">
                      Nameplate Efficiency
                    </span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.nameplate_efficiency_percent != null
                        ? `${transformerAccount.nameplate_efficiency_percent}%`
                        : "-"}
                    </span>
                  </div>

                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Audit Date</span>
                    <span className="text-right text-foreground">
                      {transformerAccount?.audit_date
                        ? new Date(
                            transformerAccount.audit_date,
                          ).toLocaleDateString()
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
              {transformerAccount?.documents?.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {transformerAccount.documents.map(
                    (doc: any, index: number) => (
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

      {activeTab === "transformer-audits" && (
        <TransformerAuditRecordSection
          facilityId={facilityId}
          utilityAccountId={utilityAccountId}
          transformerId={transformerAccountId}
        />
      )}
    </DashboardLayout>
  );
}
