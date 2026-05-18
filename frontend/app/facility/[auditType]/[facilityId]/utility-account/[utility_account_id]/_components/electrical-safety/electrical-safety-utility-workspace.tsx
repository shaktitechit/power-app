"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CustomTabs } from "@/components/ui/custom-tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Maximize2, Minimize2 } from "lucide-react";
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
  isFullscreen: boolean;
  onFullscreenToggle: () => void;
};

export function ElectricalSafetyUtilityWorkspace({
  model,
  facility,
  utilityAccount,
  isFullscreen,
  onFullscreenToggle,
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
      isFullscreen={isFullscreen}
    >
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between min-w-0">
        <Link
          href={facilityPathPrefix}
          className="flex min-w-0 max-w-full items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          <span className="truncate">Back to {facility.name}</span>
        </Link>

        <Button
          variant="outline"
          size="sm"
          onClick={onFullscreenToggle}
          className="self-start sm:self-auto flex items-center gap-2 border-border/80 text-xs font-semibold tracking-wide uppercase transition hover:bg-muted/80"
        >
          {isFullscreen ? (
            <>
              <Minimize2 className="h-3.5 w-3.5 text-primary" />
              <span>Exit Full Screen</span>
            </>
          ) : (
            <>
              <Maximize2 className="h-3.5 w-3.5 text-primary" />
              <span>Full Screen Mode</span>
            </>
          )}
        </Button>
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
