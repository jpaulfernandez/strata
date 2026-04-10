"use client"

import * as React from "react"
import {
  generateGoogleCalendarUrl,
  generateICSDataUrl,
  generateOutlookUrl,
  type CalendarEventData,
} from "@/lib/calendar"
import { Calendar, CalendarDays, Download } from "lucide-react"

interface CalendarButtonsProps {
  event: CalendarEventData
  appUrl: string
}

export function CalendarButtons({ event, appUrl }: CalendarButtonsProps) {
  const googleUrl = generateGoogleCalendarUrl(event)
  const outlookUrl = generateOutlookUrl(event, appUrl)
  const icsUrl = generateICSDataUrl(event)

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {/* Google Calendar */}
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--outline-variant)]/30 text-sm font-medium text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
      >
        <Calendar className="w-4 h-4" />
        Google
      </a>

      {/* Outlook */}
      <a
        href={outlookUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--outline-variant)]/30 text-sm font-medium text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
      >
        <CalendarDays className="w-4 h-4" />
        Outlook
      </a>

      {/* Download ICS (Apple and others) */}
      <a
        href={icsUrl}
        download={`${event.slug}.ics`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--outline-variant)]/30 text-sm font-medium text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
      >
        <Download className="w-4 h-4" />
        Apple / Other
      </a>
    </div>
  )
}