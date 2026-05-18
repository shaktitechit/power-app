"use client";

import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import PresenceBootstrap from "../presenceBootstrap";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  role?: string;
  isFullscreen?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  isFullscreen = false,
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const user = useAppSelector((state) => state.auth.user);

  return (
    <div className="min-h-screen bg-background">
      <PresenceBootstrap />
      {!isFullscreen && (
        <Sidebar
          isCollapsed={isCollapsed}
          isMobileOpen={isMobileOpen}
          onToggle={() => setIsCollapsed(!isCollapsed)}
          onMobileClose={() => setIsMobileOpen(false)}
          userRole={user?.role}
          userPermissions={user?.permissions || []}
        />
      )}
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300",
          // Desktop margins
          !isFullscreen && "lg:ml-64",
          !isFullscreen && isCollapsed && "lg:ml-16",
        )}
      >
        <Header
          title={title}
          subtitle={subtitle}
          onMenuClick={() => setIsMobileOpen(true)}
          isFullscreen={isFullscreen}
        />
        <main className="min-w-0 flex-1 overflow-x-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
