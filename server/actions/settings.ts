"use server"

import { db } from "@/lib/db"
import { globalFields, type FieldOption } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireRole } from "@/server/auth/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema for creating/updating a global field
export const globalFieldSchema = z.object({
  label: z.string().min(1, "Label is required").max(100, "Label too long"),
  fieldType: z.enum(["short_text", "long_text", "dropdown", "multiple_choice", "checkboxes"]),
  options: z.array(z.string()).optional(),
  isRequired: z.boolean().default(false),
})

export type GlobalFieldInput = z.infer<typeof globalFieldSchema>

// Convert string array to FieldOption array
function toFieldOptions(options: string[] | undefined): FieldOption[] | null {
  if (!options || options.length === 0) return null
  return options.map(opt => ({ label: opt, value: opt }))
}

/**
 * Get all global fields
 */
export async function getGlobalFields() {
  await requireRole("admin")

  try {
    const fields = await db
      .select({
        id: globalFields.id,
        label: globalFields.label,
        fieldType: globalFields.fieldType,
        options: globalFields.options,
        isRequired: globalFields.isRequired,
        createdAt: globalFields.createdAt,
      })
      .from(globalFields)
      .orderBy(desc(globalFields.createdAt))

    return fields
  } catch (error) {
    console.error("Error fetching global fields:", error)
    return []
  }
}

/**
 * Get fields data without auth (for build time)
 */
export async function getFieldsData() {
  try {
    const fields = await db
      .select({
        id: globalFields.id,
        label: globalFields.label,
        fieldType: globalFields.fieldType,
        options: globalFields.options,
        isRequired: globalFields.isRequired,
      })
      .from(globalFields)
      .orderBy(desc(globalFields.createdAt))

    return fields
  } catch (error) {
    console.error("Error fetching global fields:", error)
    return []
  }
}

/**
 * Create a new global field
 */
export async function createGlobalField(input: GlobalFieldInput) {
  await requireRole("admin")

  try {
    const validated = globalFieldSchema.parse(input)

    const [field] = await db
      .insert(globalFields)
      .values({
        label: validated.label,
        fieldType: validated.fieldType,
        options: toFieldOptions(validated.options),
        isRequired: validated.isRequired,
      })
      .returning()

    revalidatePath("/admin/settings/fields")

    return { success: true, field }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to create field" }
  }
}

/**
 * Update an existing global field
 */
export async function updateGlobalField(id: string, input: GlobalFieldInput) {
  await requireRole("admin")

  try {
    const validated = globalFieldSchema.parse(input)

    const [field] = await db
      .update(globalFields)
      .set({
        label: validated.label,
        fieldType: validated.fieldType,
        options: toFieldOptions(validated.options),
        isRequired: validated.isRequired,
      })
      .where(eq(globalFields.id, id))
      .returning()

    revalidatePath("/admin/settings/fields")

    return { success: true, field }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update field" }
  }
}

/**
 * Delete a global field
 */
export async function deleteGlobalField(id: string) {
  await requireRole("admin")

  try {
    await db.delete(globalFields).where(eq(globalFields.id, id))
    revalidatePath("/admin/settings/fields")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete field" }
  }
}