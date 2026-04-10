"use server"

import { db } from "@/lib/db"
import { user } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { getCurrentUser, requireRole } from "@/server/auth/rbac"
import { revalidatePath } from "next/cache"
import { addStaffSchema, updateRoleSchema, type AddStaffInput, type UpdateRoleInput } from "@/lib/validations/staff"
import { auth } from "@/server/auth"
import { headers } from "next/headers"

/**
 * Get all staff members (for admin)
 */
export async function getStaff() {
  await requireRole("admin")

  try {
    const staff = await db
      .select({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt))

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
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      })
      .from(user)
      .orderBy(desc(user.createdAt))

    return staff
  } catch (error) {
    console.error("Error fetching staff:", error)
    return []
  }
}

/**
 * Add a new staff member directly
 */
export async function addStaff(input: AddStaffInput) {
  await requireRole("admin")

  try {
    const validated = addStaffSchema.parse(input)

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, validated.email))
      .limit(1)

    if (existingUser) {
      return { success: false, error: "A user with this email already exists" }
    }

    // Use better-auth to create the user with password
    const requestHeaders = await headers()

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: validated.email,
          password: validated.password,
          name: validated.name,
        },
        headers: requestHeaders,
      })

      // Update the role after creation
      if (result.user) {
        await db
          .update(user)
          .set({ role: validated.role })
          .where(eq(user.id, result.user.id))
      }

      revalidatePath("/admin/settings/staff")

      return { success: true }
    } catch (signupError: unknown) {
      const err = signupError as { message?: string; body?: { message?: string } }
      return { success: false, error: err.body?.message || err.message || "Failed to create user" }
    }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, error: err.message || "Failed to add staff member" }
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

    const [updatedUser] = await db
      .update(user)
      .set({ role: validated.role, updatedAt: new Date() })
      .where(eq(user.id, validated.userId))
      .returning()

    revalidatePath("/admin/settings/staff")

    return { success: true, user: updatedUser }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, error: err.message || "Failed to update role" }
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

    await db.delete(user).where(eq(user.id, userId))

    revalidatePath("/admin/settings/staff")

    return { success: true }
  } catch (error: unknown) {
    const err = error as { message?: string }
    return { success: false, error: err.message || "Failed to remove staff" }
  }
}