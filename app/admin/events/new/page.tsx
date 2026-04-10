"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button, Input, Textarea, Label, Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui"
import { createEvent } from "@/server/actions/events"
import { eventDetailsSchema, type EventDetailsInput } from "@/lib/validations/events"
import { zodErrorToFormErrors, generateSlug } from "@/lib/utils"

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedStatus, setSelectedStatus] = useState<string>("draft")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)

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

  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(status: "draft" | "open") {
    if (!formRef.current) return

    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(formRef.current)

    // Combine date and time for eventDate
    const eventDateStr = formData.get("eventDate") as string
    const startTimeStr = formData.get("startTime") as string || "10:00"
    let eventDateValue: Date | undefined
    if (eventDateStr) {
      const [year, month, day] = eventDateStr.split("-").map(Number)
      const [hours, minutes] = startTimeStr.split(":").map(Number)
      eventDateValue = new Date(year, month - 1, day, hours || 10, minutes || 0)
    }

    const input: EventDetailsInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: formData.get("description") as string || undefined,
      location: formData.get("location") as string || undefined,
      eventDate: eventDateValue,
      startTime: startTimeStr || undefined,
      endTime: formData.get("endTime") as string || undefined,
      mapsLink: formData.get("mapsLink") as string || undefined,
      coverImageUrl: formData.get("coverImageUrl") as string || undefined,
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

    const result = await createEvent(input)

    if (result.success) {
      router.push("/admin/events")
      router.refresh()
    } else {
      setErrors({ form: result.error || "Failed to create event" })
    }

    setIsSubmitting(false)
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

        <h1 className="text-2xl font-bold text-[var(--on-surface)]">Create Event</h1>
        <p className="mt-1 text-[var(--on-surface-variant)] mb-8">
          Set up a new event for registration
        </p>

        <form ref={formRef}>
          {errors.form && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errors.form}
            </div>
          )}

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
                  placeholder="e.g., Convention Center, 123 Main St"
                  error={errors.location}
                />
              </div>

              {/* Event Date */}
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  name="eventDate"
                  type="date"
                  error={errors.eventDate}
                />
              </div>

              {/* Time fields */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue="10:00"
                    error={errors.startTime}
                  />
                  <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                    e.g., 10:00 AM
                  </p>
                </div>

                {/* End Time */}
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue="17:00"
                    error={errors.endTime}
                  />
                  <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                    e.g., 5:00 PM
                  </p>
                </div>
              </div>

              {/* Maps Link */}
              <div>
                <Label htmlFor="mapsLink">Maps Link</Label>
                <Input
                  id="mapsLink"
                  name="mapsLink"
                  type="url"
                  placeholder="https://maps.google.com/..."
                  error={errors.mapsLink}
                />
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  Optional Google Maps link for the event location.
                </p>
              </div>

              {/* Cover Image URL */}
              <div>
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
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
              onClick={() => handleSubmit("draft")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleSubmit("open")}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save & Open"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}