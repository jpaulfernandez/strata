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

async function addGlobalSettings() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set. Check your .env file.");
    process.exit(1);
  }

  const sql = postgres(connectionString, { prepare: false });

  try {
    // Check if table exists
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'global_settings'
      ) as exists
    `;

    if (result[0]?.exists) {
      console.log("global_settings table already exists.");
      return;
    }

    console.log("Creating global_settings table...");

    await sql`
      CREATE TABLE global_settings (
        id TEXT PRIMARY KEY DEFAULT 'default',
        ticket_message TEXT DEFAULT 'Save or screenshot this QR code to check in at the event.',
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        updated_by TEXT REFERENCES "user"(id) ON DELETE SET NULL
      )
    `;

    console.log("Successfully created global_settings table.");
  } catch (error) {
    console.error("Migration failed:", error);
    await sql.end();
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addGlobalSettings();