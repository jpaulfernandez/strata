/**
 * Middleware helpers for session validation and RBAC
 *
 * These functions are designed to be used in Next.js middleware
 * where we need to validate sessions and check roles without making database calls directly.
 *
 * The middleware runs on the edge, so we use the better-auth API
 * to validate sessions via HTTP requests.
 */

import { createAuthClient } from "better-auth/client";
import type { UserRole } from "@/lib/permissions";
import { isValidRole } from "@/lib/permissions";

/**
 * Create an auth client for middleware use
 * Uses the same configuration as the server auth client
 */
export function getMiddlewareAuthClient(baseURL?: string) {
  return createAuthClient({
    baseURL: baseURL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  });
}

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
 * This function reads the session cookie and validates it
 * by calling the better-auth API endpoint.
 *
 * @param cookieHeader - The cookie header string from the request
 * @returns The session, user, and role if valid, null otherwise
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
    const authClient = getMiddlewareAuthClient();

    // Parse cookies from the header
    const cookies = parseCookies(cookieHeader);
    const sessionCookie = cookies["better-auth.session"];

    if (!sessionCookie) {
      return null;
    }

    // Create a request with the session cookie to get the session
    // better-auth's getSession will validate the cookie via its API
    const response = await authClient.getSession() as unknown as {
      data?: {
        session?: unknown;
        user?: {
          id: string;
          email: string;
          name: string;
          image?: string;
          createdAt: string;
          updatedAt: string;
          [key: string]: unknown;
        };
      };
    };

    // Check if we have valid session data in the response
    if (response?.data?.session && response?.data?.user) {
      // Extract role from customFields if available
      let role: UserRole = "staff"; // Default role

      const customFields = response.data.user as Record<string, unknown>;
      if (customFields.role && isValidRole(String(customFields.role))) {
        role = String(customFields.role) as UserRole;
      }

      return {
        session: response.data.session,
        user: response.data.user,
        role,
      };
    }

    return null;
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
    "/register",           // Registration page
    "/api/auth",           // Auth API routes
  ];

  // Public patterns that start with a prefix
  const publicPrefixes = [
    "/api/auth/",          // Auth API routes (nested)
  ];

  // Check exact matches
  if (publicPatterns.includes(pathname)) {
    return true;
  }

  // Check prefix matches
  if (publicPrefixes.some((prefix) => pathname.startsWith(prefix))) {
    return true;
  }

  // Check for public event pages: /events/[slug]
  // These are dynamic routes that should be public
  const eventSlugMatch = pathname.match(/^\/events\/[^/]+$/);
  if (eventSlugMatch) {
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