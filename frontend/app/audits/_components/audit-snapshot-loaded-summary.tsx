"use client";

import type {
  FacilityAuditSnapshotEnergyData,
  FacilityAuditSnapshotSafetyData,
} from "@/store/slices/auditApiSlice";

function getFacilityLabel(facility: unknown): string {
  if (
    facility &&
    typeof facility === "object" &&
    "name" in facility &&
    typeof (facility as { name?: string }).name === "string"
  ) {
    return (facility as { name: string }).name;
  }
  return "Facility";
}

export type AuditSnapshotLoadedSummaryProps = {
  snapshot:
    | FacilityAuditSnapshotEnergyData
    | FacilityAuditSnapshotSafetyData;
};

/** Facility name + audit program strip above the explorer. */
export function AuditSnapshotLoadedSummary({
  snapshot,
}: AuditSnapshotLoadedSummaryProps) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-3 text-sm sm:px-4">
      <p className="break-words font-medium text-foreground">
        {getFacilityLabel(snapshot.facility)}
      </p>
      <p className="mt-1 break-words text-muted-foreground">
        <span className="font-medium text-foreground">
          {snapshot.audit_type}
        </span>
        {" · "}
        {snapshot.utility_accounts.length} utility account
        {snapshot.utility_accounts.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
