"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy, Check, ExternalLink } from "lucide-react"
import { Button, Card, Badge } from "@/components/ui"
import { getEvent } from "@/server/actions/events"

export default function ShareEventPage() {
  const params = useParams()
  const router = useRouter()
  const eventId = params.id as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [event, setEvent] = useState<{
    title: string
    slug: string
    status: string
  } | null>(null)
  const [copied, setCopied] = useState(false)

  // Get app URL from environment (client-side access)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true)
      try {
        const eventData = await getEvent(eventId)
        if (!eventData) {
          setError("Event not found")
          setIsLoading(false)
          return
        }

        setEvent({
          title: eventData.title,
          slug: eventData.slug,
          status: eventData.status,
        })
      } catch (err) {
        setError("Failed to load event")
      }
      setIsLoading(false)
    }

    loadEvent()
  }, [eventId])

  // Build the public registration URL
  const registrationUrl = event ? `${appUrl}/e/${event.slug}` : ""

  // Copy URL to clipboard
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(registrationUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea")
      textArea.value = registrationUrl
      textArea.style.position = "fixed"
      textArea.style.left = "-999999px"
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (e) {
        setError("Failed to copy to clipboard")
      }
      document.body.removeChild(textArea)
    }
  }

  // Get badge variant based on status
  function getStatusBadgeVariant(status: string): "primary" | "secondary" | "outline" | "warning" | "error" {
    switch (status) {
      case "open":
        return "primary"
      case "closed":
        return "warning"
      case "draft":
        return "secondary"
      default:
        return "secondary"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="text-center text-[var(--on-surface-variant)]">Loading event...</div>
        </div>
      </div>
    )
  }

  if (error && !event) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="p-4 rounded-lg bg-red-50 text-red-600 text-center">
            {error}
          </div>
          <Link
            href="/admin/events"
            className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Events
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link
          href={`/admin/events/${eventId}/edit`}
          className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Edit Event
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--on-surface)]">Share Event</h1>
          <p className="mt-1 text-[var(--on-surface-variant)]">
            Share the registration link with your audience
          </p>
        </div>

        <Card className="mb-6">
          {/* Event Info */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--on-surface)]">{event?.title}</h2>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(event?.status ?? "draft")}>
                {event?.status ? event.status.charAt(0).toUpperCase() + event.status.slice(1) : "Draft"}
              </Badge>
            </div>
          </div>

          {/* Registration URL */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--on-surface)]">
                Public Registration URL
              </label>
              <p className="text-xs text-[var(--on-surface-variant)] mt-1 mb-3">
                Share this link to allow people to register for your event
              </p>
            </div>

            {/* URL Display Box */}
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-[var(--surface-container-low)] rounded-lg px-4 py-3 text-sm text-[var(--on-surface)] font-mono overflow-x-auto">
                {registrationUrl}
              </div>
              <Button
                type="button"
                variant={copied ? "secondary" : "primary"}
                onClick={handleCopy}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            {/* Status-specific messaging */}
            {event?.status === "draft" && (
              <p className="text-sm text-[var(--on-surface-variant)] mt-4 p-3 rounded-lg bg-[var(--surface-container-low)]">
                This event is currently in draft status. The registration URL will not be accessible to the public until you change the status to &ldquo;Open&rdquo;.
              </p>
            )}

            {event?.status === "closed" && (
              <p className="text-sm text-[var(--on-surface-variant)] mt-4 p-3 rounded-lg bg-[var(--surface-container-low)]">
                This event is currently closed. The registration URL will show a message that registration has ended.
              </p>
            )}

            {event?.status === "open" && (
              <p className="text-sm text-[var(--on-surface-variant)] mt-4">
                The registration form is live and accepting registrations.
              </p>
            )}
          </div>

          {/* Preview Link */}
          <div className="mt-6 pt-4">
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Preview Registration Page
            </a>
          </div>
        </Card>
      </div>
    </div>
  )
}