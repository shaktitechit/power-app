import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("jwt")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  const role = req.cookies.get("role")?.value;
  /** Session: short-lived access and/or refresh cookie (client refreshes access via API) */
  const hasSession = Boolean(accessToken || refreshToken);
  const usersHubFlag = req.cookies.get("usersHub")?.value;
  const { pathname } = req.nextUrl;

  // Prevent logged-in user from opening login page
  if (pathname === "/login") {
    if (hasSession) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect private routes
  if (!hasSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Users hub access: cookie or platform admins.
  const canUsersHub =
    usersHubFlag === "1" || role === "super_admin" || role === "admin";
  // Reports: managers can access, even without users hub.
  const canReportsHub = canUsersHub || role === "manager";
  const canPerformanceHub = role === "super_admin" || role === "admin";

  if (pathname.startsWith("/users") && !canUsersHub) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }
  if (pathname.startsWith("/audits") && !canUsersHub) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/performance") && !canPerformanceHub) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/reports") && !canReportsHub) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (
    pathname.startsWith("/submited-enquiries") &&
    role !== "super_admin"
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (pathname.startsWith("/pending-quotation") && role !== "super_admin") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/facilities",
    "/facility/:path*",
    "/enquiries",
    "/enquiries/:path*",
    "/submited-enquiries",
    "/submited-enquiries/:path*",
    "/pending-quotation",
    "/pending-quotation/:path*",
    "/settings",
    "/reports",
    "/audits",
    "/reports/:path*",
    "/users",
    "/users/:path*",
    "/performance",
    "/performance/:path*",
  ],
};
