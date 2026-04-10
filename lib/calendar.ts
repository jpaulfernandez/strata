/**
 * Calendar utilities for generating calendar links and ICS files
 */

import type { Event } from "@/lib/db/schema"

/**
 * Event data needed for calendar generation
 */
export interface CalendarEventData {
  title: string
  description?: string | null
  location?: string | null
  eventDate: Date | string | null
  startTime?: string | null  // e.g., "10:00"
  endTime?: string | null    // e.g., "17:00"
  slug: string
}

/**
 * Format a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") + "Z"
}

/**
 * Format a date for Google Calendar (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") + "Z"
}

/**
 * Parse time string (e.g., "10:00") to hours and minutes
 */
function parseTimeString(timeStr: string | null | undefined): { hours: number; minutes: number } | null {
  if (!timeStr) return null
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return null
  return { hours: parseInt(match[1], 10), minutes: parseInt(match[2], 10) }
}

/**
 * Get start and end datetime for an event
 * Falls back to all-day event if time is not specified
 */
function getEventDateRange(event: CalendarEventData): { start: Date; end: Date; isAllDay: boolean } {
  const baseDate = event.eventDate
    ? (typeof event.eventDate === "string" ? new Date(event.eventDate) : event.eventDate)
    : new Date()

  const startTime = parseTimeString(event.startTime)
  const endTime = parseTimeString(event.endTime)

  if (startTime) {
    // Set specific start time
    const start = new Date(baseDate)
    start.setHours(startTime.hours, startTime.minutes, 0, 0)

    // Set end time (default to 1 hour after start if not specified)
    const end = new Date(baseDate)
    if (endTime) {
      end.setHours(endTime.hours, endTime.minutes, 0, 0)
    } else {
      end.setHours(startTime.hours + 1, startTime.minutes, 0, 0)
    }

    return { start, end, isAllDay: false }
  }

  // All-day event
  return { start: baseDate, end: baseDate, isAllDay: true }
}

/**
 * Escape text for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

/**
 * Generate a Google Calendar URL for an event
 *
 * @param event - Event data
 * @returns URL string that opens Google Calendar with pre-filled event
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const { start, end, isAllDay } = getEventDateRange(event)

  const params = new URLSearchParams()
  params.set("action", "TEMPLATE")
  params.set("text", event.title)

  if (isAllDay) {
    // For all-day events, use date only format
    const dateStr = start.toISOString().split("T")[0].replace(/-/g, "")
    params.set("dates", `${dateStr}/${dateStr}`)
  } else {
    // For timed events
    params.set("dates", `${formatGoogleDate(start)}/${formatGoogleDate(end)}`)
  }

  if (event.description) {
    params.set("details", event.description)
  }

  if (event.location) {
    params.set("location", event.location)
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/**
 * Generate an ICS file content for an event
 * Compatible with Apple Calendar, Outlook, and other calendar apps
 *
 * @param event - Event data
 * @returns ICS file content string
 */
export function generateICSContent(event: CalendarEventData): string {
  const { start, end, isAllDay } = getEventDateRange(event)
  const now = new Date()

  // Generate a unique ID for the event
  const uid = `${event.slug}-${start.getTime()}@strata.app`

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Strata//Event Registration//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `SUMMARY:${escapeICSText(event.title)}`,
  ]

  if (isAllDay) {
    // All-day event uses DATE format (not DATETIME)
    const dateStr = start.toISOString().split("T")[0].replace(/-/g, "")
    lines.push(`DTSTART;VALUE=DATE:${dateStr}`)
    lines.push(`DTEND;VALUE=DATE:${dateStr}`)
  } else {
    lines.push(`DTSTART:${formatICSDate(start)}`)
    lines.push(`DTEND:${formatICSDate(end)}`)
  }

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICSText(event.description)}`)
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICSText(event.location)}`)
  }

  lines.push("END:VEVENT")
  lines.push("END:VCALENDAR")

  return lines.join("\r\n")
}

/**
 * Generate a data URL for downloading an ICS file
 *
 * @param event - Event data
 * @returns Data URL that can be used as an href for downloading
 */
export function generateICSDataUrl(event: CalendarEventData): string {
  const icsContent = generateICSContent(event)
  const encoded = encodeURIComponent(icsContent)
  return `data:text/calendar;charset=utf-8,${encoded}`
}

/**
 * Generate an Outlook calendar URL
 * Uses the webcal protocol which Outlook handles
 *
 * @param event - Event data
 * @param appUrl - The base app URL for generating the ICS link
 * @returns URL for Outlook calendar
 */
export function generateOutlookUrl(event: CalendarEventData, appUrl: string): string {
  // Outlook web calendar URL format
  const { start, end } = getEventDateRange(event)

  const params = new URLSearchParams()
  params.set("path", "/calendar/action/compose")
  params.set("rru", "addevent")
  params.set("subject", event.title)

  if (!parseTimeString(event.startTime)) {
    // All-day event
    const dateStr = start.toISOString().split("T")[0]
    params.set("allday", "true")
    params.set("startdt", dateStr)
  } else {
    params.set("startdt", start.toISOString())
    params.set("enddt", end.toISOString())
  }

  if (event.location) {
    params.set("location", event.location)
  }

  if (event.description) {
    params.set("body", event.description)
  }

  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`
}