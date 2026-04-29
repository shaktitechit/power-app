"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TabItem } from "../shared/utility-account-workspace-types";
import { useUtilityAccountBase } from "../shared/use-utility-account-base";
import { ELECTRICAL_SAFETY_AUDIT_STEPS } from "@/lib/electrical-audit/safety-audit-workflow";
import {
  getUtilityFinalAuditSubmissionEntry,
  hasUtilityFinalAuditSubmission,
  LEGACY_SAFETY_ONLY_FINAL_SUBMIT_STEP_ID,
  UTILITY_AUDIT_STEP_IDS,
} from "@/lib/electrical-audit/utility-audit-steps";
import { useGetSafetyTransformerAuditsQuery } from "@/store/slices/safety-audit/safetyTransformerAuditApiSlice";
import { useGetSafetyMeteringRoomAuditsQuery } from "@/store/slices/safety-audit/safetyMeteringRoomAuditApiSlice";
import { useGetSafetyPanelRoomAuditsQuery } from "@/store/slices/safety-audit/safetyPanelRoomAuditApiSlice";
import { useGetSafetyLdbAuditsQuery } from "@/store/slices/safety-audit/safetyLdbAuditApiSlice";
import { useGetSafetyDgAuditsQuery } from "@/store/slices/safety-audit/safetyDgAuditApiSlice";
import { useGetSafetyEarthingAuditsQuery } from "@/store/slices/safety-audit/safetyEarthingAuditApiSlice";
import { useGetSafetyUpsAuditsQuery } from "@/store/slices/safety-audit/safetyUpsAuditApiSlice";
import { useGetSafetyGeneralAuditsQuery } from "@/store/slices/safety-audit/safetyGeneralAuditApiSlice";
import { useGetSafetyWiringAuditsQuery } from "@/store/slices/safety-audit/safetyWiringAuditApiSlice";
import { useGetSafetyLoadAnalysisAuditsQuery } from "@/store/slices/safety-audit/safetyLoadAnalysisAuditApiSlice";
import { useGetSafetyLeakInspectionAuditsQuery } from "@/store/slices/safety-audit/safetyLeakInspectionAuditApiSlice";
import { useGetSafetyThermographyAuditsQuery } from "@/store/slices/safety-audit/safetyThermographyAuditApiSlice";
import { useGetSafetyElevatorAuditsQuery } from "@/store/slices/safety-audit/safetyElevatorAuditApiSlice";
import { useGetSafetyPacVentilationAuditsQuery } from "@/store/slices/safety-audit/safetyPacVentilationAuditApiSlice";
import { useGetSafetyPumpCompressorAuditsQuery } from "@/store/slices/safety-audit/safetyPumpCompressorAuditApiSlice";
import { useGetSafetyAdditionalItemsAuditsQuery } from "@/store/slices/safety-audit/safetyAdditionalItemsAuditApiSlice";
import { useGetSafetyDocumentsAuditsQuery } from "@/store/slices/safety-audit/safetyDocumentsAuditApiSlice";

const TAB_DETAILS = "details";

