import { db } from "../../lib/db";
import { users } from "../../lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const ADMIN_EMAIL = "admin@eventflow.local";
const ADMIN_PASSWORD = "EventFlow2024!";
const ADMIN_FULL_NAME = "Admin";
const ADMIN_ROLE = "super_admin" as const;

/**
 * Seed script to initialize the first admin user
 *
 * Default credentials:
 * - Email: admin@eventflow.local
 * - Password: EventFlow2024!
 * - Role: super_admin (first user gets super_admin role)
 */
async function seed() {
  console.log("Checking for existing admin user...");

  // Check if admin user already exists
  const existingAdmin = await db
    .select()
    .from(users)
    .where(eq(users.email, ADMIN_EMAIL))
    .limit(1);

  if (existingAdmin.length > 0) {
    console.log(`Admin user with email ${ADMIN_EMAIL} already exists.`);
    console.log(`User ID: ${existingAdmin[0].id}`);
    console.log(`Role: ${existingAdmin[0].role}`);
    return;
  }

  // Hash the password
  console.log("Hashing password...");
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  // Create the admin user
  console.log("Creating admin user...");
  const [newAdmin] = await db
    .insert(users)
    .values({
      fullName: ADMIN_FULL_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: ADMIN_ROLE,
    })
    .returning();

  console.log("Admin user created successfully!");
  console.log(`- ID: ${newAdmin.id}`);
  console.log(`- Email: ${newAdmin.email}`);
  console.log(`- Full Name: ${newAdmin.fullName}`);
  console.log(`- Role: ${newAdmin.role}`);
  console.log(`- Created At: ${newAdmin.createdAt}`);
}

seed()
  .then(() => {
    console.log("Seed completed successfully.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });