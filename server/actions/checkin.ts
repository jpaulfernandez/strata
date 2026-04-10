"use server"

import { db } from "@/lib/db"
import {
  registrants,
  checkins,
  vipNotifications,
  type Registrant,
} from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { requireRole } from "@/server/auth/rbac"

/**
 * Check in a registrant by QR token
 */
export async function checkInByQrToken(
  eventId: string,
  qrToken: string
): Promise<{ success: boolean; registrant?: Registrant; error?: string; alreadyCheckedIn?: boolean }> {
  const user = await requireRole("staff")

  try {
    // Find the registrant by QR token and event
    const [registrant] = await db
      .select()
      .from(registrants)
      .where(
        and(
          eq(registrants.qrToken, qrToken),
          eq(registrants.eventId, eventId)
        )
      )
      .limit(1)

    if (!registrant) {
      return { success: false, error: "QR code not recognized" }
    }

    // Check if already checked in
    if (registrant.checkedIn) {
      return {
        success: true,
        registrant,
        alreadyCheckedIn: true,
      }
    }

    const now = new Date()

    // Update registrant as checked in
    const [updatedRegistrant] = await db
      .update(registrants)
      .set({
        checkedIn: true,
        checkedInAt: now,
        checkedInBy: user.id,
      })
      .where(eq(registrants.id, registrant.id))
      .returning()

    // Create checkin record
    await db.insert(checkins).values({
      registrantId: registrant.id,
      eventId,
      scannedBy: user.id,
      scannedAt: now,
      method: "qr",
    })

    return { success: true, registrant: updatedRegistrant }
  } catch (error) {
    console.error("Error checking in by QR:", error)
    const message = error instanceof Error ? error.message : "Failed to check in"
    return { success: false, error: message }
  }
}

/**
 * Check in a registrant by email (manual check-in)
 */
export async function checkInByEmail(
  eventId: string,
  email: string
): Promise<{ success: boolean; registrant?: Registrant; error?: string; alreadyCheckedIn?: boolean }> {
  const user = await requireRole("staff")

  try {
    // Find the registrant by email and event
    const [registrant] = await db
      .select()
      .from(registrants)
      .where(
        and(
          eq(registrants.email, email.toLowerCase().trim()),
          eq(registrants.eventId, eventId)
        )
      )
      .limit(1)

    if (!registrant) {
      return { success: false, error: "Email not found in registrations" }
    }

    // Check if already checked in
    if (registrant.checkedIn) {
      return {
        success: true,
        registrant,
        alreadyCheckedIn: true,
      }
    }

    const now = new Date()

    // Update registrant as checked in
    const [updatedRegistrant] = await db
      .update(registrants)
      .set({
        checkedIn: true,
        checkedInAt: now,
        checkedInBy: user.id,
      })
      .where(eq(registrants.id, registrant.id))
      .returning()

    // Create checkin record
    await db.insert(checkins).values({
      registrantId: registrant.id,
      eventId,
      scannedBy: user.id,
      scannedAt: now,
      method: "manual_email",
    })

    return { success: true, registrant: updatedRegistrant }
  } catch (error) {
    console.error("Error checking in by email:", error)
    const message = error instanceof Error ? error.message : "Failed to check in"
    return { success: false, error: message }
  }
}

/**
 * Toggle VIP status for a registrant
 */
export async function toggleVipStatus(
  eventId: string,
  registrantId: string
): Promise<{ success: boolean; registrant?: Registrant; error?: string }> {
  const user = await requireRole("staff")

  try {
    // Get current registrant
    const [registrant] = await db
      .select()
      .from(registrants)
      .where(
        and(
          eq(registrants.id, registrantId),
          eq(registrants.eventId, eventId)
        )
      )
      .limit(1)

    if (!registrant) {
      return { success: false, error: "Registrant not found" }
    }

    const newVipStatus = !registrant.isVip

    // Update VIP status
    const [updatedRegistrant] = await db
      .update(registrants)
      .set({
        isVip: newVipStatus,
      })
      .where(eq(registrants.id, registrantId))
      .returning()

    // If becoming VIP, create notification
    if (newVipStatus) {
      await db.insert(vipNotifications).values({
        eventId,
        registrantId,
        triggeredBy: user.id,
        triggeredAt: new Date(),
        acknowledged: false,
      })
    }

    return { success: true, registrant: updatedRegistrant }
  } catch (error) {
    console.error("Error toggling VIP status:", error)
    const message = error instanceof Error ? error.message : "Failed to toggle VIP status"
    return { success: false, error: message }
  }
}

/**
 * Get all registrants for an event
 */
export async function getRegistrantsForEvent(
  eventId: string
): Promise<Registrant[]> {
  await requireRole("staff")

  try {
    const allRegistrants = await db
      .select()
      .from(registrants)
      .where(eq(registrants.eventId, eventId))
      .orderBy(desc(registrants.registeredAt))

    return allRegistrants
  } catch (error) {
    console.error("Error fetching registrants:", error)
    return []
  }
}
