import { Metadata } from "next"
import Link from "next/link"
import { getPublicEvents } from "@/server/actions/events"
import { format } from "date-fns"

export const metadata: Metadata = {
  title: 'Strata - Event Registration & Check-in Platform',
  description: 'Discover and register for events. Streamlined event management with powerful registration, ticketing, and check-in tools.',
}

// Event card component
function EventCard({ event }: { event: { id: string; title: string; slug: string; description: string | null; coverImageUrl: string | null; eventDate: Date | null; location: string | null; status: string } }) {
  const eventDateFormatted = event.eventDate
    ? format(new Date(event.eventDate), "MMM d, yyyy")
    : null

  return (
    <Link href={`/e/${event.slug}`} className="group block">
      <div className="relative aspect-[4/3] rounded-[1.5rem] overflow-hidden bg-[var(--surface-container-low)] mb-4">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-headline font-bold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-sm text-[var(--on-surface-variant)] line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-[var(--on-surface-variant)]">
          {eventDateFormatted && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {eventDateFormatted}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {event.location}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

// Past event card (smaller, simpler)
function PastEventCard({ event }: { event: { id: string; title: string; slug: string; eventDate: Date | null; location: string | null } }) {
  const eventDateFormatted = event.eventDate
    ? format(new Date(event.eventDate), "MMM d, yyyy")
    : null

  return (
    <Link href={`/e/${event.slug}`} className="group block p-4 rounded-xl bg-[var(--surface-container-low)] hover:bg-[var(--surface-container)] transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className="font-headline font-semibold text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">
            {event.title}
          </h4>
          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--on-surface-variant)]">
            {eventDateFormatted && <span>{eventDateFormatted}</span>}
            {event.location && <span>• {event.location}</span>}
          </div>
        </div>
        <svg className="w-5 h-5 text-[var(--on-surface-variant)] group-hover:text-[var(--primary)] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}

export default async function HomePage() {
  const { upcoming, past } = await getPublicEvents()

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--surface)]/80 backdrop-blur-xl border-b border-[var(--outline-variant)]/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-headline font-extrabold text-[var(--primary)] tracking-tight">
            Strata
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/login" className="py-2.5 px-5 rounded-full bg-[var(--primary)] text-white font-label text-sm font-semibold hover:bg-[var(--primary-container)] transition-colors">
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[var(--secondary-container)] text-[var(--on-secondary-container)] font-label text-xs uppercase tracking-[0.15em] mb-6">
              Event Management Platform
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-extrabold text-[var(--on-surface)] tracking-tight leading-[1.1] mb-6">
              Create memorable events with seamless registration
            </h1>
            <p className="text-lg md:text-xl text-[var(--on-surface-variant)] leading-relaxed mb-8">
              Strata helps you manage events from registration to check-in. Beautiful forms, instant QR tickets, and real-time analytics.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/login" className="py-4 px-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-container)] text-white font-headline font-bold shadow-lg shadow-[var(--primary-container)]/20 hover:scale-[1.02] transition-transform">
                Get Started
              </Link>
              <Link href="#events" className="py-4 px-8 rounded-full border border-[var(--outline-variant)] text-[var(--on-surface)] font-headline font-bold hover:bg-[var(--surface-container-low)] transition-colors">
                Browse Events
              </Link>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-1/2 h-full -z-10 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[var(--primary-container)]/20 blur-3xl" />
          <div className="absolute top-1/2 -right-12 w-64 h-64 rounded-full bg-[var(--secondary-container)]/30 blur-3xl" />
        </div>
      </section>

      {/* Upcoming Events Section */}
      <section id="events" className="max-w-7xl mx-auto px-6 py-16">
        {upcoming.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-3xl font-headline font-bold text-[var(--on-surface)]">Upcoming Events</h2>
                <p className="text-[var(--on-surface-variant)] mt-2">Discover and register for upcoming events</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcoming.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[var(--surface-container-low)] flex items-center justify-center">
              <svg className="w-10 h-10 text-[var(--on-surface-variant)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-headline font-bold text-[var(--on-surface)] mb-2">No upcoming events</h3>
            <p className="text-[var(--on-surface-variant)] mb-6">Check back soon for new events.</p>
          </div>
        )}
      </section>

      {/* Past Events Section */}
      {past.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-16 border-t border-[var(--outline-variant)]/10">
          <div className="mb-8">
            <h2 className="text-2xl font-headline font-bold text-[var(--on-surface)]">Past Events</h2>
            <p className="text-[var(--on-surface-variant)] mt-1">Events that have concluded</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {past.map((event) => (
              <PastEventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="bg-[var(--surface-container-low)] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-headline font-bold text-[var(--on-surface)] mb-4">Why Strata?</h2>
            <p className="text-[var(--on-surface-variant)] max-w-2xl mx-auto">
              Everything you need to run successful events, from registration to check-in.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-[1.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/10">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-headline font-bold text-[var(--on-surface)] mb-3">Custom Registration Forms</h3>
              <p className="text-[var(--on-surface-variant)]">
                Build beautiful registration forms with drag-and-drop. Collect exactly the information you need.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-[1.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/10">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <h3 className="text-xl font-headline font-bold text-[var(--on-surface)] mb-3">QR Code Check-in</h3>
              <p className="text-[var(--on-surface-variant)]">
                Instant QR codes for every registration. Fast check-in with mobile scanner or manual entry.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-[1.5rem] bg-[var(--surface-container-lowest)] border border-[var(--outline-variant)]/10">
              <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-headline font-bold text-[var(--on-surface)] mb-3">Real-time Dashboard</h3>
              <p className="text-[var(--on-surface-variant)]">
                Track registrations and check-ins in real-time. Export data for analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-[var(--on-surface)] mb-4">
            Ready to create your first event?
          </h2>
          <p className="text-lg text-[var(--on-surface-variant)] mb-8 max-w-2xl mx-auto">
            Sign in to get started.
          </p>
          <Link href="/login" className="inline-flex py-4 px-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-container)] text-white font-headline font-bold text-lg shadow-lg shadow-[var(--primary-container)]/20 hover:scale-[1.02] transition-transform">
            Sign In
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[var(--surface-container-low)] py-12 border-t border-[var(--outline-variant)]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl font-headline font-bold text-[var(--primary)]">Strata</span>
              <span className="text-xs text-[var(--on-surface-variant)]">Event Management Platform</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[var(--on-surface-variant)]">
              <span>© {new Date().getFullYear()} Strata. All rights reserved.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}