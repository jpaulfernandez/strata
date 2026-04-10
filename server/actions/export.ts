"use server"

import { getRegistrantsForEvent } from "@/server/actions/registrants"
import { getEvent } from "@/server/actions/events"
import { requireRole } from "@/server/auth/rbac"
import type { FormFieldConfig } from "@/lib/db/schema"

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

  // Get all registrants for the event
  const registrants = await getRegistrantsForEvent(eventId)

  if (registrants.length === 0) {
    return ""
  }

  // Collect all unique form field keys from all registrants
  const formFieldKeys = new Set<string>()
  for (const registrant of registrants) {
    if (registrant.formData) {
      for (const key of Object.keys(registrant.formData)) {
        formFieldKeys.add(key)
      }
    }
  }

  // Get form field labels from event configuration for better column names
  const formFieldLabels = new Map<string, string>()
  if (event.formFields) {
    for (const field of event.formFields as FormFieldConfig[]) {
      formFieldLabels.set(field.id, field.label)
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
  for (const registrant of registrants) {
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