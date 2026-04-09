/**
 * Role-Based Access Control (RBAC) for Server-Side Operations
 *
 * This module provides server-side functions for checking permissions
 * and enforcing access control in server actions, API routes, and components.
 */

import { auth } from "@/server/auth";
import { db } from "@/lib/db";
import { users, type User } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  type Permission,
  type UserRole,
  hasPermission,
  hasMinimumRole,
  isValidRole,
} from "@/lib/permissions";

/**
 * Get the current user with their role from the database
 * Use this in server actions and API routes to get the authenticated user
 */
export async function getCurrentUser(): Promise<
  (User & { role: UserRole }) | null
> {
  const session = await auth.api.getSession({
    headers: new Headers(),
  });

  if (!session?.user) {
    return null;
  }

  // Fetch the user from the database to get the full role
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  if (!user) {
    return null;
  }

  // Validate and return the user with their role
  return {
    ...user,
    role: isValidRole(user.role) ? user.role : "staff",
  };
}

/**
 * Require a user to be authenticated
 * Throws an error if no user is logged in
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
 * Throws an error if the user doesn't have the required role
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
 * Throws an error if the user doesn't have the permission
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

/**
 * Check if a user can access a specific event
 * Staff can only access events they created or are assigned to
 */
export async function canAccessEvent(
  userId: string,
  eventId: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // super_admin and admin can access any event
  if (hasMinimumRole(user.role, "admin")) {
    return true;
  }

  // For staff, check if they created the event
  // This would need to query the events table
  // For now, return false - staff need explicit assignment
  const { events } = await import("@/lib/db/schema");
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    return false;
  }

  // Staff can access events they created
  return event.createdBy === userId;
}

/**
 * Require that the user can access a specific event
 * Throws an error if access is denied
 */
export async function requireEventAccess(eventId: string): Promise<void> {
  const user = await requireAuth();

  // super_admin and admin can access any event
  if (hasMinimumRole(user.role, "admin")) {
    return;
  }

  // For staff, check if they created the event
  const { events } = await import("@/lib/db/schema");
  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  if (!event) {
    throw new Error("Event not found");
  }

  if (event.createdBy !== user.id) {
    throw new Error("You don't have access to this event");
  }
}

/**
 * Get accessible events for the current user
 * Staff only sees events they created, admins see all
 */
export async function getAccessibleEventIds(): Promise<string[]> {
  const user = await requireAuth();

  const { events } = await import("@/lib/db/schema");

  if (hasMinimumRole(user.role, "admin")) {
    // Admin and super_admin can see all events
    const allEvents = await db.select({ id: events.id }).from(events);
    return allEvents.map((e) => e.id);
  }

  // Staff only sees events they created
  const staffEvents = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.createdBy, user.id));

  return staffEvents.map((e) => e.id);
}

/**
 * Update a user's role (for admin functions)
 */
export async function updateUserRole(
  targetUserId: string,
  newRole: UserRole
): Promise<User & { role: UserRole }> {
  // First require admin permissions
  await requirePermission("staff:edit_role");

  // Validate the role
  if (!isValidRole(newRole)) {
    throw new Error(`Invalid role: ${newRole}`);
  }

  // Update the user's role
  const [updatedUser] = await db
    .update(users)
    .set({ role: newRole })
    .where(eq(users.id, targetUserId))
    .returning();

  if (!updatedUser) {
    throw new Error("User not found");
  }

  return {
    ...updatedUser,
    role: newRole,
  };
}

/**
 * Create a role guard function for a specific permission
 * Useful for creating reusable guards in server actions
 */
export function createPermissionGuard(permission: Permission) {
  return async (): Promise<User & { role: UserRole }> => {
    return requirePermission(permission);
  };
}

/**
 * Create a role guard function for a specific minimum role
 * Useful for creating reusable guards in server actions
 */
export function createRoleGuard(requiredRole: UserRole) {
  return async (): Promise<User & { role: UserRole }> => {
    return requireRole(requiredRole);
  };
}

// Type exports
export type { UserRole, Permission } from "@/lib/permissions";