"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { DataTable, Column } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuditorsQuery } from "@/store/slices/userApiSlice";
import { useAppSelector } from "@/store/hooks";
import { BarChart3, Search, Shield, UserCheck } from "lucide-react";
import {
  canAccessPerformanceHub,
  formatRoleLabel,
  isPlatformAdmin,
  type AppUserRole,
} from "@/lib/authRoles";

const ADMIN_PERFORMANCE_ROLES: AppUserRole[] = ["manager", "auditor"];

type RowUser = {
  _id: string;
  name: string;
  email: string;
  role?: AppUserRole;
};

export default function PerformanceListPage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const currentRole = currentUser?.role;
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading } = useAuditorsQuery();

  useEffect(() => {
    if (currentRole && !canAccessPerformanceHub(currentRole)) {
      router.replace("/dashboard");
    }
  }, [currentRole, router]);

  const users: RowUser[] = data?.data || [];

  const visibleUsers = useMemo(() => {
    if (currentRole === "super_admin") return users;
    if (currentRole === "admin") {
      return users.filter((u) =>
        ADMIN_PERFORMANCE_ROLES.includes((u.role || "auditor") as AppUserRole),
      );
    }
    return [];
  }, [users, currentRole]);

  const filteredUsers = useMemo(() => {
    return visibleUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        formatRoleLabel(user.role)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [visibleUsers, searchQuery]);

  if (currentRole && !canAccessPerformanceHub(currentRole)) {
    return null;
  }

  const columns: Column<RowUser>[] = [
    {
      key: "name",
      header: "User",
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary">
              {row.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{row.name}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (row) => (
        <div className="flex items-center gap-2">
          {isPlatformAdmin(row.role) ? (
            <Shield className="h-4 w-4 text-primary" />
          ) : (
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm">{formatRoleLabel(row.role || "auditor")}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => router.push(`/performance/${row._id}`)}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          View performance
        </Button>
      ),
    },
  ];

  return (
    <DashboardLayout
      title="Performance"
      subtitle="View user performance metrics and export reports"
    >
      <div className="mb-6">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={isLoading}
        emptyMessage="No users to show"
      />

      <div className="mt-4 text-sm text-muted-foreground">
        {currentRole === "admin"
          ? "Showing managers and auditors only."
          : "Showing all users."}
      </div>
    </DashboardLayout>
  );
}
