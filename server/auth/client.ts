import { createAuthClient } from "better-auth/client";
import type { Session, User } from "../auth";

/**
 * Client-side auth helpers using better-auth's createAuthClient
 *
 * This client is used for server-side operations that need auth context.
 * For client-side React components, use better-auth/react instead:
 *
 *   import { useSession } from "better-auth/react"
 *
 * Example usage in server actions:
 *   import { auth } from "@/server/auth"
 *   import { authClient } from "@/server/auth/client"
 *
 *   const session = await authClient.getSession()
 */

/**
 * Create a configured server client instance
 * This can be used in Server Actions and API routes
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

/**
 * Type-safe client for session management
 * Use this in server contexts (Server Actions, API routes, Middleware)
 */
export type AuthClient = typeof authClient;

/**
 * Helper to get the current session from the client
 * Used in Server Actions to verify authentication
 */
export async function getSession(): Promise<{ session: Session | null; user: User | null }> {
  try {
    const result = await authClient.getSession() as any;
    return {
      session: result.session as Session | null,
      user: result.user as User | null,
    };
  } catch {
    return { session: null, user: null };
  }
}

/**
 * Helper to require a valid session
 * Throws an error if no valid session exists
 */
export async function requireSession(): Promise<{ session: Session; user: User }> {
  const { session, user } = await getSession();

  if (!session || !user) {
    throw new Error("Unauthorized: No valid session");
  }

  return { session, user };
}

/**
 * Helper to check if the current user has a specific role
 */
export async function hasRole(requiredRole: string): Promise<boolean> {
  const { user } = await getSession();

  if (!user) {
    return false;
  }

  // Check if user has the required role or is a super_admin
  const userRole = (user as any).role;
  return userRole === requiredRole || userRole === "super_admin";
}

/**
 * Helper to check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole("admin");
}

/**
 * Helper to check if the current user is a super_admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  return hasRole("super_admin");
}

// Re-export session and user types for convenience
export type { Session, User };