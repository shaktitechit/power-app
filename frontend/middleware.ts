import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("jwt")?.value;
  const role = req.cookies.get("role")?.value;
  const { pathname } = req.nextUrl;

  // Prevent logged-in user from opening login page
  if (pathname === "/login") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Protect private routes
  if (!token) {
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