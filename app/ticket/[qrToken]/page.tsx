import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegistrantByQrToken } from "@/server/actions/registrants"
import { getEventById } from "@/server/actions/events"
import { getTicketMessage } from "@/server/actions/settings"
import { generateQRCode } from "@/lib/qr"
import { CalendarButtons } from "@/components/features/calendar-buttons"
import { DownloadQrButton } from "@/components/features/download-qr-button"
import type { CalendarEventData } from "@/lib/calendar"

interface TicketPageProps {
  params: { qrToken: string }
  searchParams: { new?: string }
}

export async function generateMetadata({ params }: TicketPageProps): Promise<Metadata> {
  const registrant = await getRegistrantByQrToken(params.qrToken)

  if (!registrant) {
    return { title: "Ticket Not Found" }
  }

  return {
    title: `Your Ticket`,
  }
}

export default async function TicketPage({ params, searchParams }: TicketPageProps) {
  const qrToken = params.qrToken
  const isNewRegistration = searchParams.new === "true"

  // Get registrant
  const registrant = await getRegistrantByQrToken(qrToken)
  if (!registrant) {
    notFound()
  }

  // Get event
  const event = await getEventById(registrant.eventId)
  if (!event) {
    notFound()
  }

  // Get ticket message from settings
  const ticketMessage = await getTicketMessage()

  // Generate QR code
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ticket/${registrant.qrToken}`
  const qrCodeDataUrl = await generateQRCode(ticketUrl, { width: 200, margin: 1 })

  // Format event date
  const eventDateFormatted = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  const initials = `${registrant.firstName[0]}${registrant.lastName[0]}`.toUpperCase()

  // Prepare calendar event data
  const calendarEvent: CalendarEventData = {
    title: event.title,
    description: event.description,
    location: event.location,
    eventDate: event.eventDate,
    startTime: event.startTime,
    endTime: event.endTime,
    slug: event.slug,
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-sm mx-auto px-4 py-6 sm:py-8">
        {/* Success Banner for New Registrations */}
        {isNewRegistration && (
          <div className="mb-6 p-4 rounded-[1.5rem] bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-center">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-headline font-bold text-green-800">You&apos;re Registered!</h2>
            <p className="text-sm text-green-700 mt-1">Your ticket has been sent to <strong>{registrant.email}</strong></p>
          </div>
        )}

        {/* Ticket Card */}
        <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-[var(--surface-container-lowest)] shadow-[0_12px_40px_rgba(74,69,75,0.06)] overflow-hidden border border-[var(--outline-variant)]/15">
          {/* Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] text-white">
            <p className="text-xs uppercase tracking-widest opacity-80 font-label mb-1">Event Ticket</p>
            <h1 className="text-lg sm:text-xl font-headline font-bold tracking-tight">{event.title}</h1>
          </div>

          {/* QR Code */}
          <div className="p-4 sm:p-6 flex flex-col items-center">
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white shadow-inner">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeDataUrl}
                alt="Ticket QR code"
                className="w-40 h-40 sm:w-48 sm:h-48"
              />
            </div>
            <p className="text-xs text-[var(--on-surface-variant)] mt-3 sm:mt-4 font-label uppercase tracking-wider text-center">
              Scan this code at check-in
            </p>
          </div>

          {/* Actions: Save QR + Add to Calendar */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="flex flex-wrap gap-2 justify-center mb-4">
              <DownloadQrButton qrCodeDataUrl={qrCodeDataUrl} registrantName={`${registrant.firstName} ${registrant.lastName}`} />
            </div>
            <p className="text-xs text-center text-[var(--on-surface-variant)] mb-3 font-label uppercase tracking-wider">
              Add to Calendar
            </p>
            <CalendarButtons event={calendarEvent} appUrl={appUrl} />
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-[var(--outline-variant)] mx-6" />

          {/* Details */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Attendee */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center text-white font-bold text-base sm:text-lg">
                {initials}
              </div>
              <div>
                <p className="text-xs text-[var(--on-surface-variant)] uppercase tracking-widest font-label">
                  Attendee
                </p>
                <p className="text-base sm:text-lg font-headline font-bold text-[var(--on-surface)]">
                  {registrant.firstName} {registrant.lastName}
                </p>
              </div>
            </div>

            {/* Date & Time */}
            {eventDateFormatted && (
              <div>
                <p className="text-xs text-[var(--on-surface-variant)] uppercase tracking-widest font-label mb-1">
                  Date
                </p>
                <p className="text-sm font-medium text-[var(--on-surface)]">
                  {eventDateFormatted}
                  {event.startTime && ` at ${event.startTime}`}
                </p>
              </div>
            )}

            {/* Location */}
            {event.location && (
              <div>
                <p className="text-xs text-[var(--on-surface-variant)] uppercase tracking-widest font-label mb-1">
                  Location
                </p>
                <p className="text-sm font-medium text-[var(--on-surface)]">
                  {event.location}
                </p>
                {event.mapsLink && (
                  <a
                    href={event.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[var(--primary)] hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    View Map
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {/* VIP Badge */}
            {registrant.isVip && (
              <div className="inline-flex items-center px-3 sm:px-4 py-2 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-sm font-bold">
                <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                VIP Guest
              </div>
            )}

            {/* Check-in Status */}
            {registrant.checkedIn && (
              <div className="p-3 rounded-xl bg-green-50 text-green-700 text-sm flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Checked in
              </div>
            )}
          </div>

          {/* Ticket ID */}
          <div className="p-4 bg-[var(--surface-container-low)] text-center border-t border-[var(--outline-variant)]/10">
            <p className="text-xs text-[var(--on-surface-variant)] font-label uppercase tracking-wider">
              Ticket ID: {registrant.qrToken.slice(0, 8)}...
            </p>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-[var(--on-surface-variant)] mt-6 px-4 leading-relaxed">
          {ticketMessage}
        </p>
      </div>
    </div>
  )
}