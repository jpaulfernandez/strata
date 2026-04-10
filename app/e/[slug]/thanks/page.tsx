import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { getEventBySlug } from "@/server/actions/events"
import { getRegistrantByQrToken } from "@/server/actions/registrants"
import { generateQRCode } from "@/lib/qr"

interface ThankYouPageProps {
  params: { slug: string }
  searchParams: { token?: string }
}

export async function generateMetadata({ params }: ThankYouPageProps): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    return { title: "Event Not Found" }
  }

  return {
    title: `Registration Confirmed | ${event.title}`,
  }
}

export default async function ThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const { slug } = params
  const { token } = searchParams

  // Validate token
  if (!token) {
    redirect(`/e/${slug}`)
  }

  // Get event and registrant
  const event = await getEventBySlug(slug)
  if (!event) {
    notFound()
  }

  const registrant = await getRegistrantByQrToken(token)
  if (!registrant || registrant.eventId !== event.id) {
    redirect(`/e/${slug}`)
  }

  // Generate QR code
  const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/ticket/${registrant.qrToken}`
  const qrCodeDataUrl = await generateQRCode(ticketUrl, { width: 256, margin: 2 })

  // Format event date
  const eventDateFormatted = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Success Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center shadow-lg shadow-[var(--primary-container)]/20">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-headline font-extrabold text-[var(--on-surface)] mb-3 tracking-tight">
            You&apos;re in!
          </h1>
          <p className="text-lg text-[var(--on-surface-variant)]">
            Your registration for <strong className="text-[var(--on-surface)]">{event.title}</strong> is confirmed.
          </p>
        </div>

        {/* QR Code Card */}
        <div className="p-8 rounded-[2rem] bg-[var(--surface-container-lowest)] shadow-[0_12px_40px_rgba(74,69,75,0.06)] border border-[var(--outline-variant)]/15 mb-6">
          <div className="text-center mb-6">
            <p className="font-label text-xs uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">
              Your Check-in Code
            </p>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Save or screenshot this QR code to check in at the event.
            </p>
          </div>

          {/* QR Code Image */}
          <div className="p-6 rounded-2xl bg-white inline-block mx-auto shadow-inner">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeDataUrl}
              alt="Your ticket QR code"
              className="w-56 h-56"
            />
          </div>

          {/* Registrant Info */}
          <div className="mt-6 p-5 rounded-xl bg-[var(--surface-container-low)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-widest text-[var(--on-surface-variant)] font-label">Attendee</span>
            </div>
            <p className="text-xl font-headline font-bold text-[var(--on-surface)]">
              {registrant.firstName} {registrant.lastName}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[var(--outline-variant)]/20">
              {eventDateFormatted && (
                <div>
                  <p className="text-xs text-[var(--on-surface-variant)] font-label uppercase tracking-wider mb-1">Date</p>
                  <p className="text-sm font-medium text-[var(--on-surface)]">{eventDateFormatted}</p>
                </div>
              )}
              {event.startTime && event.endTime && (
                <div>
                  <p className="text-xs text-[var(--on-surface-variant)] font-label uppercase tracking-wider mb-1">Time</p>
                  <p className="text-sm font-medium text-[var(--on-surface)]">{event.startTime} – {event.endTime}</p>
                </div>
              )}
            </div>

            {event.location && (
              <div className="pt-3 border-t border-[var(--outline-variant)]/20">
                <p className="text-xs text-[var(--on-surface-variant)] font-label uppercase tracking-wider mb-1">Location</p>
                <p className="text-sm font-medium text-[var(--on-surface)]">{event.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/ticket/${registrant.qrToken}`} className="block">
            <button className="w-full py-4 px-6 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-container)] text-white font-headline font-bold shadow-lg shadow-[var(--primary-container)]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
              View Permanent Ticket
            </button>
          </Link>

          <Link href={`/e/${slug}`} className="block">
            <button className="w-full py-4 px-6 rounded-full border border-[var(--outline-variant)] text-[var(--on-surface-variant)] font-headline font-medium hover:bg-[var(--surface-container-low)] transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Event
            </button>
          </Link>
        </div>

        {/* Email Notice */}
        <div className="mt-8 p-4 rounded-xl bg-[var(--secondary-container)]/30 text-center">
          <p className="text-sm text-[var(--on-secondary-container)]">
            A confirmation email with your QR code has been sent to <strong>{registrant.email}</strong>
          </p>
        </div>
      </div>
    </div>
  )
}