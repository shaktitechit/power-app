"use client";

import {
  AUDIT_TYPE_SLUG,
  isUtilityAccountComingSoonSlug,
} from "@/lib/facilityRoutes";
import { useParams } from "next/navigation";
import { ElectricalEnergyUtilityAccountScreen } from "./_components/electrical-energy/electrical-energy-utility-account-screen";
import { ElectricalSafetyUtilityAccountScreen } from "./_components/electrical-safety/electrical-safety-utility-account-screen";
import { UtilityAccountOtherAuditScreen } from "./_components/other-audit/utility-account-other-audit-screen";

import { useState } from "react";

/**
 * Renders a different workspace per `auditType` segment: full electrical energy audit,
 * electrical safety, or a lightweight view for types that are not ready / unknown.
 */
export default function ConnectionDetailsPage() {
  const params = useParams();
  const auditTypeSlug = params.auditType as string;
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  if (auditTypeSlug === AUDIT_TYPE_SLUG.ELECTRICAL_ENERGY) {
    return (
      <ElectricalEnergyUtilityAccountScreen
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
      />
    );
  }

  if (auditTypeSlug === AUDIT_TYPE_SLUG.ELECTRICAL_SAFETY) {
    return (
      <ElectricalSafetyUtilityAccountScreen
        isFullscreen={isFullscreen}
        onFullscreenToggle={toggleFullscreen}
      />
    );
  }

  if (isUtilityAccountComingSoonSlug(auditTypeSlug)) {
    return <UtilityAccountOtherAuditScreen variant="coming-soon" />;
  }

  return <UtilityAccountOtherAuditScreen variant="unsupported" />;
}
