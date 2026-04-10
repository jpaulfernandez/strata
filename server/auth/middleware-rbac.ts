/**
 * Middleware helpers for session validation and RBAC
 *
 * These functions are designed to be used in Next.js middleware
 * where we need to validate sessions and check roles.
 */

import type { UserRole } from "@/lib/permissions";
import { isValidRole } from "@/lib/permissions";

/**
 * Role-based route access definitions
 * Defines which roles can access specific route patterns
 */
export type RouteAccessLevel = "public" | "authenticated" | "staff" | "admin" | "super_admin";

/**
 * Default route access levels
 */
export const routeAccessConfig: Record<string, RouteAccessLevel> = {
  // Public routes - no authentication required
  "/": "public",
  "/login": "public",
  "/register": "public",
  "/events": "public",

  // Authenticated routes - any logged-in user
  "/dashboard": "authenticated",
  "/checkin": "authenticated",

  // Staff routes - staff and above
  "/staff": "staff",
  "/my-events": "staff",
  "/scan": "staff",

  // Admin routes - admin and above
  "/admin": "admin",
  "/settings": "admin",
  "/events/new": "admin",
  "/events/[slug]/edit": "admin",

  // Super admin routes - only super_admin
  "/super-admin": "super_admin",
  "/admin/users": "super_admin",
};

/**
 * Get the required access level for a path
 */
export function getRequiredAccessLevel(pathname: string): RouteAccessLevel {
  // Check exact matches first
  if (routeAccessConfig[pathname]) {
    return routeAccessConfig[pathname];
  }

  // Check pattern matches
  if (pathname.startsWith("/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/settings")) {
    return "admin";
  }
  if (pathname.startsWith("/api/admin")) {
    return "admin";
  }
  if (pathname.startsWith("/api/settings")) {
    return "admin";
  }
  if (pathname.startsWith("/super-admin")) {
    return "super_admin";
  }
  if (pathname.startsWith("/scan")) {
    return "staff";
  }

  // Default: authenticated users only
  return "authenticated";
}

/**
 * Check if a role meets the required access level
 */
export function hasAccessLevel(
  userRole: UserRole,
  requiredLevel: RouteAccessLevel
): boolean {
  const roleLevels: Record<UserRole, number> = {
    staff: 1,
    admin: 2,
    super_admin: 3,
  };

  const levelRequirements: Record<RouteAccessLevel, number> = {
    public: 0,
    authenticated: 1,
    staff: 1,
    admin: 2,
    super_admin: 3,
  };

  const userLevel = roleLevels[userRole] || 0;
  const required = levelRequirements[requiredLevel];

  return userLevel >= required;
}

/**
 * Validate session from cookies in middleware
 *
 * Since middleware runs on the edge, we decode the session token
 * directly from the cookie to check basic validity.
 * Full validation happens in server actions.
 *
 * @param cookieHeader - The cookie header string from the request
 * @returns The user role if valid session exists, null otherwise
 */
export async function validateSessionFromCookies(
  cookieHeader: string | null
): Promise<{
  session: unknown;
  user: unknown;
  role: UserRole;
} | null> {
  if (!cookieHeader) {
    return null;
  }

  try {
    // Parse cookies from the header
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies["better-auth.session_token"];

    if (!sessionCookie) {
      return null;
    }

    // Decode the session token to extract user info
    // The session token contains base64 encoded JSON
    const decoded = decodeSessionToken(sessionCookie);

    if (!decoded) {
      return null;
    }

    // Extract role from the decoded token or default to staff
    let role: UserRole = "staff";
    if (decoded.role && isValidRole(String(decoded.role))) {
      role = String(decoded.role) as UserRole;
    }

    return {
      session: { id: decoded.sessionId },
      user: { id: decoded.userId, role },
      role,
    };
  } catch (error) {
    // If validation fails, session is invalid
    return null;
  }
}

/**
 * Parse cookies from a cookie header string
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};

  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join("=").trim();
    }
  });

  return cookies;
}

/**
 * Decode session token (simple JWT-like decode)
 * Better-auth session tokens are signed JWTs
 */
function decodeSessionToken(token: string): { userId: string; sessionId: string; role?: string } | null {
  try {
    // Split the JWT token
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    // Decode the payload (middle part)
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    );

    return {
      userId: payload.sub || payload.userId || payload.id,
      sessionId: payload.sessionId || payload.sid || payload.jti,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

/**
 * Check if a route matches a protected path pattern
 *
 * @param pathname - The request path
 * @param patterns - Array of patterns to match against
 * @returns true if the path matches any of the patterns
 */
export function isPathProtected(
  pathname: string,
  patterns: string[]
): boolean {
  return patterns.some((pattern) => {
    // Handle wildcard patterns like /admin/*
    if (pattern.endsWith("/*")) {
      const base = pattern.slice(0, -2);
      return pathname === base || pathname.startsWith(base + "/");
    }
    return pathname === pattern;
  });
}

/**
 * Check if a route is public (should not require authentication)
 *
 * @param pathname - The request path
 * @returns true if the path is public
 */
export function isPathPublic(pathname: string): boolean {
  // Define public path patterns
  const publicPatterns = [
    "/",                    // Home page
    "/login",              // Login page
    "/api/auth",           // Auth API routes
  ];

  // Public patterns that start with a prefix
  const publicPrefixes = [
    "/api/auth/",          // Auth API routes (nested)
    "/e/",                 // Public event pages
    "/ticket/",            // Public ticket pages
  ];

  // Check exact matches
  if (publicPatterns.includes(pathname)) {
    return true;
  }

  // Check prefix matches
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  return false;
}

/**
 * Get redirect URL based on access level
 */
export function getAccessDeniedUrl(pathname: string): URL {
  // Different redirect based on current path
  if (pathname.startsWith("/admin") || pathname.startsWith("/settings")) {
    // Redirect to dashboard for admin access denied
    return new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  }

  // Default to login page
  const loginUrl = new URL("/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  loginUrl.searchParams.set("redirect", pathname);
  return loginUrl;
}