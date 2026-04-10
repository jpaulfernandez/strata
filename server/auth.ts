import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import { user, session, account, verification } from "@/lib/db/schema";

/**
 * Better Auth Configuration
 *
 * Environment variables required:
 * - BETTER_AUTH_SECRET: Secret key for signing sessions (min 32 characters)
 * - NEXT_PUBLIC_APP_URL: The public URL of the application
 */

export const auth = betterAuth({
  // Database adapter - using Drizzle with PostgreSQL
  // Pass the tables directly to avoid table name conflicts
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),

  // Email/password authentication provider
  emailAndPassword: {
    enabled: true,
    // Require email verification (set to true in production)
    requireEmailVerification: false,
    // Auto-login after signup
    autoSignIn: true,
  },

  // Session configuration - cookie-based sessions
  session: {
    // Cookie name for the session token
    cookieName: "better-auth.session_token",
    // Cookie expires in 30 days
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    // Update session after 24 hours - refresh session periodically
    updateAge: 60 * 60 * 24, // 24 hours in seconds
    // Cache session in cookie for 5 minutes
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Advanced settings
  advanced: {
    // Use secure cookies in production
    useSecureCookies: process.env.NODE_ENV === "production",
    // Generate IDs for users
    generateId: () => crypto.randomUUID(),
  },

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ],

  // Secret key for signing tokens
  secret: process.env.BETTER_AUTH_SECRET || "",

  // App base URL
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
});

// Type definitions for the authenticated user
export type Session = typeof auth.$Infer.Session.session;
export type AuthUser = typeof auth.$Infer.Session.user;