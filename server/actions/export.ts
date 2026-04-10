"use server"

import { db } from "@/lib/db"
import { registrants, events } from "@/lib/db/schema"
import { getEvent } from "@/server/actions/events"
import { requireRole } from "@/server/auth/rbac"
import { desc, eq } from "drizzle-orm"
import type { FormFieldConfig, CustomQuestion } from "@/lib/db/schema"

/**
 * Escape a value for CSV output
 * Handles quotes, commas, and newlines
 */
function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  const stringValue = String(value)

  // If the value contains a comma, newline, or double quote, wrap it in quotes
  if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
    // Escape double quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

/**
 * Format a date for CSV output
 */
function formatDate(date: Date | null | undefined): string {
  if (!date) return ""
  return date.toISOString()
}

/**
 * Format a boolean for CSV output
 */
function formatBoolean(value: boolean): string {
  return value ? "Yes" : "No"
}

/**
 * Export all registrants for an event as a CSV string
 * Requires admin role
 */
export async function exportRegistrantsCsv(eventId: string): Promise<string> {
  // Require admin role
  await requireRole("admin")

  // Get the event to access form fields configuration
  const event = await getEvent(eventId)
  if (!event) {
    throw new Error("Event not found")
  }

  // Get all registrants for the event directly from database
  const eventRegistrants = await db
    .select()
    .from(registrants)
    .where(eq(registrants.eventId, eventId))
    .orderBy(desc(registrants.registeredAt))

  if (eventRegistrants.length === 0) {
    return ""
  }

  // Collect all unique form field keys from all registrants
  const formFieldKeys = new Set<string>()
  for (const registrant of eventRegistrants) {
    if (registrant.formData) {
      for (const key of Object.keys(registrant.formData)) {
        formFieldKeys.add(key)
      }
    }
  }

  // Get form field labels from event configuration for better column names
  const formFieldLabels = new Map<string, string>()

  // Add labels from enabled global fields (formFields)
  if (event.formFields) {
    for (const field of event.formFields as FormFieldConfig[]) {
      formFieldLabels.set(field.id, field.label)
    }
  }

  // Add labels from custom questions
  if (event.customQuestions) {
    for (const question of event.customQuestions as CustomQuestion[]) {
      formFieldLabels.set(question.id, question.question)
    }
  }

  // Build headers
  const staticHeaders = [
    "Registration ID",
    "First Name",
    "Last Name",
    "Email",
    "Registered At",
    "Checked In",
    "Checked In At",
    "Is VIP",
  ]

  // Add dynamic headers for form fields
  const dynamicHeaders: string[] = []
  const orderedFieldKeys = Array.from(formFieldKeys)
  for (const key of orderedFieldKeys) {
    const label = formFieldLabels.get(key) || key
    dynamicHeaders.push(label)
  }

  const headers = [...staticHeaders, ...dynamicHeaders]

  // Build CSV rows
  const rows: string[][] = []

  // Add header row
  rows.push(headers)

  // Add data rows
  for (const registrant of eventRegistrants) {
    const row: string[] = [
      escapeCsvValue(registrant.id),
      escapeCsvValue(registrant.firstName),
      escapeCsvValue(registrant.lastName),
      escapeCsvValue(registrant.email),
      escapeCsvValue(formatDate(registrant.registeredAt)),
      escapeCsvValue(formatBoolean(registrant.checkedIn)),
      escapeCsvValue(formatDate(registrant.checkedInAt)),
      escapeCsvValue(formatBoolean(registrant.isVip)),
    ]

    // Add dynamic form field values
    for (const key of orderedFieldKeys) {
      const value = registrant.formData?.[key]
      // Handle array values (checkboxes, multiple choice)
      if (Array.isArray(value)) {
        row.push(escapeCsvValue(value.join("; ")))
      } else {
        row.push(escapeCsvValue(value))
      }
    }

    rows.push(row)
  }

  // Convert to CSV string
  return rows.map((row) => row.join(",")).join("\n")
}

/**
 * Export all registrants across all events as a CSV string
 * Requires admin role
 */
export async function exportAllRegistrantsCsv(): Promise<string> {
  // Require admin role
  await requireRole("admin")

  // Get all registrants with their event info
  const allRegistrants = await db
    .select({
      registrant: registrants,
      event: events,
    })
    .from(registrants)
    .innerJoin(events, eq(registrants.eventId, events.id))
    .orderBy(desc(registrants.registeredAt))

  if (allRegistrants.length === 0) {
    return ""
  }

  // Build headers (simpler for all-events report - no dynamic form fields)
  const headers = [
    "Event Name",
    "Registration ID",
    "First Name",
    "Last Name",
    "Email",
    "Registered At",
    "Checked In",
    "Checked In At",
    "Is VIP",
  ]

  // Build CSV rows
  const rows: string[][] = []

  // Add header row
  rows.push(headers)

  // Add data rows
  for (const { registrant, event } of allRegistrants) {
    const row: string[] = [
      escapeCsvValue(event.title),
      escapeCsvValue(registrant.id),
      escapeCsvValue(registrant.firstName),
      escapeCsvValue(registrant.lastName),
      escapeCsvValue(registrant.email),
      escapeCsvValue(formatDate(registrant.registeredAt)),
      escapeCsvValue(formatBoolean(registrant.checkedIn)),
      escapeCsvValue(formatDate(registrant.checkedInAt)),
      escapeCsvValue(formatBoolean(registrant.isVip)),
    ]

    rows.push(row)
  }

  // Convert to CSV string
  return rows.map((row) => row.join(",")).join("\n")
}