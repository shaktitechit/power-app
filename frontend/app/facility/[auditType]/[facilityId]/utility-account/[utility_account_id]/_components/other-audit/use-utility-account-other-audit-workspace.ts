"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { TabItem } from "../shared/utility-account-workspace-types";
import { useUtilityAccountBase } from "../shared/use-utility-account-base";
import { slugToAuditTypeLabel } from "@/lib/facilityRoutes";

const TAB_DETAILS = "details";

/**
 * Non–electrical-energy routes (e.g. thermal, lightning) or unknown slugs: minimal tabs until full product exists.
 */
export function useUtilityAccountOtherAuditWorkspace() {
  const base = useUtilityAccountBase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { facilityPathPrefix, utilityAccountId, auditTypeSlug } = base;

  const label = slugToAuditTypeLabel(auditTypeSlug) || auditTypeSlug;

  const tabs = useMemo<TabItem[]>(
    () => [{ id: TAB_DETAILS, label: "Utility account" }],
    [],
  );

  const validTabIds = useMemo(() => tabs.map((t) => t.id), [tabs]);
  const getValidTab = (tab: string | null) => {
    if (tab && validTabIds.includes(tab)) return tab;
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

  const facilityAuditLocked = Boolean(base.facility?.audit_closure?.closed_at);
  const auditStatusLabel = facilityAuditLocked ? "Facility closed" : "In progress";

  return {
    ...base,
    auditTypeLabel: label,
    tabs,
    activeTab,
    handleTabChange,
    auditStepLocked: facilityAuditLocked,
    facilityAuditLocked,
    finalAuditLocked: false,
    finalAuditSubmission: undefined,
    auditStatusLabel,
  };
}

export type UtilityAccountOtherAuditWorkspaceModel = ReturnType<
  typeof useUtilityAccountOtherAuditWorkspace
>;
