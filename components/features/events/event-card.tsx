"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
  Check,
  LayoutDashboard,
  ScanLine,
  ExternalLink,
  Eye,
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
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import type { Event } from "@/lib/db/schema"

interface EventCardProps {
  event: Event
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>
  onDuplicate: (id: string) => Promise<{ success: boolean; event?: Event; error?: string }>
  onToggleStatus: (id: string) => Promise<{ success: boolean; event?: Event; error?: string }>
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

export function EventCard({
  event,
  onDelete,
  onDuplicate,
  onToggleStatus,
}: EventCardProps) {
  const router = useRouter()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [isDuplicating, setIsDuplicating] = React.useState(false)
  const [isTogglingStatus, setIsTogglingStatus] = React.useState(false)
  const [shareCopied, setShareCopied] = React.useState(false)

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
    <>
      <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-[var(--shadow-ghost)] hover:border-[rgba(69,59,77,0.2)]">
        {/* Cover Image or Gradient Placeholder */}
        <Link href={titleHref}>
          <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden cursor-pointer">
            {event.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={event.coverImageUrl}
                alt={event.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div
                className="h-full w-full transition-opacity duration-300 group-hover:opacity-90"
                style={{
                  background:
                    "linear-gradient(135deg, var(--primary) 0%, var(--primary-container) 100%)",
                }}
              />
            )}
          </div>
        </Link>

        {/* Status Badge Overlay */}
        <div className="absolute top-3 right-3">
          <Badge variant={statusColors[event.status]}>
            {statusLabels[event.status]}
          </Badge>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <Link href={titleHref}>
            <h3 className="text-lg font-semibold text-[var(--on-surface)] line-clamp-1 hover:text-[var(--primary)] transition-colors cursor-pointer">
              {event.title}
            </h3>
          </Link>

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
            <Link href={`/admin/dashboard/${event.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>

            <Link href={`/scan/${event.id}`}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <ScanLine className="h-3.5 w-3.5" />
                Scanner
              </Button>
            </Link>

            {/* Preview Link (for draft) or Share Link (for open/closed/ended) */}
            {event.status === "draft" ? (
              <Link href={`/e/${event.slug}?preview=true`} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                onClick={handleShare}
              >
                {shareCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-green-600" />
                    <span className="text-green-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    Share
                  </>
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
                onClick={() => setIsDeleteDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </span>
              </DropdownMenuItem>
            </DropdownMenu>
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