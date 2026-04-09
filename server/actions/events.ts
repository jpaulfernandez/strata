"use server"

import { db } from "@/lib/db"
import {
  events,
  registrants,
  type Event,
  type NewEvent,
  type FormFieldConfig,
  type CustomQuestion,
} from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { requireRole } from "@/server/auth/rbac"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Validation schema for event slug
const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(100, "Slug too long")
  .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens")

// Validation schema for form fields
const fieldOptionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

const formFieldConfigSchema = z.object({
  id: z.string(),
  label: z.string().min(1, "Label is required"),
  fieldType: z.enum(["short_text", "long_text", "dropdown", "multiple_choice", "checkboxes"]),
  options: z.array(fieldOptionSchema).optional(),
  isRequired: z.boolean(),
})

const customQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(1, "Question is required"),
  fieldType: z.enum(["short_text", "long_text", "dropdown", "multiple_choice", "checkboxes"]),
  options: z.array(fieldOptionSchema).optional(),
  isRequired: z.boolean(),
})

// Main validation schema for event details
export const eventDetailsSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  slug: slugSchema,
  description: z.string().max(5000, "Description too long").optional(),
  location: z.string().max(200, "Location too long").optional(),
  eventDate: z.coerce.date().nullable().optional(),
  eventEndDate: z.coerce.date().nullable().optional(),
  coverImageUrl: z.string().url("Invalid URL").max(500, "URL too long").optional().or(z.literal("")),
  status: z.enum(["draft", "open", "closed"]).optional(),
  formFields: z.array(formFieldConfigSchema).optional(),
  customQuestions: z.array(customQuestionSchema).optional(),
})

export type EventDetailsInput = z.infer<typeof eventDetailsSchema>

/**
 * Get all events (requires admin role)
 */
