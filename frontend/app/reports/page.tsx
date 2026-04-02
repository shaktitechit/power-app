"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import ReportsSection from "@/components/reports/report-section";

export default function ReportsPage() {
  return (
    <DashboardLayout
      title="Reports"
      subtitle="Generate and download audit reports"
    >
      <div className="space-y-6">
        <ReportsSection />
      </div>
    </DashboardLayout>
  );
}
