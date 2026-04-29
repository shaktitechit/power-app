"use client";

import { canAccessReportsHub } from "@/lib/authRoles";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import ReportsSection from "@/components/reports/report-section";
import { useAppSelector } from "@/store/hooks";

export default function ReportsPage() {
  const user = useAppSelector((state) => state.auth.user);
  const canAccessReports = canAccessReportsHub(
    user?.role,
    user?.permissions || [],
  );

  return (
    <DashboardLayout
      title="Reports"
      subtitle="Generate and download audit reports"
    >
      {!canAccessReports ? (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-900 dark:border-yellow-600/30 dark:bg-yellow-950/30 dark:text-yellow-100">
          You do not have permission to access reports.
        </div>
      ) : (
        <div className="space-y-6">
          <ReportsSection />
        </div>
      )}
    </DashboardLayout>
  );
}
