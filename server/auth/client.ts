import { createAuthClient } from "better-auth/react";

/**
 * Auth client for client-side authentication
 *
 * Use this in client components for:
 * - signIn.email()
 * - signUp.email()
 * - signOut()
 * - useSession()
 *
 * Example:
 * ```tsx
 * "use client";
 * import { authClient } from "@/server/auth/client";
 *
 * // Sign in
 * const result = await authClient.signIn.email({ email, password });
 *
 * // Sign up
 * const result = await authClient.signUp.email({ email, password, name });
 *
 * // Sign out
 * await authClient.signOut();
 *
 * // Get session (in component)
 * const { data } = authClient.useSession();
 * ```
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});