export async function getEvents(): Promise<Event[]> {
  await requireRole("admin")

  try {
    const allEvents = await db
      .select()
      .from(events)
      .orderBy(desc(events.createdAt))

    return allEvents
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

/**
 * Get a single event by ID (requires admin role)
 */
export async function getEvent(id: string): Promise<Event | null> {
  await requireRole("admin")

  try {
    const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1)
    return event ?? null
  } catch (error) {
    console.error("Error fetching event:", error)
    return null
  }
}

/**
 * Get registrant count for an event (requires admin role)
 */
export async function getRegistrantCount(eventId: string): Promise<number> {
  await requireRole("admin")

  try {
    const [result] = await db
      .select({ count: count() })
      .from(registrants)
      .where(eq(registrants.eventId, eventId))

    return result?.count ?? 0
  } catch (error) {
    console.error("Error fetching registrant count:", error)
    return 0
  }
}

/**
 * Get an event by slug for public pages (no auth required)
 */
export async function getEventBySlug(slug: string): Promise<Event | null> {
  try {
    const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
    return event ?? null
  } catch (error) {
    console.error("Error fetching event by slug:", error)
    return null
  }
}

/**
 * Check if a slug is available
 * Optionally exclude an event ID (for updates)
 */
export async function isSlugAvailable(
  slug: string,
  excludeId?: string
): Promise<{ available: boolean }> {
  try {
    const [existing] = await db
      .select({ id: events.id })
      .from(events)
      .where(eq(events.slug, slug))
      .limit(1)

    if (!existing) {
      return { available: true }
    }

    // If excluding an ID, check if the found event is the one we're excluding
    if (excludeId && existing.id === excludeId) {
      return { available: true }
    }

    return { available: false }
  } catch (error) {
    console.error("Error checking slug availability:", error)
    return { available: false }
  }
}

/**
 * Create a new event (requires admin role)
 */
export async function createEvent(
  input: EventDetailsInput
): Promise<{ success: boolean; event?: Event; error?: string }> {
  const user = await requireRole("admin")

  try {
    const validated = eventDetailsSchema.parse(input)

    // Check slug availability
    const { available } = await isSlugAvailable(validated.slug)
    if (!available) {
      return { success: false, error: "Slug is already in use" }
    }

    // Prepare form fields and custom questions
    const formFields: FormFieldConfig[] | null = validated.formFields?.length
      ? (validated.formFields as FormFieldConfig[])
      : null
    const customQuestions: CustomQuestion[] | null = validated.customQuestions?.length
      ? (validated.customQuestions as CustomQuestion[])
      : null

    const [event] = await db
      .insert(events)
      .values({
        title: validated.title,
        slug: validated.slug,
        description: validated.description ?? null,
        location: validated.location ?? null,
        eventDate: validated.eventDate ?? null,
        eventEndDate: validated.eventEndDate ?? null,
        coverImageUrl: validated.coverImageUrl || null,
        status: validated.status ?? "draft",
        formFields,
        customQuestions,
        createdBy: user.id,
      })
      .returning()

    revalidatePath("/admin/events")

    return { success: true, event }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    const message = error instanceof Error ? error.message : "Failed to create event"
    return { success: false, error: message }
  }
}

/**
 * Update an existing event (requires admin role)
 */
export async function updateEvent(
  id: string,
  input: Partial<EventDetailsInput>
): Promise<{ success: boolean; event?: Event; error?: string }> {
  await requireRole("admin")

  try {
    const validated = eventDetailsSchema.partial().parse(input)

    // If slug is being updated, check availability
    if (validated.slug) {
      const { available } = await isSlugAvailable(validated.slug, id)
      if (!available) {
        return { success: false, error: "Slug is already in use" }
      }
    }

    // Build update object with only provided fields
    const updateData: Partial<NewEvent> = {
      updatedAt: new Date(),
    }

    if (validated.title !== undefined) updateData.title = validated.title
    if (validated.slug !== undefined) updateData.slug = validated.slug
    if (validated.description !== undefined) updateData.description = validated.description ?? null
    if (validated.location !== undefined) updateData.location = validated.location ?? null
    if (validated.eventDate !== undefined) updateData.eventDate = validated.eventDate ?? null
    if (validated.eventEndDate !== undefined) updateData.eventEndDate = validated.eventEndDate ?? null
    if (validated.coverImageUrl !== undefined) updateData.coverImageUrl = validated.coverImageUrl || null
    if (validated.status !== undefined) updateData.status = validated.status
    if (validated.formFields !== undefined) {
      updateData.formFields = validated.formFields?.length
        ? (validated.formFields as FormFieldConfig[])
        : null
    }
    if (validated.customQuestions !== undefined) {
      updateData.customQuestions = validated.customQuestions?.length
        ? (validated.customQuestions as CustomQuestion[])
        : null
    }

    const [event] = await db.update(events).set(updateData).where(eq(events.id, id)).returning()

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    revalidatePath("/admin/events")
    revalidatePath(`/admin/events/${id}`)
    revalidatePath(`/events/${event.slug}`)

    return { success: true, event }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    const message = error instanceof Error ? error.message : "Failed to update event"
    return { success: false, error: message }
  }
}

/**
 * Delete an event (requires admin role)
 */
export async function deleteEvent(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireRole("admin")

  try {
    const [deleted] = await db.delete(events).where(eq(events.id, id)).returning()

    if (!deleted) {
      return { success: false, error: "Event not found" }
    }

    revalidatePath("/admin/events")

    return { success: true }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete event"
    return { success: false, error: message }
  }
}

/**
 * Duplicate an event as a draft (requires admin role)
 */
export async function duplicateEvent(
  id: string
): Promise<{ success: boolean; event?: Event; error?: string }> {
  const user = await requireRole("admin")

  try {
    const [original] = await db.select().from(events).where(eq(events.id, id)).limit(1)

    if (!original) {
      return { success: false, error: "Event not found" }
    }

    // Generate a unique slug for the duplicate
    let newSlug = `${original.slug}-copy`
    let counter = 1
    while (!(await isSlugAvailable(newSlug)).available) {
      newSlug = `${original.slug}-copy-${counter}`
      counter++
    }

    const [event] = await db
      .insert(events)
      .values({
        title: `${original.title} (Copy)`,
        slug: newSlug,
        description: original.description,
        location: original.location,
        eventDate: original.eventDate,
        eventEndDate: original.eventEndDate,
        coverImageUrl: original.coverImageUrl,
        status: "draft", // Always create duplicates as draft
        formFields: original.formFields,
        customQuestions: original.customQuestions,
        createdBy: user.id,
      })
      .returning()

    revalidatePath("/admin/events")

    return { success: true, event }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to duplicate event"
    return { success: false, error: message }
  }
}

/**
 * Toggle event status: draft -> open -> closed -> draft (requires admin role)
 */
export async function toggleEventStatus(
  id: string
): Promise<{ success: boolean; event?: Event; error?: string }> {
  await requireRole("admin")

  try {
    const [current] = await db.select().from(events).where(eq(events.id, id)).limit(1)

    if (!current) {
      return { success: false, error: "Event not found" }
    }

    // Cycle through statuses: draft -> open -> closed -> draft
    const statusCycle: Record<string, "draft" | "open" | "closed"> = {
      draft: "open",
      open: "closed",
      closed: "draft",
    }

    const newStatus = statusCycle[current.status] ?? "draft"

    const [event] = await db
      .update(events)
      .set({
        status: newStatus,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning()

    revalidatePath("/admin/events")
    revalidatePath(`/admin/events/${id}`)
    revalidatePath(`/events/${event?.slug}`)

    return { success: true, event }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to toggle event status"
    return { success: false, error: message }
  }
}