"use server"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getCurrentUser, requireRole } from "@/server/auth/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import bcrypt from "bcrypt"

// Schema for inviting a new staff member
export const inviteStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(1, "Name is required").max(100, "Name too long"),
  role: z.enum(["admin", "staff"]),
})

// Schema for updating a staff member's role
export const updateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["admin", "staff"]),
})

export type InviteStaffInput = z.infer<typeof inviteStaffSchema>
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>

/**
 * Get all staff members (for admin)
 */
export async function getStaff() {
  await requireRole("admin")

  try {
    const staff = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    return staff
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

/**
 * Get staff data without auth (for build time)
 */
export async function getStaffData() {
  try {
    const staff = await db
      .select({
        id: users.id,
        email: users.email,
        fullName: users.fullName,
        role: users.role,
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    return staff
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

/**
 * Invite a new staff member
 */
export async function inviteStaff(input: InviteStaffInput) {
  await requireRole("admin")

  try {
    const validated = inviteStaffSchema.parse(input)

    const tempPassword = Math.random().toString(36).slice(-8)
    const hashedPassword = await bcrypt.hash(tempPassword, 10)

    const [user] = await db
      .insert(users)
      .values({
        email: validated.email,
        fullName: validated.fullName,
        password: hashedPassword,
        role: validated.role,
      })
      .returning()

    revalidatePath("/admin/settings/staff")

    return { success: true, user, tempPassword }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to invite staff" }
  }
}

/**
 * Update a staff member's role
 */
export async function updateStaffRole(input: UpdateRoleInput) {
  const currentUser = await getCurrentUser()
  await requireRole("admin")

  try {
    const validated = updateRoleSchema.parse(input)

    if (validated.userId === currentUser?.id) {
      return { success: false, error: "You cannot change your own role" }
    }

    const [user] = await db
      .update(users)
      .set({ role: validated.role })
      .where(eq(users.id, validated.userId))
      .returning()

    revalidatePath("/admin/settings/staff")

    return { success: true, user }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update role" }
  }
}

/**
 * Remove a staff member
 */
export async function removeStaff(userId: string) {
  const currentUser = await getCurrentUser()
  await requireRole("admin")

  try {
    if (userId === currentUser?.id) {
      return { success: false, error: "You cannot remove yourself" }
    }

    await db.delete(users).where(eq(users.id, userId))

    revalidatePath("/admin/settings/staff")

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove staff" }
  }
}