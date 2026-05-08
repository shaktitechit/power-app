"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Facility } from "@/store/slices/facilityApiSlice";
import type { AuditTypeOption } from "@/lib/facilityConstants";
import { Loader2 } from "lucide-react";

export type AuditsLoadSnapshotControlsProps = {
  auditType: AuditTypeOption;
  onAuditTypeChange: (value: AuditTypeOption) => void;
  auditOptions: { value: AuditTypeOption; label: string }[];
  facilityId: string;
  onFacilityIdChange: (id: string) => void;
  facilitiesForAuditType: Facility[];
  facilitiesLoading: boolean;
  canLoad: boolean;
  isFetching: boolean;
  onLoadSnapshot: () => void;
};

/** Audit program + facility selectors and load action for the audits page. */
export function AuditsLoadSnapshotControls({
  auditType,
  onAuditTypeChange,
  auditOptions,
  facilityId,
  onFacilityIdChange,
  facilitiesForAuditType,
  facilitiesLoading,
  canLoad,
  isFetching,
  onLoadSnapshot,
}: AuditsLoadSnapshotControlsProps) {
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <div className="space-y-2">
        <Label>Audit program</Label>
        <Select
          value={auditType}
          onValueChange={(v) => onAuditTypeChange(v as AuditTypeOption)}
          disabled={facilitiesLoading}
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue placeholder="Audit program" />
          </SelectTrigger>
          <SelectContent>
            {auditOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Facility</Label>
        <Select
          value={facilityId || undefined}
          onValueChange={onFacilityIdChange}
          disabled={
            facilitiesLoading || facilitiesForAuditType.length === 0
          }
        >
          <SelectTrigger className="w-full min-w-0">
            <SelectValue
              placeholder={
                facilitiesLoading
                  ? "Loading facilities…"
                  : facilitiesForAuditType.length === 0
                    ? "No facilities for this program"
                    : "Select facility"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {facilitiesForAuditType.map((f) => (
              <SelectItem key={f._id} value={f._id}>
                {f.name}
                {f.city ? ` · ${f.city}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        className="w-full md:w-auto"
        disabled={!canLoad || isFetching}
        onClick={() => void onLoadSnapshot()}
      >
        {isFetching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </>
        ) : (
          "Load snapshot"
        )}
      </Button>
    </div>
  );
}
