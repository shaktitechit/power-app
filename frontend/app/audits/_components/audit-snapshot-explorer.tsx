"use client";

import type {
  FacilityAuditSnapshotEnergyData,
  FacilityAuditSnapshotSafetyData,
} from "@/store/slices/auditApiSlice";
import { ELECTRICAL_SAFETY_AUDIT } from "@/lib/facilityConstants";

import { AuditSnapshotEnergyExplorer } from "./energy/audit-snapshot-energy-explorer";
import { AuditSnapshotSafetyExplorer } from "./safety/audit-snapshot-safety-explorer";

export type AuditSnapshotExplorerProps = {
  snapshot:
    | FacilityAuditSnapshotEnergyData
    | FacilityAuditSnapshotSafetyData;
};

/** Routes to program-specific explorers — keep energy vs safety logic separate. */
export function AuditSnapshotExplorer({ snapshot }: AuditSnapshotExplorerProps) {
  if (snapshot.audit_type === ELECTRICAL_SAFETY_AUDIT) {
    return (
      <AuditSnapshotSafetyExplorer
        snapshot={snapshot as FacilityAuditSnapshotSafetyData}
      />
    );
  }
  return (
    <AuditSnapshotEnergyExplorer
      snapshot={snapshot as FacilityAuditSnapshotEnergyData}
    />
  );
}

export { AuditSnapshotEnergyExplorer } from "./energy/audit-snapshot-energy-explorer";
export { AuditSnapshotSafetyExplorer } from "./safety/audit-snapshot-safety-explorer";
export { ALL_UTILITY_ACCOUNTS_VALUE } from "./audit-snapshot-explorer-chrome";
