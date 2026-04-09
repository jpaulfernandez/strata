"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Copy } from "lucide-react"
import { Button, Input, Textarea, Label, Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui"
import { getEvent, updateEvent, duplicateEvent, getRegistrantCount, eventDetailsSchema, EventDetailsInput } from "@/server/actions/events"
import { zodErrorToFormErrors, generateSlug, formatDateTime } from "@/lib/utils"

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
]

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedStatus, setSelectedStatus] = useState<string>("draft")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventEndDate, setEventEndDate] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [createdAt, setCreatedAt] = useState<string>("")
  const [registrantCount, setRegistrantCount] = useState<number>(0)

  const formRef = useRef<HTMLFormElement>(null)

  // Load event data on mount
  useEffect(() => {
    async function loadEvent() {
      setIsLoading(true)
      try {
        const event = await getEvent(eventId)
        if (!event) {
          setErrors({ form: "Event not found" })
          setIsLoading(false)
          return
        }

        // Populate form fields
        setTitle(event.title)
        setSlug(event.slug)
        setDescription(event.description ?? "")
        setLocation(event.location ?? "")
        setSelectedStatus(event.status)

        // Format dates for datetime-local input
        if (event.eventDate) {
          const d = new Date(event.eventDate)
          setEventDate(formatDateForInput(d))
        }
        if (event.eventEndDate) {
          const d = new Date(event.eventEndDate)
          setEventEndDate(formatDateForInput(d))
        }

        setCoverImageUrl(event.coverImageUrl ?? "")
        setCreatedAt(formatDateTime(event.createdAt))

        // Get registrant count
        const count = await getRegistrantCount(eventId)
        setRegistrantCount(count)
      } catch (error) {
        setErrors({ form: "Failed to load event" })
      }
      setIsLoading(false)
    }

    loadEvent()
  }, [eventId])

  // Helper to format date for datetime-local input
  function formatDateForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Auto-generate slug from title
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)

    // Only auto-generate slug if user hasn't manually edited it
    if (!slugManuallyEdited) {
      setSlug(generateSlug(newTitle))
    }
  }, [slugManuallyEdited])

  // Mark slug as manually edited when user changes it
  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugManuallyEdited(true)
    // Ensure slug is lowercase with hyphens only
    const value = e.target.value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-")
    setSlug(value)
  }, [])

  async function handleSubmit(status: "draft" | "open" | "closed") {
    if (!formRef.current) return

    setIsSubmitting(true)
    setErrors({})

    const input: EventDetailsInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: eventDate ? new Date(eventDate) : undefined,
      eventEndDate: eventEndDate ? new Date(eventEndDate) : undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      status,
      formFields: [],
      customQuestions: [],
    }

    // Validate with Zod
    try {
      eventDetailsSchema.parse(input)
    } catch (error: unknown) {
      setErrors(zodErrorToFormErrors(error))
      setIsSubmitting(false)
      return
    }

    const result = await updateEvent(eventId, input)

    if (result.success) {
      router.push("/admin/events")
      router.refresh()
    } else {
      setErrors({ form: result.error || "Failed to update event" })
    }

    setIsSubmitting(false)
  }

  async function handleDuplicate() {
    setIsDuplicating(true)
    setErrors({})

    const result = await duplicateEvent(eventId)

    if (result.success && result.event) {
      router.push(`/admin/events/${result.event.id}/edit`)
      router.refresh()
    } else {
      setErrors({ form: result.error || "Failed to duplicate event" })
    }

    setIsDuplicating(false)
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

  if (errors.form && !title) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="p-4 rounded-lg bg-red-50 text-red-600 text-center">
            {errors.form}
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
          href="/admin/events"
          className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--on-surface)]">Edit Event</h1>
            <p className="mt-1 text-[var(--on-surface-variant)]">
              Update event details and settings
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={handleDuplicate}
            disabled={isDuplicating}
          >
            <Copy className="w-4 h-4 mr-2" />
            {isDuplicating ? "Duplicating..." : "Duplicate"}
          </Button>
        </div>

        <form ref={formRef}>
          {errors.form && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errors.form}
            </div>
          )}

          {/* Read-only Info Section */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--on-surface)] mb-6">
              Event Info
            </h2>

            <div className="space-y-4">
              {/* Created Date (read-only) */}
              <div>
                <Label htmlFor="createdAt">Created Date</Label>
                <Input
                  id="createdAt"
                  value={createdAt}
                  disabled
                  className="bg-[var(--surface-container-low)]"
                />
              </div>

              {/* Registrant Count (read-only) */}
              <div>
                <Label htmlFor="registrantCount">Registrant Count</Label>
                <Input
                  id="registrantCount"
                  value={registrantCount.toString()}
                  disabled
                  className="bg-[var(--surface-container-low)]"
                />
              </div>
            </div>
          </Card>

          {/* Event Details Section */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--on-surface)] mb-6">
              Event Details
            </h2>

            <div className="space-y-6">
              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="e.g., Annual Tech Conference 2026"
                  error={errors.title}
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  name="slug"
                  value={slug}
                  onChange={handleSlugChange}
                  placeholder="e.g., annual-tech-conference-2026"
                  error={errors.slug}
                  required
                />
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  URL-friendly identifier. Auto-generated from title, but you can edit it.
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows={4}
                  error={errors.description}
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Convention Center, 123 Main St"
                  error={errors.location}
                />
              </div>

              {/* Event Date & Time */}
              <div>
                <Label htmlFor="eventDate">Event Date & Time</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="datetime-local"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  error={errors.eventDate}
                />
              </div>

              {/* Event End Date & Time */}
              <div>
                <Label htmlFor="eventEndDate">Event End Date & Time</Label>
                <Input
                  id="eventEndDate"
                  name="eventEndDate"
                  type="datetime-local"
                  value={eventEndDate}
                  onChange={(e) => setEventEndDate(e.target.value)}
                  error={errors.eventEndDate}
                />
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  Optional. For multi-day events.
                </p>
              </div>

              {/* Cover Image URL */}
              <div>
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
                  value={coverImageUrl}
                  onChange={(e) => setCoverImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  error={errors.coverImageUrl}
                />
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  Optional. URL for event cover image.
                </p>
              </div>

              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  Draft = not visible to public. Open = accepting registrations. Closed = registration ended.
                </p>
              </div>
            </div>
          </Card>

          {/* Form Builder Section (placeholder) */}
          <Card className="mb-6">
            <h2 className="text-lg font-semibold text-[var(--on-surface)] mb-4">
              Registration Form
            </h2>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Form builder will be available after the event is created. You can configure registration fields and custom questions in the edit page.
            </p>
            {/* Hidden fields for formFields and customQuestions */}
            <input type="hidden" name="formFields" value="[]" />
            <input type="hidden" name="customQuestions" value="[]" />
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Link href="/admin/events">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button
              type="button"
              onClick={() => handleSubmit(selectedStatus as "draft" | "open" | "closed")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}