"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Edit3,
  Copy,
  ToggleLeft,
  Share2,
  Trash2,
  Calendar,
  MapPin,
  MoreVertical,
  Check,
  LayoutDashboard,
  ScanLine,
  Eye,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { EventCard } from "./event-card"
import { deleteEvent, duplicateEvent, toggleEventStatus } from "@/server/actions/events"
import type { Event } from "@/lib/db/schema"

// Re-export actions for use in components
export { deleteEvent, duplicateEvent, toggleEventStatus }

interface EventListProps {
  initialEvents: Event[]
}

type ViewMode = "grid" | "list"
type StatusFilter = "all" | "draft" | "open" | "closed"

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

const VIEW_MODE_KEY = "strata-events-view-mode"

export function EventList({ initialEvents }: EventListProps) {
  const [viewMode, setViewMode] = React.useState<ViewMode>(() => {
    // Initialize from localStorage if available
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      if (saved === "grid" || saved === "list") {
        return saved
      }
    }
    return "grid"
  })
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("all")
  const [events, setEvents] = React.useState<Event[]>(initialEvents)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [eventToDelete, setEventToDelete] = React.useState<Event | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Save view mode to localStorage
  const handleViewModeChange = React.useCallback((mode: ViewMode) => {
    setViewMode(mode)
    if (typeof window !== "undefined") {
      localStorage.setItem(VIEW_MODE_KEY, mode)
    }
  }, [])

  // Filter events based on search and status
  const filteredEvents = React.useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.slug.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [events, searchQuery, statusFilter])

  const handleDelete = async (id: string) => {
    const result = await deleteEvent(id)
    if (result.success) {
      setEvents((prev) => prev.filter((e) => e.id !== id))
    }
    return result
  }

  const handleDuplicate = async (id: string) => {
    const result = await duplicateEvent(id)
    if (result.success && result.event) {
      setEvents((prev) => [result.event!, ...prev])
    }
    return result
  }

  const handleToggleStatus = async (id: string) => {
    const result = await toggleEventStatus(id)
    if (result.success && result.event) {
      setEvents((prev) =>
        prev.map((e) => (e.id === id ? result.event! : e))
      )
    }
    return result
  }

  const confirmDelete = (event: Event) => {
    setEventToDelete(event)
    setDeleteDialogOpen(true)
  }

  const executeDelete = async () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    try {
      await handleDelete(eventToDelete.id)
      setDeleteDialogOpen(false)
      setEventToDelete(null)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-[var(--on-surface)]">
            Events
          </h1>
          <p className="text-[var(--on-surface-variant)] mt-1">
            Manage your events and registrations
          </p>
        </div>
        <Link href="/admin/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--on-surface-variant)]" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {(["all", "draft", "open", "closed"] as StatusFilter[]).map(
              (status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? "primary" : "ghost"}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              )
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 bg-[var(--surface-container-low)] rounded-full p-1">
          <Button
            variant={viewMode === "grid" ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("grid")}
            className="gap-1.5"
          >
            <LayoutGrid className="h-4 w-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "primary" : "ghost"}
            size="sm"
            onClick={() => handleViewModeChange("list")}
            className="gap-1.5"
          >
            <List className="h-4 w-4" />
            List
          </Button>
        </div>
      </div>

      {/* Event Count */}
      <p className="text-sm text-[var(--on-surface-variant)]">
        {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}{" "}
        found
      </p>

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="rounded-[1.5rem] overflow-hidden bg-[var(--surface-container-lowest)] shadow-[var(--shadow-ghost)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ghost-border)]">
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--on-surface-variant)]">
                    Event
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--on-surface-variant)]">
                    Date
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--on-surface-variant)]">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--on-surface-variant)]">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-[var(--on-surface-variant)]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <EventListRow
                    key={event.id}
                    event={event}
                    onDelete={() => confirmDelete(event)}
                    onDuplicate={() => handleDuplicate(event.id)}
                    onToggleStatus={() => handleToggleStatus(event.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[var(--on-surface-variant)]">
            No events found.{" "}
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your filters."
              : "Create your first event to get started."}
          </p>
          {!searchQuery && statusFilter === "all" && (
            <Link href="/admin/events/new">
              <Button className="mt-4">Create Event</Button>
            </Link>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{eventToDelete?.title}
              &rdquo;? This action cannot be undone and will also delete all
              registrants and check-in data associated with this event.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={executeDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// List view row component
interface EventListRowProps {
  event: Event
  onDelete: () => void
  onDuplicate: () => void
  onToggleStatus: () => void
}

function EventListRow({
  event,
  onDelete,
  onDuplicate,
  onToggleStatus,
}: EventListRowProps) {
  const router = useRouter()
  const [isDuplicating, setIsDuplicating] = React.useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false)
  const [shareCopied, setShareCopied] = React.useState(false)

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await onDuplicate()
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    try {
      await onToggleStatus()
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/e/${event.slug}`
    navigator.clipboard.writeText(url)
    setShareCopied(true)
    setTimeout(() => setShareCopied(false), 2000)
  }

  const formattedDate = event.eventDate
    ? format(new Date(event.eventDate), "MMM d, yyyy")
    : "No date set"

  // Draft events go to edit, published/open/closed events go to dashboard
  const titleHref = event.status === "draft"
    ? `/admin/events/${event.id}/edit`
    : `/admin/dashboard/${event.id}`

  return (
    <tr className="border-b border-[var(--ghost-border)] last:border-b-0 hover:bg-[var(--secondary-container)]/30 transition-colors">
      <td className="px-6 py-4">
        <Link href={titleHref} className="flex items-center gap-3 group">
          {/* Mini cover image */}
          <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
            {event.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                }}
              />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-[var(--on-surface)] truncate group-hover:text-[var(--primary)] transition-colors">
              {event.title}
            </p>
            <p className="text-sm text-[var(--on-surface-variant)] truncate">
              /{event.slug}
            </p>
          </div>
        </Link>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>{formattedDate}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        {event.location ? (
          <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="truncate max-w-[200px]">{event.location}</span>
          </div>
        ) : (
          <span className="text-sm text-[var(--on-surface-variant)]/50">
            No location
          </span>
        )}
      </td>
      <td className="px-6 py-4">
        <Badge variant={statusColors[event.status]}>
          {statusLabels[event.status]}
        </Badge>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1">
          <Link href={`/admin/dashboard/${event.id}`}>
            <Button variant="ghost" size="sm" title="Dashboard">
              <LayoutDashboard className="h-4 w-4" />
            </Button>
          </Link>
          <Link href={`/admin/scan/${event.id}`}>
            <Button variant="ghost" size="sm" title="Scanner">
              <ScanLine className="h-4 w-4" />
            </Button>
          </Link>
          {/* Preview Link (for draft) or Share Link (for open/closed/ended) */}
          {event.status === "draft" ? (
            <Link href={`/e/${event.slug}?preview=true`} target="_blank">
              <Button variant="ghost" size="sm" title="Preview">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              title="Share"
            >
              {shareCopied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
          )}
          {/* More Actions Dropdown */}
          <DropdownMenu
            trigger={
              <Button variant="ghost" size="sm" className="px-2">
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          >
            <DropdownMenuItem onClick={() => router.push(`/admin/events/${event.id}/edit`)}>
                <span className="flex items-center gap-2">
                  <Edit3 className="h-4 w-4" />
                  Edit
                </span>
              </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDuplicate} disabled={isDuplicating}>
              <span className="flex items-center gap-2">
                <Copy className="h-4 w-4" />
                {isDuplicating ? "Duplicating..." : "Duplicate"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleToggleStatus} disabled={isTogglingStatus}>
              <span className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                {isTogglingStatus ? "Updating..." : "Toggle Status"}
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-red-600 hover:text-red-700"
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </span>
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  )
}