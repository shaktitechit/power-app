"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditsLoadSnapshotControls } from "./_components/audits-load-snapshot-controls";
import { AuditSnapshotLoadedSummary } from "./_components/audit-snapshot-loaded-summary";
import {
  type FacilityAuditSnapshotEnergyData,
  type FacilityAuditSnapshotSafetyData,
  useLazyGetFacilityAuditSnapshotQuery,
} from "@/store/slices/auditApiSlice";
import {
  type Facility,
  useGetFacilitiesQuery,
} from "@/store/slices/facilityApiSlice";
import { toastHandler } from "@/lib/toast";
import {
  ELECTRICAL_SAFETY_AUDIT,
  type AuditTypeOption,
} from "@/lib/facilityConstants";
import { ClipboardList } from "lucide-react";

import { AuditSnapshotExplorer } from "./_components/audit-snapshot-explorer";

const ENERGY_AUDIT: AuditTypeOption = "Electrical Energy Audit";

const SNAPSHOT_AUDIT_OPTIONS: { value: AuditTypeOption; label: string }[] = [
  { value: ENERGY_AUDIT, label: ENERGY_AUDIT },
  { value: ELECTRICAL_SAFETY_AUDIT, label: ELECTRICAL_SAFETY_AUDIT },
];

export default function AuditsPage() {
  const { data: facilitiesResponse, isLoading: facilitiesLoading } =
    useGetFacilitiesQuery();

  const facilities: Facility[] = useMemo(() => {
    const raw = facilitiesResponse?.data ?? facilitiesResponse ?? [];
    return Array.isArray(raw) ? raw : [];
  }, [facilitiesResponse]);

  const [auditType, setAuditType] = useState<AuditTypeOption>(ENERGY_AUDIT);
  const [facilityId, setFacilityId] = useState("");
  const [snapshot, setSnapshot] = useState<
    FacilityAuditSnapshotEnergyData | FacilityAuditSnapshotSafetyData | null
  >(null);

  const facilitiesForAuditType = useMemo(
    () => facilities.filter((f) => f.audit_type === auditType),
    [facilities, auditType],
  );

  const [triggerSnapshot, { isFetching }] =
    useLazyGetFacilityAuditSnapshotQuery();

  useEffect(() => {
    if (!facilityId) return;
    const stillValid = facilitiesForAuditType.some((f) => f._id === facilityId);
    if (!stillValid) setFacilityId("");
  }, [facilityId, facilitiesForAuditType]);

  useEffect(() => {
    setSnapshot(null);
  }, [auditType, facilityId]);

  const canLoad = Boolean(facilityId.trim());

  const handleLoadSnapshot = async () => {
    if (!canLoad) return;

    try {
      const res = await toastHandler({
        action: () =>
          triggerSnapshot({
            facility_id: facilityId.trim(),
            audit_type: auditType,
          }).unwrap(),
        loading: "Loading audit snapshot…",
        success: "Audit snapshot loaded",
      });

      if (res?.data) {
        setSnapshot(
          res.data as
            | FacilityAuditSnapshotEnergyData
            | FacilityAuditSnapshotSafetyData,
        );
      }
    } catch {
      setSnapshot(null);
    }
  };

  return (
    <DashboardLayout
      title="Audit Master"
      subtitle="Browse audit data by utility account and dataset"
    >
      <Card className="border-border">
        <CardHeader className="flex flex-row flex-wrap items-start gap-4 border-b border-border/60 pb-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-lg">Facility audit data</CardTitle>
              <p className="text-sm text-muted-foreground">
                Pick an audit program, choose a matching facility, then load a
                snapshot. In the explorer, select a utility account and a
                dataset to inspect audit data.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <AuditsLoadSnapshotControls
            auditType={auditType}
            onAuditTypeChange={setAuditType}
            auditOptions={SNAPSHOT_AUDIT_OPTIONS}
            facilityId={facilityId}
            onFacilityIdChange={setFacilityId}
            facilitiesForAuditType={facilitiesForAuditType}
            facilitiesLoading={facilitiesLoading}
            canLoad={canLoad}
            isFetching={isFetching}
            onLoadSnapshot={handleLoadSnapshot}
          />

          {snapshot ? (
            <div className="space-y-4">
              <AuditSnapshotLoadedSummary snapshot={snapshot} />

              <AuditSnapshotExplorer snapshot={snapshot} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Choose an audit program and a facility, then load a snapshot to
              browse data by utility account and dataset.
            </p>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
