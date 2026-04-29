"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetFacilityByIdQuery } from "@/store/slices/facilityApiSlice";
import { facilityPath, isMongoObjectIdString } from "@/lib/facilityRoutes";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

/**
 * Single-segment `/facility/{x}`: legacy Mongo id URLs redirect to
 * `/facility/{auditTypeSlug}/{mongoId}`. A lone audit-type slug (not an id) shows not found.
 */
export default function FacilityAuditTypeSegmentPage() {
  const params = useParams();
  const router = useRouter();
  const segment = params.auditType as string;

  const isId = isMongoObjectIdString(segment);
  const { data, isLoading, isError } = useGetFacilityByIdQuery(segment, {
    skip: !isId,
  });

  const facility = data?.data?.facility;

  useEffect(() => {
    if (!isId || !facility) return;
    router.replace(facilityPath(facility.audit_type, segment));
  }, [isId, facility, segment, router]);

  if (!isId) {
    return (
      <DashboardLayout title="Not found">
        <div className="p-6 text-center text-muted-foreground">
          Page not found.
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout title="Loading...">
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      </DashboardLayout>
    );
  }

  if (isError || !facility) {
    return (
      <DashboardLayout title="Not found">
        <div className="p-6 text-center text-muted-foreground">
          Facility not found.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Redirecting...">
      <div className="p-6 text-center text-muted-foreground">Redirecting...</div>
    </DashboardLayout>
  );
}
