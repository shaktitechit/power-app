"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ELECTRICAL_SAFETY_AUDIT_STEPS,
  SAFETY_AUDIT_STEP_LABELS,
  SAFETY_PREVIEW_AND_SUBMIT_STEP_ID,
} from "@/lib/electrical-audit/safety-audit-workflow";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";
import { SafetyTransformerSection } from "@/components/safety-audit/transformer/transformer-section";
import { SafetyMeteringRoomSection } from "@/components/safety-audit/metering-room/metering-room-section";
import { SafetyPanelRoomSection } from "@/components/safety-audit/panel-room/panel-room-section";
import { SafetyLightDbSection } from "@/components/safety-audit/light-db/light-db-section";
import { SafetyDgSetSection } from "@/components/safety-audit/dg-set/dg-set-section";
import { SafetyEarthingSystemSection } from "@/components/safety-audit/earthing-system/earthing-system-section";
import { SafetyUpsBatterySection } from "@/components/safety-audit/ups-battery/ups-battery-section";
import { SafetyGeneralSafetySection } from "@/components/safety-audit/general-safety/general-safety-section";
import { SafetyWiringInspectionSection } from "@/components/safety-audit/wiring-inspection/wiring-inspection-section";
import { SafetyLoadAnalysisSection } from "@/components/safety-audit/load-analysis/load-analysis-section";
import { SafetyLeakInspectionSection } from "@/components/safety-audit/leak-inspection/leak-inspection-section";
import { SafetyThermographySection } from "@/components/safety-audit/thermography/thermography-section";
import { SafetyElevatorSafetySection } from "@/components/safety-audit/elevator-safety/elevator-safety-section";
import { SafetyPacVentilationSection } from "@/components/safety-audit/pac-ventilation/pac-ventilation-section";
import { SafetyPumpCompressorSection } from "@/components/safety-audit/pump-compressor/pump-compressor-section";
import { SafetyAdditionalItemsSection } from "@/components/safety-audit/additional-items/additional-items-section";
import { SafetyDocumentsReviewSection } from "@/components/safety-audit/document-review/document-review-section";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";
import type { ElectricalSafetyUtilityAccountWorkspaceModel } from "./use-electrical-safety-utility-account-workspace";

type Props = {
  model: ElectricalSafetyUtilityAccountWorkspaceModel;
  utilityAccount: UtilityAccount;
  facilityId: string;
};

export function UtilityAccountSafetyAuditStepPanels({
  model,
  utilityAccount,
  facilityId,
}: Props) {
  const {
    activeTab,
    utilityAccountId,
    auditStepLocked,
    safetyStepCounts,
    finalSubmitMissingItems,
    canFinalSubmit,
    finalAuditLocked,
    facilityAuditLocked,
  } = model;

  const noData = utilityAccount.audit_step_no_data;

  const common = {
    facilityId,
    utilityAccountId,
    auditStepLocked,
    auditStepNoData: noData,
  };

  return (
    <>
      {activeTab === "transformers" && (
        <SafetyTransformerSection {...common} />
      )}

      {activeTab === "metering-room" && (
        <SafetyMeteringRoomSection {...common} />
      )}

      {activeTab === "panel-room" && (
        <SafetyPanelRoomSection {...common} />
      )}

      {activeTab === "light-db" && <SafetyLightDbSection {...common} />}

      {activeTab === "dg-set" && <SafetyDgSetSection {...common} />}

      {activeTab === "earthing-system" && (
        <SafetyEarthingSystemSection {...common} />
      )}

      {activeTab === "ups-battery" && (
        <SafetyUpsBatterySection {...common} />
      )}

      {activeTab === "general-safety" && (
        <SafetyGeneralSafetySection {...common} />
      )}

      {activeTab === "wiring-inspection" && (
        <SafetyWiringInspectionSection {...common} />
      )}

      {activeTab === "load-analysis" && (
        <SafetyLoadAnalysisSection {...common} />
      )}

      {activeTab === "leak-inspection" && (
        <SafetyLeakInspectionSection {...common} />
      )}

      {activeTab === "thermography" && (
        <SafetyThermographySection {...common} />
      )}

      {activeTab === "elevator-safety" && (
        <SafetyElevatorSafetySection {...common} />
      )}

      {activeTab === "pac-ventilation" && (
        <SafetyPacVentilationSection {...common} />
      )}

      {activeTab === "pump-compressor" && (
        <SafetyPumpCompressorSection {...common} />
      )}

      {activeTab === "additional-items" && (
        <SafetyAdditionalItemsSection {...common} />
      )}

      {activeTab === "documents-review" && (
        <SafetyDocumentsReviewSection {...common} />
      )}

      {activeTab === SAFETY_PREVIEW_AND_SUBMIT_STEP_ID && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground">
                Electrical safety — audit preview
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3">
              {ELECTRICAL_SAFETY_AUDIT_STEPS.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <p className="text-xs text-muted-foreground">
                    {SAFETY_AUDIT_STEP_LABELS[s.id] ?? s.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {safetyStepCounts[s.id as keyof typeof safetyStepCounts] ?? 0}{" "}
                    record(s)
                    {noData?.[s.id]?.declared_at ? (
                      <span className="ml-2 font-normal text-muted-foreground">
                        · No data declared
                      </span>
                    ) : null}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <AuditStepSubmitBar
            utilityAccountId={utilityAccountId}
            stepId={SAFETY_PREVIEW_AND_SUBMIT_STEP_ID}
            stepLabel="Electrical safety audit (final)"
            auditStepLocked={auditStepLocked}
            disabled={!canFinalSubmit || facilityAuditLocked}
          />
          {!finalAuditLocked && !canFinalSubmit ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">
                Final submit is blocked until each checklist section has at least
                one record or an explicit &quot;no data&quot; declaration.
              </p>
              <p className="mt-1">
                Missing: {finalSubmitMissingItems.join(", ")}.
              </p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
