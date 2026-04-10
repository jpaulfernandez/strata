"use server"

import { db } from "@/lib/db"
import { registrants, events, type Registrant, type Event } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { registrationSchema, type RegistrationInput } from "@/lib/validations/registration"
import { z } from "zod"
import { randomUUID } from "crypto"
import { sendConfirmationEmail } from "@/server/email"
import { getDefaultEmailTemplate } from "@/server/actions/settings"

/**
 * Register a new attendee for an event (public - no auth required)
 */
export async function registerForEvent(
  eventId: string,
  input: RegistrationInput
): Promise<{ success: boolean; qrToken?: string; registrant?: Registrant; error?: string }> {
  try {
    const validated = registrationSchema.parse(input)

    // Check if event exists and is open for registration
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, eventId))
      .limit(1)

    if (!event) {
      return { success: false, error: "Event not found" }
    }

    if (event.status !== "open") {
      return { success: false, error: "Registration is closed for this event" }
    }

    // Check for duplicate email
    const duplicate = await checkDuplicateEmail(eventId, validated.email)
    if (duplicate.isRegistered) {
      return { success: false, error: "Email is already registered for this event" }
    }

    // Generate unique QR token
    const qrToken = randomUUID()

    // Create registrant
    const [registrant] = await db
      .insert(registrants)
      .values({
        eventId,
        email: validated.email,
        firstName: validated.firstName,
        lastName: validated.lastName,
        qrToken,
        formData: validated.formData ?? null,
        isVip: false,
        checkedIn: false,
      })
      .returning()

    // Send confirmation email (non-blocking, but properly handle errors)
    // Get email template: event-specific or default
    const emailTemplate = event.emailTemplate ?? await getDefaultEmailTemplate()

    // Await the email result to properly log any errors
    sendConfirmationEmail(
      {
        firstName: registrant.firstName,
        lastName: registrant.lastName,
        email: registrant.email,
        qrToken: registrant.qrToken,
      },
      {
        title: event.title,
        eventDate: event.eventDate,
        location: event.location,
        slug: event.slug,
        startTime: event.startTime,
        endTime: event.endTime,
        description: event.description,
      },
      emailTemplate
    ).then((result) => {
      if (!result.success) {
        console.error("Email sending failed:", result.error)
      } else {
        console.log("Confirmation email sent successfully to:", registrant.email)
      }
    }).catch((error) => {
      console.error("Failed to send confirmation email (unexpected error):", error)
    })

    return { success: true, qrToken: registrant.qrToken, registrant }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || "Validation failed" }
    }
    const message = error instanceof Error ? error.message : "Failed to register for event"
    return { success: false, error: message }
  }
}

/**
 * Get a registrant by their QR token (public - used for ticket page)
 * Returns the registrant directly for convenience in server components
 */
export async function getRegistrantByQrToken(
  qrToken: string
): Promise<Registrant | null> {
  try {
    const [registrant] = await db
      .select()
      .from(registrants)
      .where(eq(registrants.qrToken, qrToken))
      .limit(1)

    return registrant ?? null
  } catch (error) {
    console.error("Error fetching registrant by QR token:", error)
    return null
  }
}

/**
 * Check if an email is already registered for an event (public - used for validation)
 */
export async function checkDuplicateEmail(
  eventId: string,
  email: string
): Promise<{ isRegistered: boolean; registrant?: Registrant }> {
  try {
    const [existing] = await db
      .select()
      .from(registrants)
      .where(and(
        eq(registrants.eventId, eventId),
        eq(registrants.email, email)
      ))
      .limit(1)

    if (existing) {
      return { isRegistered: true, registrant: existing }
    }

    return { isRegistered: false }
  } catch (error) {
    console.error("Error checking duplicate email:", error)
    // Return true to be safe - prevent registration on error
    return { isRegistered: true }
  }
}

/**
 * Get all registrants for an event (public - no auth required)
 * Used by both public (just their own) and admin contexts
 * Returns registrants ordered by registeredAt descending
 */
export async function getRegistrantsForEvent(eventId: string): Promise<Registrant[]> {
  try {
    const result = await db
      .select()
      .from(registrants)
      .where(eq(registrants.eventId, eventId))
      .orderBy(desc(registrants.registeredAt))

    return result
  } catch (error) {
    console.error("Error fetching registrants for event:", error)
    return []
  }
}
