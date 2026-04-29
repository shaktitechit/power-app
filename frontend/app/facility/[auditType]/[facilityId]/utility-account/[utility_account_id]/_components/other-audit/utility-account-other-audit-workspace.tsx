"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { UtilityAccountDetailsSafety } from "../shared/utility-account-details-safety";
import type { UtilityAccountOtherAuditWorkspaceModel } from "./use-utility-account-other-audit-workspace";
import type { Facility } from "@/store/slices/facilityApiSlice";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";

type Props = {
  model: UtilityAccountOtherAuditWorkspaceModel;
  facility: Facility;
  utilityAccount: UtilityAccount;
  /** Shown when this audit type is not supported for a full workspace yet. */
  variant: "coming-soon" | "unsupported";
};

export function UtilityAccountOtherAuditWorkspace({
  model,
  facility,
  utilityAccount,
  variant,
}: Props) {
  const {
    facilityPathPrefix,
    auditTypeLabel,
    tabs,
    activeTab,
    handleTabChange,
    canViewDocs,
    finalAuditLocked,
    finalAuditSubmission,
    auditStatusLabel,
  } = model;

  return (
    <DashboardLayout
      title={utilityAccount.account_number}
      subtitle={`${facility.name} — ${auditTypeLabel}`}
    >
      <div className="mb-6 min-w-0">
        <Link
          href={facilityPathPrefix}
          className="flex min-w-0 max-w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Back to {facility.name}</span>
        </Link>
      </div>

      <Alert className="mb-4 border-amber-500/30 bg-amber-500/5">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertTitle>
          {variant === "coming-soon"
            ? "Workspace coming soon"
            : "Audit type not supported here yet"}
        </AlertTitle>
        <AlertDescription>
          {variant === "coming-soon" ? (
            <>
              The full <span className="font-medium">{auditTypeLabel}</span> utility
              workspace is not available yet. You can still review the connection below.
            </>
          ) : (
            <>
              This URL uses audit type <span className="font-mono text-xs">{auditTypeLabel}</span>.
              Only <span className="font-medium">Electrical Energy</span> and{" "}
              <span className="font-medium">Electrical Safety</span> have dedicated tabs and tools
              on this page for now.
            </>
          )}
        </AlertDescription>
      </Alert>

      <CustomTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="mb-4 sm:mb-6"
      />

      {activeTab === "details" && (
        <UtilityAccountDetailsSafety
          utilityAccount={utilityAccount}
          canViewDocs={canViewDocs}
          finalAuditLocked={finalAuditLocked}
          finalAuditSubmission={finalAuditSubmission}
          auditStatusLabel={auditStatusLabel}
        />
      )}
    </DashboardLayout>
  );
}
