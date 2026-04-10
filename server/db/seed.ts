// Load env first
import * as fs from "fs";
import * as path from "path";

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

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../lib/db/schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const queryClient = postgres(connectionString, { prepare: false });
const db = drizzle(queryClient, { schema });

const { user, account, globalFields } = schema;

const ADMIN_EMAIL = "admin@strata.local";
const ADMIN_PASSWORD = "Strata2024!";
const ADMIN_NAME = "Admin";

// Common event registration fields
const COMMON_FIELDS: Array<{
  label: string
  fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"
  isRequired: boolean
  options?: { label: string; value: string }[]
}> = [
  {
    label: "Contact Number",
    fieldType: "short_text" as const,
    isRequired: false,
  },
  {
    label: "Organization",
    fieldType: "short_text" as const,
    isRequired: false,
  },
  {
    label: "Affiliation",
    fieldType: "short_text" as const,
    isRequired: false,
  },
];

/**
 * Create admin user via signup API
 */
async function seed() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Check if admin already exists
  const existing = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL));

  if (existing.length > 0) {
    console.log("Admin user already exists. Deleting...");
    // Delete account first (foreign key)
    await db.delete(account).where(eq(account.userId, existing[0].id));
    await db.delete(user).where(eq(user.email, ADMIN_EMAIL));
  }

  console.log("Creating admin user via signup API...");

  try {
    const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Origin": baseUrl,
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Signup failed:", result);
      console.log("\nPlease make sure the dev server is running: npm run dev");
      console.log("Then run this seed script again.");
      process.exit(1);
    }

    // Update role to super_admin
    const [newUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, ADMIN_EMAIL))
      .limit(1);

    if (newUser) {
      await db.update(user).set({ role: "super_admin" }).where(eq(user.id, newUser.id));
    }

    console.log("\n✅ Admin user created successfully!");
    console.log("─────────────────────────────────");
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log(`Role: super_admin`);
    console.log("─────────────────────────────────\n");

    // Seed global fields
    console.log("Seeding global fields...");

    // Check if fields already exist
    const existingFields = await db.select().from(globalFields);
    if (existingFields.length > 0) {
      console.log("Global fields already exist. Skipping...");
    } else {
      // Insert common fields
      for (const field of COMMON_FIELDS) {
        await db.insert(globalFields).values({
          label: field.label,
          fieldType: field.fieldType,
          options: field.options ?? null,
          isRequired: field.isRequired,
        });
      }
      console.log(`✅ Created ${COMMON_FIELDS.length} global fields\n`);
    }
  } catch (error) {
    console.error("Error:", error);
    console.log("\nMake sure the dev server is running: npm run dev");
    process.exit(1);
  }
}

seed()
  .then(async () => {
    await queryClient.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await queryClient.end();
    process.exit(1);
  });