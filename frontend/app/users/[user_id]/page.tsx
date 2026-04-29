"use client";

import { useParams } from "next/navigation";
import { UserPerformanceContent } from "@/components/user-performance/user-performance-content";

export default function UserPerformancePage() {
  const params = useParams();
  const userId = String(params.user_id || "");

  return (
    <UserPerformanceContent
      userId={userId}
      backHref="/users"
      backLabel="Back to Users"
    />
  );
}
