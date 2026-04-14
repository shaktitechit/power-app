import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("jwt")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;
  /** Session: short-lived access and/or refresh cookie (client refreshes access via API) */
  const hasSession = Boolean(accessToken || refreshToken);
  const role = req.cookies.get("role")?.value;
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

  // Admin-only routes
  if (
    (pathname.startsWith("/users") || pathname.startsWith("/reports")) &&
    role !== "admin"
  ) {
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
    "/settings",
    "/reports",
    "/reports/:path*",
    "/users/:path*",
  ],
};