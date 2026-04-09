/**
 * Middleware helpers for session validation
 *
 * These functions are designed to be used in Next.js middleware
 * where we need to validate sessions without making database calls directly.
 *
 * The middleware runs on the edge, so we use the better-auth API
 * to validate sessions via HTTP requests.
 */

import { createAuthClient } from "better-auth/client";

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
 * Validate session from cookies in middleware
 *
 * This function reads the session cookie and validates it
 * by calling the better-auth API endpoint.
 *
 * @param cookieHeader - The cookie header string from the request
 * @returns The session and user if valid, null otherwise
 */
export async function validateSessionFromCookies(
  cookieHeader: string | null
): Promise<{ session: any; user: any } | null> {
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
    const response = await authClient.getSession() as unknown as { data?: { session?: unknown; user?: unknown } };

    // Check if we have valid session data in the response
    if (response?.data?.session && response?.data?.user) {
      return {
        session: response.data.session,
        user: response.data.user,
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