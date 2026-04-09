import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

/**
 * Environment variables required:
 * - BETTER_AUTH_SECRET: Secret key for signing sessions (min 32 characters)
 * - NEXT_PUBLIC_APP_URL: The public URL of the application
 *
 * Example .env configuration:
 * BETTER_AUTH_SECRET=your-secret-key-at-least-32-characters-long
 * NEXT_PUBLIC_APP_URL=http://localhost:3000
 */

export const auth = betterAuth({
  // Email/password authentication provider
  emailAndPassword: {
    enabled: true,
    // Require email verification (set to false to disable)
    requireEmailVerification: false,
  },

  // Session configuration - cookie-based sessions
  session: {
    // Cookie name for the session token
    cookieName: "better-auth.session",
    // Cookie expires in 30 days
    expiresIn: 60 * 60 * 24 * 30, // 30 days in seconds
    // Cookie update after 24 hours - refresh session periodically
    updateAge: 60 * 60 * 24, // 24 hours in seconds
    // Store session in cookie (true) or database (false)
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },

  // Database adapter - using Drizzle with PostgreSQL
  database: drizzleAdapter(db, {
    provider: "pg",
    // Map better-auth tables to custom names if needed
    // Tables will be created automatically: users, sessions, accounts, verifications
  }),

  // Custom user fields - map to existing users table columns
  customFields: {
    // Full name field - maps to users.fullName
    fullName: {
      type: "string",
      required: true,
    },
    // Role field - maps to users.role
    role: {
      type: "string",
      required: true,
      defaultValue: "admin",
    },
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
export type User = typeof auth.$Infer.Session.user;