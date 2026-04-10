import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getEventBySlug } from "@/server/actions/events"
import { RegistrationForm } from "./registration-form"

interface PublicEventPageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PublicEventPageProps): Promise<Metadata> {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    return { title: "Event Not Found" }
  }

  return {
    title: `${event.title} | Registration`,
    description: event.description ?? `Register for ${event.title}`,
    openGraph: {
      title: event.title,
      description: event.description ?? undefined,
      images: event.coverImageUrl ? [{ url: event.coverImageUrl }] : undefined,
    },
  }
}

export default async function PublicEventPage({ params }: PublicEventPageProps) {
  const event = await getEventBySlug(params.slug)

  if (!event) {
    notFound()
  }

  // Check if registration is open
  if (event.status === "draft" || event.status === "closed" || event.status === "ended") {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-[var(--on-secondary-container)] opacity-60"></span>
            {event.status === "draft" ? "Coming Soon" : event.status === "ended" ? "Event Ended" : "Registration Closed"}
          </div>

          {/* Event Title */}
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-[var(--on-surface)] tracking-tight mb-4">
            {event.title}
          </h1>

          {/* Cover Image */}
          {event.coverImageUrl && (
            <div className="w-full h-72 md:h-96 rounded-[2rem] overflow-hidden mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Message Card */}
          <div className="p-8 rounded-[1.5rem] bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/10 max-w-md mx-auto">
            <p className="text-lg text-[var(--on-surface-variant)] leading-relaxed">
              {event.status === "draft"
                ? "Registration is not yet open. Please check back later."
                : event.status === "ended"
                ? "This event has ended. Thank you for your interest."
                : "Registration has closed for this event."}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Format event date and time
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
      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start">
          {/* Left Side: Editorial Content */}
          <div className="lg:col-span-7 flex flex-col space-y-8">
            {/* Hero Image Container */}
            <div className="relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-[var(--surface-container-low)] group">
              {event.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={event.coverImageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--primary)]/40 to-transparent"></div>

              {/* Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8">
                <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-label text-xs uppercase tracking-[0.15em] mb-2 md:mb-4">
                  Event Registration
                </span>
                <h1 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-headline font-extrabold tracking-tight leading-[0.95]">
                  {event.title}
                </h1>
              </div>
            </div>

            {/* Event Details Bento Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Date & Time Card */}
              <div className="p-4 md:p-6 lg:p-8 rounded-[1.5rem] bg-[var(--surface-container-low)] flex flex-col justify-between border border-[var(--outline-variant)]/10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center mb-3 md:mb-4">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-label text-xs uppercase tracking-widest text-[var(--on-surface-variant)] mb-1">Date & Time</p>
                  <h3 className="text-base md:text-lg lg:text-xl font-headline font-bold text-[var(--on-surface)]">
                    {eventDateFormatted || "Date TBA"}
                  </h3>
                  {event.startTime && event.endTime && (
                    <p className="text-sm text-[var(--on-surface-variant)] mt-1">
                      {event.startTime} – {event.endTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Location Card */}
              <div className="p-4 md:p-6 lg:p-8 rounded-[1.5rem] bg-[var(--surface-container-low)] flex flex-col justify-between border border-[var(--outline-variant)]/10">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center mb-3 md:mb-4">
                  <svg className="w-5 h-5 md:w-6 md:h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-label text-xs uppercase tracking-widest text-[var(--on-surface-variant)] mb-1">Location</p>
                  <h3 className="text-base md:text-lg lg:text-xl font-headline font-bold text-[var(--on-surface)]">
                    {event.location || "Location TBA"}
                  </h3>
                  {event.mapsLink && (
                    <a
                      href={event.mapsLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--primary)] hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      View Map
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="prose prose-lg max-w-none">
                <p className="text-lg leading-relaxed text-[var(--on-surface-variant)]">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Right Side: Registration Form */}
          <div className="lg:col-span-5 lg:sticky lg:top-8">
            <div className="bg-[var(--surface-container-lowest)] p-4 sm:p-6 md:p-8 lg:p-10 rounded-[1.5rem] lg:rounded-[2rem] shadow-[0_12px_40px_rgba(74,69,75,0.06)] border border-[var(--outline-variant)]/15">
              <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-[var(--on-surface)] mb-2 tracking-tight">
                Register for Event
              </h2>
              <p className="text-sm sm:text-base text-[var(--on-surface-variant)] mb-6 sm:mb-8 font-body">
                Secure your spot at this exclusive event.
              </p>
              <RegistrationForm event={event} />
            </div>

            {/* Info Card */}
            <div className="mt-4 sm:mt-6 p-4 sm:p-5 rounded-[1rem] sm:rounded-[1.25rem] bg-[var(--secondary-container)]/30 border border-[var(--secondary-container)] flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[var(--secondary-container)] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--on-secondary-container)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-headline font-bold text-[var(--on-secondary-container)]">What&apos;s Included</h4>
                <p className="text-xs sm:text-sm text-[var(--on-secondary-container)] opacity-80 leading-snug mt-1">
                  Registration confirmation, event updates, and check-in QR code sent to your email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}