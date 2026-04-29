"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useGetUtilityTariffsQuery } from "@/store/slices/electrical-audit/utilityTariffApiSlice";
import { useGetUtilityBillingRecordsQuery } from "@/store/slices/electrical-audit/utilityBillingRecordApiSlice";
import { useGetSolarGenerationRecordsQuery } from "@/store/slices/electrical-audit/solarGenerationRecordApiSlice";
import { useGetDGAuditRecordsQuery } from "@/store/slices/electrical-audit/dgAuditRecordApiSlice";
import { useGetTransformerAuditRecordsQuery } from "@/store/slices/electrical-audit/transformerAuditRecordApiSlice";
import { useGetPumpAuditRecordsQuery } from "@/store/slices/electrical-audit/pumpAuditRecordApiSlice";
import { useGetHVACAuditsQuery } from "@/store/slices/electrical-audit/hvacAuditApiSlice";
import { useGetACAuditRecordsQuery } from "@/store/slices/electrical-audit/acAuditRecordApiSlice";
import { useGetLightingAuditsQuery } from "@/store/slices/electrical-audit/lightingAuditApiSlice";
import { useGetFanAuditRecordsQuery } from "@/store/slices/electrical-audit/fanAuditRecordApiSlice";
import { useGetLuxMeasurementsQuery } from "@/store/slices/electrical-audit/luxMeasurementApiSlice";
import { useGetMiscLoadAuditsQuery } from "@/store/slices/electrical-audit/miscLoadAuditApiSlice";
import {
  getUtilityFinalAuditSubmissionEntry,
  hasUtilityFinalAuditSubmission,
  UTILITY_AUDIT_STEP_IDS,
} from "@/lib/electrical-audit/utility-audit-steps";
import type { TabItem } from "../shared/utility-account-workspace-types";
import { useUtilityAccountBase } from "../shared/use-utility-account-base";

/** Full electrical **energy** audit: utility tariff, billing, loads, HVAC, preview. */
export function useElectricalEnergyUtilityAccountWorkspace() {
  const base = useUtilityAccountBase();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    utilityAccountId,
    effectiveFacilityId,
    facilityPathPrefix,
    utilityAccount,
  } = base;

  const skipBase = !utilityAccountId || !effectiveFacilityId;

  const { data: tariffData } = useGetUtilityTariffsQuery(
    { utility_account_id: utilityAccountId },
    { skip: !utilityAccountId },
  );
  const { data: billingData } = useGetUtilityBillingRecordsQuery(
    { utility_account_id: utilityAccountId },
    { skip: !utilityAccountId },
  );
  const { data: solarGenData } = useGetSolarGenerationRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: effectiveFacilityId },
    { skip: skipBase || !utilityAccount?.is_solar_connected },
  );
  const { data: dgAuditData } = useGetDGAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: effectiveFacilityId },
    { skip: skipBase || !utilityAccount?.is_dg_connected },
  );
  const { data: transformerAuditData } = useGetTransformerAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: effectiveFacilityId },
    { skip: skipBase || !utilityAccount?.is_transformer_connected },
  );
  const { data: pumpAuditData } = useGetPumpAuditRecordsQuery(
    { utility_account_id: utilityAccountId, facility_id: effectiveFacilityId },
    { skip: skipBase || !utilityAccount?.is_pump_connected },
  );
  const { data: hvacData } = useGetHVACAuditsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: acData } = useGetACAuditRecordsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: lightingData } = useGetLightingAuditsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: fanData } = useGetFanAuditRecordsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: luxData } = useGetLuxMeasurementsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
    { skip: skipBase },
  );
  const { data: miscData } = useGetMiscLoadAuditsQuery(
    { facility_id: effectiveFacilityId, utility_account_id: utilityAccountId },
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
        completed: hasUtilityFinalAuditSubmission(subs),
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

  const finalAuditLocked = useMemo(
    () => hasUtilityFinalAuditSubmission(utilityAccount?.audit_step_submissions),
    [utilityAccount?.audit_step_submissions],
  );
  const finalAuditSubmission = getUtilityFinalAuditSubmissionEntry(
    utilityAccount?.audit_step_submissions,
  );
  const facilityAuditLocked = Boolean(base.facility?.audit_closure?.closed_at);
  const auditStepLocked = finalAuditLocked || facilityAuditLocked;
  const auditStatusLabel = finalAuditLocked ? "Completed" : "Pending";
  const noData = utilityAccount?.audit_step_no_data;

  const hasStepDataOrNoData = (count: number, stepKey: string): boolean => {
    if (count > 0) return true;
    return Boolean(noData?.[stepKey]?.declared_at);
  };

  const finalSubmitMissingItems = useMemo(() => {
    const missing: string[] = [];

    if (tariffCount <= 0) missing.push("Utility tariff records");
    if (billingCount <= 0) missing.push("Utility billing records");
    if (!hasStepDataOrNoData(hvacCount, UTILITY_AUDIT_STEP_IDS.HVAC)) {
      missing.push("HVAC audit records");
    }
    if (!hasStepDataOrNoData(acCount, UTILITY_AUDIT_STEP_IDS.AC)) {
      missing.push("AC audit records");
    }
    if (!hasStepDataOrNoData(lightingCount, UTILITY_AUDIT_STEP_IDS.LIGHTING)) {
      missing.push("Lighting audit records");
    }
    if (!hasStepDataOrNoData(fanCount, UTILITY_AUDIT_STEP_IDS.FAN)) {
      missing.push("Fan audit records");
    }
    if (!hasStepDataOrNoData(luxCount, UTILITY_AUDIT_STEP_IDS.LUX)) {
      missing.push("LUX measurement records");
    }
    if (!hasStepDataOrNoData(miscCount, UTILITY_AUDIT_STEP_IDS.MISC)) {
      missing.push("Misc audit records");
    }

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
    utilityAccount?.audit_step_no_data,
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

    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", validTab);

    setActiveTab(validTab);

    router.replace(
      `${facilityPathPrefix}/utility-account/${utilityAccountId}?${p.toString()}`,
      {
        scroll: false,
      },
    );
  };

  return {
    ...base,
    tabs,
    activeTab,
    handleTabChange,
    finalAuditLocked,
    finalAuditSubmission,
    facilityAuditLocked,
    auditStepLocked,
    auditStatusLabel,
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
  };
}

export type ElectricalEnergyUtilityAccountWorkspaceModel = ReturnType<
  typeof useElectricalEnergyUtilityAccountWorkspace
>;
