"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getEvent } from "@/server/actions/events"
import { getRegistrantsForEvent } from "@/server/actions/registrants"
import { setEventStatus } from "@/server/actions/events"
import type { Event, Registrant } from "@/lib/db/schema"
import { Button, Card, Badge } from "@/components/ui"
import { cn } from "@/lib/utils"
import { ArrowLeft, Users, CheckCircle, Clock, TrendingUp, Star, Camera, Loader2, ExternalLink, Copy, Check, Lock, PartyPopper } from "lucide-react"

// Stats card component
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number | string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div className="p-4 rounded-xl bg-[var(--surface-container-lowest)]">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", color)}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-[var(--on-surface)]">{value}</p>
          <p className="text-sm text-[var(--on-surface-variant)]">{label}</p>
        </div>
      </div>
    </div>
  )
}

// Check-in feed item
function CheckInItem({
  registrant,
  isNew,
}: {
  registrant: Registrant
  isNew?: boolean
}) {
  const initials = `${registrant.firstName[0]}${registrant.lastName[0]}`.toUpperCase()

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg transition-all",
        isNew && "bg-[var(--primary-container)]/20 animate-pulse"
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center text-white font-medium text-sm">
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-[var(--on-surface)] truncate">
            {registrant.firstName} {registrant.lastName}
          </p>
          {registrant.isVip && (
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          )}
        </div>
        <p className="text-sm text-[var(--on-surface-variant)] truncate">
          {registrant.email}
        </p>
      </div>

      {/* Time */}
      <div className="text-right shrink-0">
        <p className="text-xs text-[var(--on-surface-variant)]">
          {registrant.checkedInAt
            ? new Date(registrant.checkedInAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              })
            : "—"}
        </p>
      </div>
    </div>
  )
}

const statusColors: Record<string, "primary" | "warning" | "secondary" | "error"> = {
  draft: "secondary",
  open: "primary",
  closed: "warning",
  ended: "error",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
  ended: "Ended",
}

