"use server"

import { db } from "@/lib/db"
import { globalFields, globalSettings, type FieldOption } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireRole } from "@/server/auth/rbac"
import { revalidatePath } from "next/cache"
import { globalFieldSchema, type GlobalFieldInput } from "@/lib/validations/settings"

const DEFAULT_TICKET_MESSAGE = "Save or screenshot this QR code to check in at the event."

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

// =============================================================================
// Global Settings
// =============================================================================

/**
 * Get global settings
 */
export async function getGlobalSettings() {
  try {
    const [settings] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.id, "default"))
      .limit(1)

    if (!settings) {
      return {
        id: "default",
        ticketMessage: DEFAULT_TICKET_MESSAGE,
        updatedAt: null,
        updatedBy: null,
      }
    }

    return settings
  } catch (error) {
    console.error("Error fetching settings:", error)
    return {
      id: "default",
      ticketMessage: DEFAULT_TICKET_MESSAGE,
      updatedAt: null,
      updatedBy: null,
    }
  }
}

/**
 * Get ticket message (public, no auth required)
 */
export async function getTicketMessage(): Promise<string> {
  try {
    const [settings] = await db
      .select({ ticketMessage: globalSettings.ticketMessage })
      .from(globalSettings)
      .where(eq(globalSettings.id, "default"))
      .limit(1)

    return settings?.ticketMessage || DEFAULT_TICKET_MESSAGE
  } catch {
    return DEFAULT_TICKET_MESSAGE
  }
}

/**
 * Update global settings
 */
export async function updateGlobalSettings(input: {
  ticketMessage?: string
}) {
  await requireRole("admin")

  try {
    const [existing] = await db
      .select()
      .from(globalSettings)
      .where(eq(globalSettings.id, "default"))
      .limit(1)

    if (existing) {
      const [updated] = await db
        .update(globalSettings)
        .set({
          ticketMessage: input.ticketMessage,
          updatedAt: new Date(),
        })
        .where(eq(globalSettings.id, "default"))
        .returning()

      revalidatePath("/admin/settings")
      revalidatePath("/ticket")
      return { success: true, settings: updated }
    } else {
      const [created] = await db
        .insert(globalSettings)
        .values({
          id: "default",
          ticketMessage: input.ticketMessage || DEFAULT_TICKET_MESSAGE,
        })
        .returning()

      revalidatePath("/admin/settings")
      revalidatePath("/ticket")
      return { success: true, settings: created }
    }
  } catch (error) {
    console.error("Error updating settings:", error)
    return { success: false, error: "Failed to update settings" }
  }
}