"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ElectricalSafetyUtilityWorkspace } from "./electrical-safety-utility-workspace";
import { UtilityAccountNotFoundState } from "../shared/utility-account-not-found-state";
import { useElectricalSafetyUtilityAccountWorkspace } from "./use-electrical-safety-utility-account-workspace";
import type { Facility } from "@/store/slices/facilityApiSlice";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";

export function ElectricalSafetyUtilityAccountScreen() {
  const model = useElectricalSafetyUtilityAccountWorkspace();

  if (model.utilityAccountLoading || model.facilityLoading) {
    return (
      <DashboardLayout title="Loading Connection...">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  const facility = model.facility as Facility | undefined;
  const utilityAccount = model.utilityAccount as UtilityAccount | undefined;

  if (!facility || !utilityAccount) {
    return (
      <UtilityAccountNotFoundState
        auditTypeSlug={model.auditTypeSlug}
        effectiveFacilityId={model.effectiveFacilityId}
      />
    );
  }

  return (
    <ElectricalSafetyUtilityWorkspace
      model={model}
      facility={facility}
      utilityAccount={utilityAccount}
    />
  );
}