/** Electrical **safety** audit: account details, checklist tabs, preview & submit. */
export function useElectricalSafetyUtilityAccountWorkspace() {
  const base = useUtilityAccountBase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilityPathPrefix, utilityAccountId, effectiveFacilityId, utilityAccount } =
    base;

  const skipBase = !utilityAccountId || !effectiveFacilityId;

  const listArg = useMemo(
    () => ({
      facility_id: effectiveFacilityId,
      utility_account_id: utilityAccountId,
    }),
    [effectiveFacilityId, utilityAccountId],
  );

  const { data: tData } = useGetSafetyTransformerAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: mrData } = useGetSafetyMeteringRoomAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: prData } = useGetSafetyPanelRoomAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: ldbData } = useGetSafetyLdbAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: dgData } = useGetSafetyDgAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: earthData } = useGetSafetyEarthingAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: upsData } = useGetSafetyUpsAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: genData } = useGetSafetyGeneralAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: wireData } = useGetSafetyWiringAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: loadData } = useGetSafetyLoadAnalysisAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: leakData } = useGetSafetyLeakInspectionAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: thermData } = useGetSafetyThermographyAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: elevData } = useGetSafetyElevatorAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: pacData } = useGetSafetyPacVentilationAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: pumpData } = useGetSafetyPumpCompressorAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: addData } = useGetSafetyAdditionalItemsAuditsQuery(listArg, {
    skip: skipBase,
  });
  const { data: docData } = useGetSafetyDocumentsAuditsQuery(listArg, {
    skip: skipBase,
  });

  const safetyStepCounts = useMemo(
    () => ({
      transformers: tData?.data?.length ?? 0,
      "metering-room": mrData?.data?.length ?? 0,
      "panel-room": prData?.data?.length ?? 0,
      "light-db": ldbData?.data?.length ?? 0,
      "dg-set": dgData?.data?.length ?? 0,
      "earthing-system": earthData?.data?.length ?? 0,
      "ups-battery": upsData?.data?.length ?? 0,
      "general-safety": genData?.data?.length ?? 0,
      "wiring-inspection": wireData?.data?.length ?? 0,
      "load-analysis": loadData?.data?.length ?? 0,
      "leak-inspection": leakData?.data?.length ?? 0,
      thermography: thermData?.data?.length ?? 0,
      "elevator-safety": elevData?.data?.length ?? 0,
      "pac-ventilation": pacData?.data?.length ?? 0,
      "pump-compressor": pumpData?.data?.length ?? 0,
      "additional-items": addData?.data?.length ?? 0,
      "documents-review": docData?.data?.length ?? 0,
    }),
    [
      tData?.data?.length,
      mrData?.data?.length,
      prData?.data?.length,
      ldbData?.data?.length,
      dgData?.data?.length,
      earthData?.data?.length,
      upsData?.data?.length,
      genData?.data?.length,
      wireData?.data?.length,
      loadData?.data?.length,
      leakData?.data?.length,
      thermData?.data?.length,
      elevData?.data?.length,
      pacData?.data?.length,
      pumpData?.data?.length,
      addData?.data?.length,
      docData?.data?.length,
    ],
  );

  const noData = utilityAccount?.audit_step_no_data;

  const hasStepDataOrNoData = (stepKey: string, count: number): boolean => {
    if (count > 0) return true;
    return Boolean(noData?.[stepKey]?.declared_at);
  };

  const tabs = useMemo<TabItem[]>(() => {
    const subs = utilityAccount?.audit_step_submissions;

    return [
      { id: TAB_DETAILS, label: "Utility Account Details" },
      ...ELECTRICAL_SAFETY_AUDIT_STEPS.map((s) => {
        const count = safetyStepCounts[s.id as keyof typeof safetyStepCounts] ?? 0;
        return {
          id: s.id,
          label: s.label,
          count,
          completed: hasStepDataOrNoData(s.id, count),
        };
      }),
      {
        id: UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT,
        label: "Preview and Submit",
        completed: hasUtilityFinalAuditSubmission(subs),
      },
    ];
  }, [
    utilityAccount?.audit_step_submissions,
    utilityAccount?.audit_step_no_data,
    safetyStepCounts,
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

  const finalSubmitMissingItems = useMemo(() => {
    const missing: string[] = [];
    for (const s of ELECTRICAL_SAFETY_AUDIT_STEPS) {
      const count =
        safetyStepCounts[s.id as keyof typeof safetyStepCounts] ?? 0;
      if (!hasStepDataOrNoData(s.id, count)) {
        missing.push(s.label);
      }
    }
    return missing;
  }, [safetyStepCounts, noData]);

  const canFinalSubmit = finalSubmitMissingItems.length === 0;

  const validTabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);
  const getValidTab = (tab: string | null) => {
    const normalized =
      tab === LEGACY_SAFETY_ONLY_FINAL_SUBMIT_STEP_ID
        ? UTILITY_AUDIT_STEP_IDS.PREVIEW_SUBMIT
        : tab;
    if (normalized && validTabIds.includes(normalized)) return normalized;
    return TAB_DETAILS;
  };

  const [activeTab, setActiveTab] = useState<string>(TAB_DETAILS);

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
      { scroll: false },
    );
  };

  return {
    ...base,
    tabs,
    activeTab,
    handleTabChange,
    auditStepLocked,
    facilityAuditLocked,
    finalAuditLocked,
    finalAuditSubmission,
    auditStatusLabel,
    safetyStepCounts,
    finalSubmitMissingItems,
    canFinalSubmit,
  };
}

export type ElectricalSafetyUtilityAccountWorkspaceModel = ReturnType<
  typeof useElectricalSafetyUtilityAccountWorkspace
>;
