"use client";

import type { AuditStepNoDataEntry } from "@/store/slices/electrical-audit/utilityApiSlice";
import { canManageResource } from "@/lib/authRoles";
import { useAppSelector } from "@/store/hooks";

/** For empty-state UX + disabling add buttons when “no data” is declared */
export function useSafetyAuditNoDataStep(
  stepId: string,
  auditStepNoData?: Record<string, AuditStepNoDataEntry>,
) {
  const user = useAppSelector((s) => s.auth.user);
  const isNoDataAdmin = canManageResource(
    user?.role,
    user?.permissions || [],
    "utility_audit_flow",
    "clear_no_data",
  );
  const noDataDeclared = Boolean(auditStepNoData?.[stepId]?.declared_at);
  return { isNoDataAdmin, noDataDeclared };
}
