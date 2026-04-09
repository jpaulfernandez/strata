/**
 * Permission constants and role hierarchy for Role-Based Access Control (RBAC)
 *
 * This file defines the permission system for EventFlow.
 * Roles are hierarchical: super_admin > admin > staff
 */

// User role types - must match the user_role enum in the database
export type UserRole = "super_admin" | "admin" | "staff";

// Permission definitions - each permission represents a specific action
export type Permission =
  // Dashboard permissions
  | "dashboard:view"
  | "dashboard:view_own"

  // Event permissions
  | "events:create"
  | "events:edit"
  | "events:edit_any"
  | "events:delete"
  | "events:view"
  | "events:view_any"

  // Registrant permissions
  | "registrants:view"
  | "registrants:view_any"
  | "registrants:checkin"

  // Settings permissions
  | "settings:manage"

  // Staff management permissions
  | "staff:manage"
  | "staff:edit_role"

  // Data export permissions
  | "data:export";

// Role hierarchy - defines which roles inherit permissions from lower roles
export const roleHierarchy: Record<UserRole, UserRole[]> = {
  super_admin: [],
  admin: ["staff"],
  staff: [],
};

// Permission matrix - which roles have which permissions
// Each role automatically has permissions from roles below them in the hierarchy
const permissionMatrix: Record<UserRole, Permission[]> = {
  super_admin: [
    // Dashboard - full access
    "dashboard:view",
    "dashboard:view_own",

    // Events - full access
    "events:create",
    "events:edit",
    "events:edit_any",
    "events:delete",
    "events:view",
    "events:view_any",

    // Registrants - full access
    "registrants:view",
    "registrants:view_any",
    "registrants:checkin",

    // Settings - full access
    "settings:manage",

    // Staff - full access
    "staff:manage",
    "staff:edit_role",

    // Data export - full access
    "data:export",
  ],

  admin: [
    // Dashboard - full access
    "dashboard:view",

    // Events - can create and edit (not delete)
    "events:create",
    "events:edit",
    "events:view",
    "events:view_any",

    // Registrants - can view and check-in
    "registrants:view",
    "registrants:view_any",
    "registrants:checkin",

    // Settings - can manage
    "settings:manage",

    // Data export - can export
    "data:export",
  ],

  staff: [
    // Dashboard - only own events
    "dashboard:view_own",

    // Events - can only view
    "events:view",

    // Registrants - can only view assigned events and check-in
    "registrants:view",
    "registrants:checkin",
  ],
};

/**
 * Get all permissions for a given role, including inherited permissions
 * from roles below in the hierarchy
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  const directPermissions = permissionMatrix[role] || [];
  const inheritedRoles = roleHierarchy[role];

  // Collect permissions from inherited roles
  const inheritedPermissions = inheritedRoles.flatMap((r) =>
    getPermissionsForRole(r)
  );

  // Combine and deduplicate permissions
  const allPermissions = new Set<Permission>();
  directPermissions.forEach((p) => allPermissions.add(p));
  inheritedPermissions.forEach((p) => allPermissions.add(p));
  return Array.from(allPermissions);
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = getPermissionsForRole(role);
  return permissions.includes(permission);
}

/**
 * Check if a role meets the minimum required role
 * Uses hierarchy to determine if the user's role is equal to or higher than required
 */
export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleOrder: UserRole[] = ["staff", "admin", "super_admin"];
  const userRoleIndex = roleOrder.indexOf(userRole);
  const requiredRoleIndex = roleOrder.indexOf(requiredRole);

  return userRoleIndex <= requiredRoleIndex;
}

/**
 * Require a specific minimum role - returns the role if valid, otherwise throws
 */
export function requireMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): UserRole {
  if (!hasMinimumRole(userRole, requiredRole)) {
    throw new Error(
      `Access denied. Required role: ${requiredRole}. Your role: ${userRole}`
    );
  }
  return userRole;
}

/**
 * Get a human-readable description for a permission
 */
export function getPermissionDescription(permission: Permission): string {
  const descriptions: Record<Permission, string> = {
    "dashboard:view": "View the main dashboard with all events",
    "dashboard:view_own": "View dashboard with only assigned events",
    "events:create": "Create new events",
    "events:edit": "Edit events you created",
    "events:edit_any": "Edit any event",
    "events:delete": "Delete events",
    "events:view": "View events you have access to",
    "events:view_any": "View all events regardless of ownership",
    "registrants:view": "View registrants for events you have access to",
    "registrants:view_any": "View all registrants across all events",
    "registrants:checkin": "Check in registrants",
    "settings:manage": "Manage application settings",
    "staff:manage": "Manage staff accounts",
    "staff:edit_role": "Edit staff role assignments",
    "data:export": "Export event and registrant data",
  };

  return descriptions[permission] || "Unknown permission";
}

/**
 * Get all available permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  return {
    dashboard: ["dashboard:view", "dashboard:view_own"],
    events: [
      "events:create",
      "events:edit",
      "events:edit_any",
      "events:delete",
      "events:view",
      "events:view_any",
    ],
    registrants: [
      "registrants:view",
      "registrants:view_any",
      "registrants:checkin",
    ],
    settings: ["settings:manage"],
    staff: ["staff:manage", "staff:edit_role"],
    data: ["data:export"],
  };
}

/**
 * Validate that a role string is a valid UserRole
 */
export function isValidRole(role: string): role is UserRole {
  return ["super_admin", "admin", "staff"].includes(role);
}