/**
 * Auth module - Main export
 *
 * This module provides better-auth authentication for the EventFlow application.
 *
 * Environment variables (see .env.example):
 * - BETTER_AUTH_SECRET: Secret key for signing sessions (min 32 characters)
 * - NEXT_PUBLIC_APP_URL: The public URL of the application
 *
 * Usage:
 *
 * Server-side (Server Actions, API routes):
 *   import { auth } from "@/server/auth"
 *   import { getSession, requireSession, isAdmin } from "@/server/auth"
 *
 *   // Get current session
 *   const { session, user } = await getSession()
 *
 *   // Require authentication
 *   const { session, user } = await requireSession()
 *
 *   // Check role
 *   if (await isAdmin()) { ... }
 *
 * Client-side (React components):
 *   import { useSession, signIn, signOut } from "better-auth/react"
 *
 *   // In a client component
 *   const { data: session } = useSession()
 *
 * Database schema:
 * The auth system integrates with the existing users table:
 * - id: uuid (primary key)
 * - fullName: text (custom field)
 * - email: text (unique)
 * - role: enum (custom field: super_admin, admin, staff)
 * - createdAt: timestamp
 */

// Re-export core auth configuration
export { auth } from "../auth";
export type { Session, User } from "../auth";

// Re-export client helpers
export {
  authClient,
  getSession,
  requireSession,
  hasRole,
  isAdmin,
  isSuperAdmin,
} from "./client";
export type { AuthClient } from "./client";

// Re-export middleware helpers
export {
  getMiddlewareAuthClient,
  validateSessionFromCookies,
  isPathProtected,
  isPathPublic,
} from "./middleware-helpers";

// Re-export RBAC functions
export {
  getCurrentUser,
  requireRole,
  requirePermission,
} from "./rbac";