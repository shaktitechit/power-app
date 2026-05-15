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
  Activity,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ClipboardList,
  MessageSquare,
  CircleCheck,
  Hourglass,
  ListChecks,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  hasPermissionStrict,
  type UserPermission,
} from "@/lib/authRoles";

interface SidebarProps {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
  userRole?: string;
  userPermissions?: UserPermission[];
}

type NavAccess =
  | "all"
  | "usersHub"
  | "performanceHub"
  | "reportsHub"
  | "dashboardRead"
  | "facilityRead"
  | "analyticsRead"
  | "superAdmin";

interface NavItem {
  title: string;
  /** Present for plain links only */
  href?: string;
  icon: React.ElementType;
  /** Default: visible to all logged-in users */
  access?: NavAccess;
  /** Accordion submenu (super-admin hubs) */
  children?: {
    title: string;
    href: string;
    icon: React.ElementType;
  }[];
}

const SUBMITTED_OR_PENDING_ROUTE_PREFIXES = [
  "/submited-enquiries",
  "/pending-quotation",
] as const;

function isSubmittedOrPendingPath(pathname: string) {
  return SUBMITTED_OR_PENDING_ROUTE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    access: "dashboardRead",
  },
  {
    title: "Facilities",
    href: "/facilities",
    icon: Building2,
    access: "facilityRead",
  },
  {
    title: "Enquiries",
    href: "/enquiries",
    icon: MessageSquare,
    access: "facilityRead",
  },
  {
    title: "Pending approval",
    icon: ListChecks,
    access: "superAdmin",
    children: [
      {
        title: "Submitted enquiries",
        href: "/submited-enquiries",
        icon: CircleCheck,
      },
      {
        title: "Pending quotations",
        href: "/pending-quotation",
        icon: Hourglass,
      },
    ],
  },
  {
    title: "Audits",
    href: "/audits",
    icon: ClipboardList,
    access: "usersHub",
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    access: "analyticsRead",
  },
  { title: "Reports", href: "/reports", icon: FileText, access: "reportsHub" },
  { title: "Users", href: "/users", icon: Users, access: "usersHub" },
  {
    title: "Performance",
    href: "/performance",
    icon: Activity,
    access: "performanceHub",
  },
  // { title: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  isCollapsed,
  isMobileOpen,
  onToggle,
  onMobileClose,
  userRole,
  userPermissions = [],
}: SidebarProps) {
  const pathname = usePathname();
  const iconsOnlyCollapsed = isCollapsed && !isMobileOpen;
  const [pendingApprovalExpanded, setPendingApprovalExpanded] = useState(() =>
    isSubmittedOrPendingPath(pathname),
  );

  const isAdminHubRole = userRole === "super_admin" || userRole === "admin";
  const isManagerRole = userRole === "manager";
  const isAuditorRole = userRole === "auditor";

  /* -------------------------------- */
  /* Hydration Fix */
  /* -------------------------------- */

  const [mounted, setMounted] = useState(false);
  const [canUsersHubFromCookie, setCanUsersHubFromCookie] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof document !== "undefined") {
      const hubCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("usersHub="))
        ?.split("=")[1];
      setCanUsersHubFromCookie(hubCookie === "1");
    }
  }, []);

  useEffect(() => {
    if (isSubmittedOrPendingPath(pathname)) {
      setPendingApprovalExpanded(true);
    }
  }, [pathname]);

  if (!mounted) return null;

  /* -------------------------------- */
  /* Filter nav by explicit permissions */
  /* -------------------------------- */

  const filteredNavItems = navItems.filter((item) => {
    if (item.access === "performanceHub") {
      return userRole === "super_admin" || userRole === "admin";
    }
    if (item.access === "superAdmin") {
      return userRole === "super_admin";
    }
    if (isAdminHubRole) return true;
    if (!item.access || item.access === "all") return true;
    if (item.access === "usersHub")
      return canUsersHubFromCookie;
    if (item.access === "reportsHub")
      return isManagerRole || canUsersHubFromCookie;
    if (item.access === "dashboardRead")
      return (
        isManagerRole ||
        isAuditorRole ||
        hasPermissionStrict(userPermissions, "dashboard", "read", "all")
      );
    if (item.access === "facilityRead")
      return (
        isManagerRole ||
        isAuditorRole ||
        hasPermissionStrict(userPermissions, "facility", "read", "all")
      );
    if (item.access === "analyticsRead")
      return (
        isManagerRole ||
        isAuditorRole ||
        hasPermissionStrict(userPermissions, "analytics", "read", "all")
      );
    return true;
  });

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
            if (item.children?.length) {
              const Icon = item.icon;
              const anyChildActive = item.children.some(
                (c) =>
                  pathname === c.href ||
                  pathname.startsWith(`${c.href}/`),
              );

              const subLinkClasses = (childHref: string) => {
                const active =
                  pathname === childHref ||
                  pathname.startsWith(`${childHref}/`);
                return cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                );
              };

              if (iconsOnlyCollapsed) {
                return (
                  <DropdownMenu key={item.title}>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        title={item.title}
                        aria-label={item.title}
                        className={cn(
                          "flex w-full items-center justify-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors lg:justify-start",
                          anyChildActive
                            ? "bg-sidebar-accent text-sidebar-primary"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            anyChildActive && "text-primary",
                          )}
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="right" align="start" className="w-56">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <DropdownMenuItem key={child.href} asChild>
                            <Link
                              href={child.href}
                              className={cn(subLinkClasses(child.href), "cursor-pointer")}
                              onClick={handleLinkClick}
                            >
                              <ChildIcon className="h-4 w-4 shrink-0" />
                              {child.title}
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }

              return (
                <div key={item.title} className="space-y-0.5">
                  <button
                    type="button"
                    aria-expanded={pendingApprovalExpanded}
                    onClick={() => setPendingApprovalExpanded((prev) => !prev)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                      anyChildActive
                        ? "bg-sidebar-accent text-sidebar-primary"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        anyChildActive && "text-primary",
                      )}
                    />
                    <span className="flex-1 truncate">{item.title}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform",
                        pendingApprovalExpanded && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {pendingApprovalExpanded && (
                    <div className="ml-5 space-y-0.5 border-l border-sidebar-border py-0.5 pl-3">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childRouteActive =
                          pathname === child.href ||
                          pathname.startsWith(`${child.href}/`);
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={handleLinkClick}
                            className={subLinkClasses(child.href)}
                          >
                            <ChildIcon
                              className={cn(
                                "h-4 w-4 shrink-0",
                                childRouteActive && "text-primary",
                              )}
                            />
                            {child.title}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const href = item.href;
            if (!href) return null;
            const Icon = item.icon;

            const isActive =
              pathname === href ||
              pathname.startsWith(`${href}/`) ||
              (href === "/facilities" && pathname.startsWith("/facility"));

            return (
              <Link
                key={href}
                href={href}
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

                {!iconsOnlyCollapsed && <span>{item.title}</span>}
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
