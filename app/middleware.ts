import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isPathProtected,
  isPathPublic,
  validateSessionFromCookies,
  getRequiredAccessLevel,
  hasAccessLevel,
  getAccessDeniedUrl,
} from "@/server/auth/middleware-rbac";

/**
 * Authentication & RBAC Middleware
 *
 * Protects routes that require authentication and enforces role-based access control.
 *
 * Routes to protect:
 * - /admin/* (all admin routes) - requires admin role
 * - /settings/* (settings) - requires admin role
 * - /api/admin/* (admin API routes) - requires admin role
 * - /dashboard/* (dashboard) - requires authenticated
 * - /super-admin/* (super admin) - requires super_admin role
 *
 * Public routes:
 * - / (home)
 * - /login
 * - /register
 * - /api/auth/*
 * - /events/[slug] (public event pages)
 */

export const config = {
  // Matcher defines which routes the middleware runs on
  // Include all routes except static files, images, favicon, etc.
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - public files (public directory)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

/**
 * Protected route patterns
 * Routes matching these patterns require authentication
 */
const protectedPatterns = [
  "/admin",
  "/settings",
  "/api/admin",
  "/dashboard",
  "/api/dashboard",
  "/checkin",
  "/api/checkin",
  "/my-events",
  "/super-admin",
  "/api/super-admin",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for non-route requests
  // This includes static files, images, etc. that passed the matcher
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check if the path is public (no auth required)
  if (isPathPublic(pathname)) {
    return NextResponse.next();
  }

  // Check if the path is protected
  if (!isPathProtected(pathname, protectedPatterns)) {
    // Not a protected route, allow access
    return NextResponse.next();
  }

  // Get the session cookie from the request
  const cookieHeader = request.headers.get("cookie");

  // Validate the session and get user role
  const sessionData = await validateSessionFromCookies(cookieHeader);

  if (!sessionData) {
    // No valid session - redirect to login
    const loginUrl = new URL("/login", request.url);

    // Save the original URL to redirect back after login
    loginUrl.searchParams.set("redirect", pathname);

    return NextResponse.redirect(loginUrl);
  }

  // Get the required access level for this route
  const requiredLevel = getRequiredAccessLevel(pathname);

  // Check if user's role meets the required access level
  if (!hasAccessLevel(sessionData.role, requiredLevel)) {
    // User doesn't have required role - redirect to appropriate page
    const deniedUrl = getAccessDeniedUrl(pathname);
    return NextResponse.redirect(deniedUrl);
  }

  // Session is valid and user has required role - allow access
  return NextResponse.next();
}

// Session validation is now handled by validateSessionFromCookies in middleware-rbac module