"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UTILITY_AUDIT_STEP_IDS } from "@/lib/electrical-audit/utility-audit-steps";
import { UtilityTariffSection } from "@/components/electrical-audit/utility-tariff/utility-tariff-section";
import { UtilityBillingRecordSection } from "@/components/electrical-audit/utility-billing-record/utility-billing-record-section";
import { SolarPlantSection } from "@/components/electrical-audit/solar-plants/solar-plant-section";
import { DGSetSection } from "@/components/electrical-audit/connection/dg-sets/dg-set-section";
import { TransformerSection } from "@/components/electrical-audit/transformers/transformer-section";
import { PumpSection } from "@/components/electrical-audit/pumps/pump-section";
import { HVACAuditSection } from "@/components/electrical-audit/hvac/hvac-audit-section";
import { LightingAuditSection } from "@/components/electrical-audit/lighting/lighting-audit-section";
import { LuxMeasurementSection } from "@/components/electrical-audit/lux/lux-measurement-section";
import { MiscLoadAuditSection } from "@/components/electrical-audit/misc/misc-load-audit-section";
import { ACAuditRecordSection } from "@/components/electrical-audit/ac/ac-audit-record-section";
import { FanAuditRecordSection } from "@/components/electrical-audit/fan/fan-audit-record";
import { AuditStepSubmitBar } from "@/components/electrical-audit/utility-audit/audit-step-submit-bar";
import type { UtilityAccount } from "@/store/slices/electrical-audit/utilityApiSlice";
import type { ElectricalEnergyUtilityAccountWorkspaceModel } from "./use-electrical-energy-utility-account-workspace";

type Props = {
  model: ElectricalEnergyUtilityAccountWorkspaceModel;
  /** Non-null: parent only renders this when the account is loaded. */
  utilityAccount: UtilityAccount;
};

export function UtilityAccountAuditStepPanels({ model, utilityAccount }: Props) {
  const {
    activeTab,
    utilityAccountId,
    effectiveFacilityId,
    facilityPathPrefix,
    auditStepLocked,
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
    finalSubmitMissingItems,
    canFinalSubmit,
    finalAuditLocked,
    facilityAuditLocked,
  } = model;

  return (
    <>
      {activeTab === UTILITY_AUDIT_STEP_IDS.TARIFF && (
        <UtilityTariffSection
          utilityAccountId={utilityAccountId}
          auditStepLocked={auditStepLocked}
        />
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.BILLING && (
        <div className="space-y-4">
          <UtilityBillingRecordSection
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            billingCycle={
              utilityAccount.billing_cycle === "monthly" ||
              utilityAccount.billing_cycle === "bi-monthly" ||
              utilityAccount.billing_cycle === "quarterly"
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
              facilityId={effectiveFacilityId}
              facilityPathPrefix={facilityPathPrefix}
              auditStepLocked={auditStepLocked}
            />
          </div>
        )}

      {utilityAccount.is_dg_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.DG && (
          <div className="space-y-4">
            <DGSetSection
              utilityAccountId={utilityAccountId}
              facilityId={effectiveFacilityId}
              facilityPathPrefix={facilityPathPrefix}
              auditStepLocked={auditStepLocked}
            />
          </div>
        )}

      {utilityAccount.is_transformer_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.TRANSFORMER && (
          <div className="space-y-4">
            <TransformerSection
              utilityAccountId={utilityAccountId}
              facilityId={effectiveFacilityId}
              facilityPathPrefix={facilityPathPrefix}
              auditStepLocked={auditStepLocked}
            />
          </div>
        )}

      {utilityAccount.is_pump_connected &&
        activeTab === UTILITY_AUDIT_STEP_IDS.PUMP && (
          <div className="space-y-4">
            <PumpSection
              utilityAccountId={utilityAccountId}
              facilityId={effectiveFacilityId}
              facilityPathPrefix={facilityPathPrefix}
              auditStepLocked={auditStepLocked}
            />
          </div>
        )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.HVAC && (
        <div className="space-y-4">
          <HVACAuditSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.AC && (
        <div className="space-y-4">
          <ACAuditRecordSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.LIGHTING && (
        <div className="space-y-4">
          <LightingAuditSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.FAN && (
        <div className="space-y-4">
          <FanAuditRecordSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.LUX && (
        <div className="space-y-4">
          <LuxMeasurementSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.MISC && (
        <div className="space-y-4">
          <MiscLoadAuditSection
            facilityId={effectiveFacilityId}
            utilityAccountId={utilityAccountId}
            auditStepLocked={auditStepLocked}
            auditStepNoData={utilityAccount.audit_step_no_data}
          />
        </div>
      )}

      {activeTab === UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT && (
        <div className="space-y-4">
          <Card className="border-border bg-card">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-card-foreground">Audit Preview</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 p-4 pt-0 sm:grid-cols-2 sm:p-6 sm:pt-0 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Utility tariff</p>
                <p className="mt-1 text-sm font-semibold text-foreground">
                  {tariffCount} record(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Utility billing records</p>
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
                  <p className="text-xs text-muted-foreground">Transformer audit</p>
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
            auditStepLocked={auditStepLocked}
            disabled={!canFinalSubmit || facilityAuditLocked}
          />
          {!finalAuditLocked && !canFinalSubmit ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <p className="font-medium">
                Final submit is blocked until all required audit data is filled.
              </p>
              <p className="mt-1">Missing: {finalSubmitMissingItems.join(", ")}.</p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
