"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { UtilityAccountDetailsSafety } from "../shared/utility-account-details-safety";
import { UtilityAccountSafetyAuditStepPanels } from "./utility-account-safety-audit-step-panels";
import type { ElectricalSafetyUtilityAccountWorkspaceModel } from "./use-electrical-safety-utility-account-workspace";
import type { Facility } from "@/store/slices/facilityApiSlice";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";

type Props = {
  model: ElectricalSafetyUtilityAccountWorkspaceModel;
  facility: Facility;
  utilityAccount: UtilityAccount;
};

export function ElectricalSafetyUtilityWorkspace({
  model,
  facility,
  utilityAccount,
}: Props) {
  const {
    facilityPathPrefix,
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
      subtitle={`${facility.name} - ${utilityAccount.connection_type} Utility Account — Electrical safety`}
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

      <UtilityAccountSafetyAuditStepPanels
        model={model}
        utilityAccount={utilityAccount}
        facilityId={facility._id}
      />
    </DashboardLayout>
  );
}
