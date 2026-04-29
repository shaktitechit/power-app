"use client";

import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useRouter } from "next/navigation";

export function UtilityAccountNotFoundState({
  auditTypeSlug,
  effectiveFacilityId,
}: {
  auditTypeSlug: string;
  effectiveFacilityId: string;
}) {
  const router = useRouter();
  return (
    <DashboardLayout title="Connection Not Found">
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">The requested connection was not found.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            router.push(`/facility/${auditTypeSlug}/${effectiveFacilityId}`)
          }
        >
          Back to Facility
        </Button>
      </div>
    </DashboardLayout>
  );
}
