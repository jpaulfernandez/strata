import postgres from "postgres";
import * as fs from "fs";
import * as path from "path";

// Simple .env loader
function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf-8");
    envContent.split("\n").forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("#")) {
        const [key, ...valueParts] = trimmedLine.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim().replace(/^["']|["']$/g, "");
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = value;
          }
        }
      }
    });
  }
}

loadEnv();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set. Check your .env file.");
    process.exit(1);
  }

  const sql = postgres(connectionString, { prepare: false });

  try {
    console.log("Dropping existing tables...");

    // Drop tables first (order matters for foreign keys)
    await sql`DROP TABLE IF EXISTS vip_notifications CASCADE`;
    await sql`DROP TABLE IF EXISTS checkins CASCADE`;
    await sql`DROP TABLE IF EXISTS registrants CASCADE`;
    await sql`DROP TABLE IF EXISTS global_fields CASCADE`;
    await sql`DROP TABLE IF EXISTS events CASCADE`;
    await sql`DROP TABLE IF EXISTS users CASCADE`;
    await sql`DROP TABLE IF EXISTS account CASCADE`;
    await sql`DROP TABLE IF EXISTS session CASCADE`;
    await sql`DROP TABLE IF EXISTS verification CASCADE`;
    await sql`DROP TABLE IF EXISTS "user" CASCADE`;

    console.log("Dropping existing enums...");
    await sql`DROP TYPE IF EXISTS user_role CASCADE`;
    await sql`DROP TYPE IF EXISTS event_status CASCADE`;
    await sql`DROP TYPE IF EXISTS checkin_method CASCADE`;
    await sql`DROP TYPE IF EXISTS field_type CASCADE`;

    console.log("Creating enums...");
    await sql`CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'staff')`;
    await sql`CREATE TYPE event_status AS ENUM ('draft', 'open', 'closed')`;
    await sql`CREATE TYPE checkin_method AS ENUM ('qr', 'manual_email')`;
    await sql`CREATE TYPE field_type AS ENUM ('short_text', 'long_text', 'dropdown', 'multiple_choice', 'checkboxes')`;

    console.log("Creating better-auth tables...");

    // User table
    await sql`
      CREATE TABLE "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        role user_role DEFAULT 'admin' NOT NULL
      )
    `;

    // Session table
    await sql`
      CREATE TABLE "session" (
        id TEXT PRIMARY KEY,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      )
    `;

    // Account table
    await sql`
      CREATE TABLE "account" (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP WITH TIME ZONE,
        refresh_token_expires_at TIMESTAMP WITH TIME ZONE,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Verification table
    await sql`
      CREATE TABLE "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    console.log("Creating application tables...");

    // Events table
    await sql`
      CREATE TABLE events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        slug TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        location TEXT,
        event_date TIMESTAMP WITH TIME ZONE,
        event_end_date TIMESTAMP WITH TIME ZONE,
        status event_status DEFAULT 'draft' NOT NULL,
        form_fields JSONB,
        custom_questions JSONB,
        created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Registrants table
    await sql`
      CREATE TABLE registrants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        qr_token TEXT UNIQUE NOT NULL,
        is_vip BOOLEAN DEFAULT FALSE NOT NULL,
        checked_in BOOLEAN DEFAULT FALSE NOT NULL,
        checked_in_at TIMESTAMP WITH TIME ZONE,
        checked_in_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        form_data JSONB,
        registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    // Checkins table
    await sql`
      CREATE TABLE checkins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        scanned_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        method checkin_method NOT NULL
      )
    `;

    // VIP Notifications table
    await sql`
      CREATE TABLE vip_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
        registrant_id UUID NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
        triggered_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        acknowledged BOOLEAN DEFAULT FALSE NOT NULL,
        acknowledged_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        acknowledged_at TIMESTAMP WITH TIME ZONE
      )
    `;

    // Global Fields table
    await sql`
      CREATE TABLE global_fields (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label TEXT NOT NULL,
        field_type field_type NOT NULL,
        options JSONB,
        is_required BOOLEAN DEFAULT FALSE NOT NULL,
        created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      )
    `;

    console.log("Creating indexes...");
    await sql`CREATE INDEX idx_session_token ON "session"(token)`;
    await sql`CREATE INDEX idx_session_user_id ON "session"(user_id)`;
    await sql`CREATE INDEX idx_account_user_id ON "account"(user_id)`;
    await sql`CREATE INDEX idx_events_slug ON events(slug)`;
    await sql`CREATE INDEX idx_events_status ON events(status)`;
    await sql`CREATE INDEX idx_registrants_event_id ON registrants(event_id)`;
    await sql`CREATE INDEX idx_registrants_qr_token ON registrants(qr_token)`;

    console.log("Migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    await sql.end();
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigration();