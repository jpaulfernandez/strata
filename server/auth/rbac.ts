/**
 * Role-Based Access Control (RBAC) for Server-Side Operations
 */

import { auth } from "@/server/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { user, type User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  type Permission,
  type UserRole,
  hasPermission,
  hasMinimumRole,
  isValidRole,
} from "@/lib/permissions";

/**
 * Get the current session from better-auth
 */
export async function getSession() {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
      headers: requestHeaders,
    });
    return session;
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
}

/**
 * Get the current user with their role from the database
 */
export async function getCurrentUser(): Promise<
  (User & { role: UserRole }) | null
> {
  try {
    const session = await getSession();

    if (!session?.user) {
      return null;
    }

    // Fetch the user from the database to get the full role
    const [dbUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!dbUser) {
      return null;
    }

    return {
      ...dbUser,
      role: isValidRole(dbUser.role) ? dbUser.role : "staff",
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Require a user to be authenticated
 */
export async function requireAuth(): Promise<User & { role: UserRole }> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Require a specific minimum role
 */
export async function requireRole(
  requiredRole: UserRole
): Promise<User & { role: UserRole }> {
  const user = await requireAuth();

  if (!hasMinimumRole(user.role, requiredRole)) {
    throw new Error(
      `Access denied. Required role: ${requiredRole}. Your role: ${user.role}`
    );
  }

  return user;
}

/**
 * Check if the current user has a specific permission
 */
export async function hasPermissionAsync(
  permission: Permission
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  return hasPermission(user.role, permission);
}

/**
 * Require a specific permission
 */
export async function requirePermission(
  permission: Permission
): Promise<User & { role: UserRole }> {
  const user = await requireAuth();

  if (!hasPermission(user.role, permission)) {
    throw new Error(
      `Access denied. Required permission: ${permission}. Your role: ${user.role}`
    );
  }

  return user;
}

// Type exports
export type { UserRole, Permission } from "@/lib/permissions";