export default function DashboardPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [registrants, setRegistrants] = React.useState<Registrant[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isUpdatingStatus, setIsUpdatingStatus] = React.useState(false)
  const [linkCopied, setLinkCopied] = React.useState(false)

  // Stats
  const stats = React.useMemo(() => {
    const total = registrants.length
    const checkedIn = registrants.filter((r) => r.checkedIn).length
    const remaining = total - checkedIn
    const rate = total > 0 ? Math.round((checkedIn / total) * 100) : 0

    return { total, checkedIn, remaining, rate }
  }, [registrants])

  // Checked-in registrants sorted by check-in time (most recent first)
  const recentCheckIns = React.useMemo(() => {
    return registrants
      .filter((r) => r.checkedIn && r.checkedInAt)
      .sort((a, b) => {
        if (!a.checkedInAt || !b.checkedInAt) return 0
        return new Date(b.checkedInAt).getTime() - new Date(a.checkedInAt).getTime()
      })
      .slice(0, 20)
  }, [registrants])

  // Registration link
  const registrationUrl = event ? `${window.location.origin}/e/${event.slug}` : ""

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  // Load data
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [eventResult, registrantsResult] = await Promise.all([
          getEvent(eventId),
          getRegistrantsForEvent(eventId),
        ])

        if (!eventResult) {
          setError("Event not found")
          return
        }

        setEvent(eventResult)
        setRegistrants(registrantsResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard")
      }
      setIsLoading(false)
    }

    loadData()
  }, [eventId])

  // Poll for updates every 5 seconds
  React.useEffect(() => {
    const interval = setInterval(async () => {
      const result = await getRegistrantsForEvent(eventId)
      setRegistrants(result)
    }, 5000)

    return () => clearInterval(interval)
  }, [eventId])

  // Status handlers
  const handleOpenRegistration = async () => {
    setIsUpdatingStatus(true)
    const result = await setEventStatus(eventId, "open")
    if (result.success && result.event) {
      setEvent(result.event)
    }
    setIsUpdatingStatus(false)
  }

  const handleCloseRegistration = async () => {
    setIsUpdatingStatus(true)
    const result = await setEventStatus(eventId, "closed")
    if (result.success && result.event) {
      setEvent(result.event)
    }
    setIsUpdatingStatus(false)
  }

  const handleEndEvent = async () => {
    setIsUpdatingStatus(true)
    const result = await setEventStatus(eventId, "ended")
    if (result.success && result.event) {
      setEvent(result.event)
    }
    setIsUpdatingStatus(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-[var(--surface)] p-6">
        <div className="text-center text-red-500">
          <p>{error || "Event not found"}</p>
        </div>
        <Link
          href="/admin/events"
          className="block text-center mt-4 text-[var(--primary)]"
        >
          Back to Events
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link
              href="/admin/events"
              className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Events
            </Link>
            <h1 className="text-2xl font-bold text-[var(--on-surface)]">
              {event.title}
            </h1>
            <p className="text-[var(--on-surface-variant)] mt-1">
              Live Check-in Dashboard
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/admin/events/${eventId}/edit}`}>
              <Button variant="secondary">
                Edit Event
              </Button>
            </Link>
            {!event.status.match("ended") && (
              <Link href={`/admin/scan/${eventId}`}>
                <Button>
                  <Camera className="w-4 h-4 mr-2" />
                  Open Scanner
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Status and Registration Link Section */}
        <Card className="mb-6">
          <div className="flex items-start justify-between gap-6">
            {/* Status Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={statusColors[event.status]} className="text-sm px-3 py-1">
                  {statusLabels[event.status]}
                </Badge>
                {isUpdatingStatus && (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--primary)]" />
                )}
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap gap-2">
                {event.status === "draft" && (
                  <Button onClick={handleOpenRegistration} disabled={isUpdatingStatus}>
                    Publish & Open Registration
                  </Button>
                )}
                {event.status === "open" && (
                  <Button variant="secondary" onClick={handleCloseRegistration} disabled={isUpdatingStatus}>
                    <Lock className="w-4 h-4 mr-2" />
                    Close Registration
                  </Button>
                )}
                {event.status === "closed" && (
                  <>
                    <Button variant="ghost" onClick={handleOpenRegistration} disabled={isUpdatingStatus}>
                      Reopen Registration
                    </Button>
                    <Button onClick={handleEndEvent} disabled={isUpdatingStatus}>
                      <PartyPopper className="w-4 h-4 mr-2" />
                      End Event
                    </Button>
                  </>
                )}
                {event.status === "ended" && (
                  <div className="text-sm text-[var(--on-surface-variant)]">
                    This event has ended. Dashboard data is still available for review.
                  </div>
                )}
              </div>
            </div>

            {/* Registration Link Section */}
            {event.status !== "ended" && (
              <div className="flex-1 max-w-md">
                <label className="text-sm font-medium text-[var(--on-surface)] block mb-2">
                  Registration Link
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-[var(--surface-container-low)] rounded-lg px-3 py-2 text-sm text-[var(--on-surface)] font-mono overflow-x-auto">
                    {registrationUrl}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyLink}
                    title="Copy link"
                  >
                    {linkCopied ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 w-4" />
                    )}
                  </Button>
                  <Link href={`/e/${event.slug}`} target="_blank">
                    <Button variant="ghost" size="sm" title="Open in new tab">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
                {event.status === "draft" && (
                  <p className="text-xs text-[var(--on-surface-variant)] mt-2">
                    Link is not accessible until you publish the event.
                  </p>
                )}
                {event.status === "closed" && (
                  <p className="text-xs text-[var(--on-surface-variant)] mt-2">
                    Registration is closed. Visitors will see a closed message.
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Registered"
            value={stats.total}
            icon={<Users className="w-5 h-5 text-[var(--primary)]" />}
            color="bg-[var(--primary-container)]/30"
          />
          <StatCard
            label="Checked In"
            value={stats.checkedIn}
            icon={<CheckCircle className="w-5 h-5 text-green-600" />}
            color="bg-green-100"
          />
          <StatCard
            label="Remaining"
            value={stats.remaining}
            icon={<Clock className="w-5 h-5 text-amber-600" />}
            color="bg-amber-100"
          />
          <StatCard
            label="Check-in Rate"
            value={`${stats.rate}%`}
            icon={<TrendingUp className="w-5 h-5 text-[var(--primary)]" />}
            color="bg-[var(--primary-container)]/30"
          />
        </div>

        {/* Check-in Feed */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--on-surface)]">
              Recent Check-ins
            </h2>
            <Badge variant="secondary">
              {recentCheckIns.length} shown
            </Badge>
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="text-center py-8 text-[var(--on-surface-variant)]">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No check-ins yet</p>
              <p className="text-sm mt-1">
                {event.status === "ended"
                  ? "Event has ended. No more check-ins will occur."
                  : "Check-ins will appear here in real-time"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCheckIns.map((registrant) => (
                <CheckInItem key={registrant.id} registrant={registrant} />
              ))}
            </div>
          )}
        </Card>

        {/* Refresh indicator */}
        <p className="text-center text-xs text-[var(--on-surface-variant)] mt-4">
          Auto-refreshing every 5 seconds
        </p>
      </div>
    </div>
  )
}