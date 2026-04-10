import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { createClient } from "@supabase/supabase-js";
import * as schema from "./schema";

// Database connection for Drizzle (used by better-auth)
const connectionString = process.env.DATABASE_URL!;

// Use a global variable to store the connection in development
// This prevents creating new connections on every hot reload
const globalForDb = globalThis as unknown as {
  queryClient: postgres.Sql | undefined;
};

// Create or reuse the connection pool
const queryClient = globalForDb.queryClient ?? postgres(connectionString, {
  prepare: false,
  // Limit connections to avoid exhausting the pool
  max: 10,
  // Idle timeout - close connections after 30 seconds of inactivity
  idle_timeout: 30,
  // Max lifetime - close connections after 30 minutes
  max_lifetime: 60 * 30,
  // Connect timeout
  connect_timeout: 10,
});

// Save to global in development to prevent multiple pools
if (process.env.NODE_ENV !== "production") {
  globalForDb.queryClient = queryClient;
}

export const db = drizzle(queryClient, { schema });

// Supabase client for storage and other Supabase features
// Only create if env vars are present (not required for auth)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// Supabase admin client with service role key (server-side only)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    : null;

// Export schema for convenience
export * from "./schema";