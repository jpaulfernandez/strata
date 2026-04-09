"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import {
  Calendar,
  MapPin,
  Edit3,
  Copy,
  ToggleLeft,
  Share2,
  Trash2,
  MoreVertical,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Event } from "@/lib/db/schema"

interface EventCardProps {
  event: Event
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  onDuplicate: (id: string) => Promise<{ success: boolean; event?: Event; error?: string }>
  onToggleStatus: (id: string) => Promise<{ success: boolean; event?: Event; error?: string }>
}

const statusColors: Record<string, "success" | "warning" | "secondary" | "error"> = {
  draft: "secondary",
  open: "success",
  closed: "error",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  closed: "Closed",
}

export function EventCard({
  event,
  onDelete,
  onDuplicate,
  onToggleStatus,
}: EventCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isDuplicating, setIsDuplicating] = React.useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete(event.id)
      setIsDeleteDialogOpen(false)
    } catch (error) {
      console.error("Failed to delete event:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      await onDuplicate(event.id)
    } catch (error) {
      console.error("Failed to duplicate event:", error)
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleToggleStatus = async () => {
    setIsTogglingStatus(true)
    try {
      await onToggleStatus(event.id)
    } catch (error) {
      console.error("Failed to toggle status:", error)
    } finally {
      setIsTogglingStatus(false)
    }
  }

  const formattedDate = event.eventDate
    ? format(new Date(event.eventDate), "MMM d, yyyy")
    : "No date set"

  return (
    <>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-ghost)]">
        {/* Cover Image or Gradient Placeholder */}
        <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden">
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
          {/* Status Badge Overlay */}
          <div className="absolute top-3 right-3">
            <Badge variant={statusColors[event.status]}>
              {statusLabels[event.status]}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-[var(--on-surface)] line-clamp-1">
            {event.title}
          </h3>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {event.location && (
              <div className="flex items-center gap-2 text-sm text-[var(--on-surface-variant)]">
                <MapPin className="h-4 w-4 shrink-0" />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <Link href={`/admin/events/${event.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <Edit3 className="h-3.5 w-3.5" />
                Edit
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="h-3.5 w-3.5" />
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={handleToggleStatus}
              disabled={isTogglingStatus}
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              {isTogglingStatus ? "Updating..." : "Toggle Status"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                // Share functionality - copy public URL to clipboard
                const url = `${window.location.origin}/events/${event.slug}`
                navigator.clipboard.writeText(url)
              }}
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{event.title}&rdquo;? This
              action cannot be undone and will also delete all registrants and
              check-in data associated with this event.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}