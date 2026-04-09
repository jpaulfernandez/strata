import { getEvents } from "@/server/actions/events"
import { EventList } from "@/components/features/events/event-list"

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <EventList initialEvents={events} />
      </div>
    </div>
  )
}