"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  LayoutDashboard,
  Building2,
  BarChart3,
  FileText,
  Users,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  userRole?: "admin" | "auditor";
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Facilities", href: "/facilities", icon: Building2 },
  { title: "Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Reports", href: "/reports", icon: FileText, adminOnly: true },
  { title: "Users", href: "/users", icon: Users, adminOnly: true },
  // { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggle,
  onMobileClose,
  userRole,
}: SidebarProps) {
  const pathname = usePathname();

  /* -------------------------------- */
  /* Hydration Fix */
  /* -------------------------------- */

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  /* -------------------------------- */
  /* Filter nav by role */
  /* -------------------------------- */

  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || userRole === "admin",
  );

  const handleLinkClick = () => {
    onMobileClose();
  };

  return (
    <>
      {/* Mobile Overlay */}

      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",

          /* Desktop */

          "lg:translate-x-0",
          isCollapsed ? "lg:w-16" : "lg:w-64",

          /* Mobile */

          "w-72 -translate-x-full lg:translate-x-0",
          isMobileOpen && "translate-x-0",
        )}
      >
        {/* Logo */}

        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          <Link
            href="/dashboard"
            className="flex min-w-0 flex-1 items-center gap-3"
            onClick={handleLinkClick}
          >
            <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-white ring-1 ring-sidebar-border/60">
              <Image
                src="/spspl-logo.jpeg"
                alt="Shakti Powers"
                fill
                className="object-contain p-0.5"
                sizes="64px"
                priority
              />
            </div>

            {(!isCollapsed || isMobileOpen) && (
              <span className="truncate text-lg font-semibold text-sidebar-foreground">
                Shakti Powers
              </span>
            )}
          </Link>

          {/* Mobile Close Button */}

          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              pathname === item.href ||
              pathname.startsWith(item.href + "/") ||
              (item.href === "/facilities" && pathname.startsWith("/facility"));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",

                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", isActive && "text-primary")}
                />

                {(!isCollapsed || isMobileOpen) && <span>{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Support Widget */}
        <div className="border-t border-sidebar-border p-3">
          {(!isCollapsed || isMobileOpen) ? (
            <div className="space-y-2 rounded-lg border border-sidebar-border/70 bg-sidebar-accent/40 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/80">
                Support
              </p>
              <a
                href="mailto:it@spspl.com"
                className="flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground"
              >
                <Mail className="h-4 w-4 shrink-0" />
                <span className="truncate">it@spspl.com</span>
              </a>
              <a
                href="tel:6239284003"
                className="flex items-center gap-2 text-sm text-sidebar-foreground/80 hover:text-sidebar-foreground"
              >
                <Phone className="h-4 w-4 shrink-0" />
                <span>6239284003</span>
              </a>
            </div>
          ) : (
            <div className="flex justify-center">
              <a
                href="mailto:it@spspl.com"
                className="rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                aria-label="Contact support"
                title="Support"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          )}
        </div>

        {/* Collapse Button */}

        <div className="hidden border-t border-sidebar-border p-3 lg:block">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className={cn(
              "w-full justify-center text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              !isCollapsed && "justify-start gap-3",
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
