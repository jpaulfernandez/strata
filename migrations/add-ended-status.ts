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

async function addEndedStatus() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set. Check your .env file.");
    process.exit(1);
  }

  const sql = postgres(connectionString, { prepare: false });

  try {
    console.log("Adding 'ended' to event_status enum...");

    // Check if 'ended' already exists
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'ended'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'event_status')
      ) as exists
    `;

    if (result[0]?.exists) {
      console.log("'ended' already exists in event_status enum.");
    } else {
      // Add 'ended' value to the enum
      await sql`ALTER TYPE event_status ADD VALUE 'ended'`;
      console.log("Successfully added 'ended' to event_status enum.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
    await sql.end();
    process.exit(1);
  } finally {
    await sql.end();
  }
}

addEndedStatus();