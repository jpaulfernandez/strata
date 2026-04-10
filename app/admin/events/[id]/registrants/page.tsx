"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { getEvent } from "@/server/actions/events"
import { getRegistrantsForEvent } from "@/server/actions/registrants"
import { exportRegistrantsCsv } from "@/server/actions/export"
import type { Event, Registrant } from "@/lib/db/schema"
import { Button, Card, Badge, Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { ArrowLeft, Download, Search, Star, CheckCircle, Clock, Loader2 } from "lucide-react"

// Status badge component
function StatusBadge({ checkedIn }: { checkedIn: boolean }) {
  if (checkedIn) {
    return (
      <Badge variant="primary" className="bg-green-100 text-green-700">
        <CheckCircle className="w-3 h-3 mr-1" />
        Checked In
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      <Clock className="w-3 h-3 mr-1" />
      Not Checked In
    </Badge>
  )
}

// Registrant row component
function RegistrantRow({ registrant }: { registrant: Registrant }) {
  const initials = `${registrant.firstName[0]}${registrant.lastName[0]}`.toUpperCase()

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--surface-container-lowest)] hover:bg-[var(--surface-container-low)] transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)] flex items-center justify-center text-white font-medium text-sm shrink-0">
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

      {/* Status */}
      <StatusBadge checkedIn={registrant.checkedIn} />

      {/* Registered Date */}
      <div className="text-right shrink-0 hidden md:block">
        <p className="text-sm text-[var(--on-surface-variant)]">
          {new Date(registrant.registeredAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </p>
      </div>
    </div>
  )
}

export default function RegistrantsPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [registrants, setRegistrants] = React.useState<Registrant[]>([])
  const [filteredRegistrants, setFilteredRegistrants] = React.useState<Registrant[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "checked-in" | "not-checked-in">("all")
  const [isExporting, setIsExporting] = React.useState(false)

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
        setFilteredRegistrants(registrantsResult)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load registrants")
      }
      setIsLoading(false)
    }

    loadData()
  }, [eventId])

  // Filter registrants
  React.useEffect(() => {
    let filtered = [...registrants]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (r) =>
          r.firstName.toLowerCase().includes(query) ||
          r.lastName.toLowerCase().includes(query) ||
          r.email.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter === "checked-in") {
      filtered = filtered.filter((r) => r.checkedIn)
    } else if (statusFilter === "not-checked-in") {
      filtered = filtered.filter((r) => !r.checkedIn)
    }

    setFilteredRegistrants(filtered)
  }, [registrants, searchQuery, statusFilter])

  // Export CSV
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const csv = await exportRegistrantsCsv(eventId)

      // Create download
      const blob = new Blob([csv], { type: "text/csv" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${event?.slug || "registrants"}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed:", err)
    }
    setIsExporting(false)
  }

  // Stats
  const stats = React.useMemo(() => {
    const total = registrants.length
    const checkedIn = registrants.filter((r) => r.checkedIn).length
    const vips = registrants.filter((r) => r.isVip).length

    return { total, checkedIn, vips }
  }, [registrants])

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
              Registrants
            </h1>
            <p className="text-[var(--on-surface-variant)] mt-1">
              {event.title}
            </p>
          </div>

          <Button onClick={handleExport} disabled={isExporting || registrants.length === 0}>
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export CSV
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-[var(--surface-container-lowest)] text-center">
            <p className="text-2xl font-bold text-[var(--on-surface)]">{stats.total}</p>
            <p className="text-sm text-[var(--on-surface-variant)]">Total</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-container-lowest)] text-center">
            <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
            <p className="text-sm text-[var(--on-surface-variant)]">Checked In</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-container-lowest)] text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.vips}</p>
            <p className="text-sm text-[var(--on-surface-variant)]">VIPs</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--on-surface-variant)]" />
                <Input
                  type="search"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <button
                onClick={() => setStatusFilter("all")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === "all"
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)]"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("checked-in")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === "checked-in"
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)]"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
                )}
              >
                Checked In
              </button>
              <button
                onClick={() => setStatusFilter("not-checked-in")}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  statusFilter === "not-checked-in"
                    ? "bg-[var(--primary-container)] text-[var(--on-primary-container)]"
                    : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
                )}
              >
                Not Checked In
              </button>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <p className="text-sm text-[var(--on-surface-variant)] mb-4">
          Showing {filteredRegistrants.length} of {registrants.length} registrants
        </p>

        {/* Registrant List */}
        {filteredRegistrants.length === 0 ? (
          <div className="text-center py-12 text-[var(--on-surface-variant)]">
            <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No registrants found</p>
            {searchQuery && (
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRegistrants.map((registrant) => (
              <RegistrantRow key={registrant.id} registrant={registrant} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}