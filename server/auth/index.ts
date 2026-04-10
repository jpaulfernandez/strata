/**
 * Auth module - Main export
 */

// Re-export core auth configuration
export { auth } from "../auth";
export type { Session, AuthUser } from "../auth";

// Re-export client helpers
export { authClient } from "./client";

// Re-export middleware helpers
export {
  validateSessionFromCookies,
  isPathProtected,
  isPathPublic,
} from "./middleware-rbac";

// Re-export RBAC functions
export {
  getSession,
  getCurrentUser,
  requireAuth,
  requireRole,
  requirePermission,
} from "./rbac";