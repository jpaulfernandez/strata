"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, Settings, AlertCircle, Check, X, Eye, Rocket, ExternalLink, Mail } from "lucide-react"
import { Button, Input, Textarea, Label, Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui"
import { getEvent, updateEvent, getRegistrantCount } from "@/server/actions/events"
import { getGlobalFields, getDefaultEmailTemplate } from "@/server/actions/settings"
import { eventDetailsSchema, type EventDetailsInput } from "@/lib/validations/events"
import { zodErrorToFormErrors, generateSlug, formatDateTime } from "@/lib/utils"
import { FormBuilder } from "@/components/features/events/form-builder"
import { FormPreview } from "@/components/features/events/form-preview"
import type { GlobalField, FormFieldConfig as SchemaFormFieldConfig, CustomQuestion as SchemaCustomQuestion } from "@/lib/db/schema"
import { cn } from "@/lib/utils"

const statusOptions = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "ended", label: "Ended" },
]

interface FormField {
  id: string
  label: string
  fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"
  options?: { label: string; value: string }[]
  isRequired: boolean
  order: number
}

interface CustomQuestion {
  id: string
  question: string
  fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"
  options?: { label: string; value: string }[]
  isRequired: boolean
  order: number
}

// Tab component
function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-[var(--primary-container)] text-[var(--on-primary-container)]"
          : "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]"
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={cn(
      "fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-right",
      type === "success"
        ? "bg-green-600 text-white"
        : "bg-red-600 text-white"
    )}>
      {type === "success" ? (
        <Check className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 hover:opacity-80">
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default function EditEventPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedStatus, setSelectedStatus] = useState<string>("draft")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("10:00")
  const [endTime, setEndTime] = useState("17:00")
  const [mapsLink, setMapsLink] = useState("")
  const [coverImageUrl, setCoverImageUrl] = useState("")
  const [createdAt, setCreatedAt] = useState<string>("")
  const [registrantCount, setRegistrantCount] = useState<number>(0)

  // Tab state
  const [activeTab, setActiveTab] = useState<"details" | "form" | "email">("details")

  // Email template state
  const [emailTemplate, setEmailTemplate] = useState("")
  const [useCustomEmail, setUseCustomEmail] = useState(false)
  const [defaultEmailTemplate, setDefaultEmailTemplate] = useState("")

  // Form builder state
  const [globalFields, setGlobalFields] = useState<GlobalField[]>([])
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([])

  // Track initial values for unsaved changes detection
  const [initialValues, setInitialValues] = useState<string>("")
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)

  const formRef = useRef<HTMLFormElement>(null)

  // Get current state as JSON string
  const getCurrentStateJson = useCallback(() => {
    return JSON.stringify({
      title,
      slug,
      description,
      location,
      eventDate,
      startTime,
      endTime,
      mapsLink,
      coverImageUrl,
      status: selectedStatus,
      formFields,
      customQuestions,
      emailTemplate: useCustomEmail ? emailTemplate : "",
      useCustomEmail,
    })
  }, [title, slug, description, location, eventDate, startTime, endTime, mapsLink, coverImageUrl, selectedStatus, formFields, customQuestions, emailTemplate, useCustomEmail])

  // Check for unsaved changes
  const hasUnsavedChanges = useCallback(() => {
    if (!isInitialLoadComplete) return false
    return getCurrentStateJson() !== initialValues
  }, [initialValues, isInitialLoadComplete, getCurrentStateJson])

  // Warn on page leave with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault()
        e.returnValue = ""
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)
    return () => window.removeEventListener("beforeunload", handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Load event data and global fields on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        // Load event, global fields, and default email template in parallel
        const [event, fields, defaultTemplate] = await Promise.all([
          getEvent(eventId),
          getGlobalFields(),
          getDefaultEmailTemplate(),
        ])

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

        // Format date for date input (not datetime-local)
        if (event.eventDate) {
          const d = new Date(event.eventDate)
          setEventDate(formatDateForDateInput(d))
        }

        // Set time fields
        setStartTime(event.startTime ?? "10:00")
        setEndTime(event.endTime ?? "17:00")
        setMapsLink(event.mapsLink ?? "")

        setCoverImageUrl(event.coverImageUrl ?? "")
        setCreatedAt(formatDateTime(event.createdAt))

        // Set global fields
        setGlobalFields(fields as GlobalField[])

        // Load existing form configuration
        let loadedFormFields: FormField[] = []
        let loadedCustomQuestions: CustomQuestion[] = []
        if (event.formFields) {
          loadedFormFields = event.formFields as FormField[]
          setFormFields(loadedFormFields)
        }
        if (event.customQuestions) {
          loadedCustomQuestions = event.customQuestions as CustomQuestion[]
          setCustomQuestions(loadedCustomQuestions)
        }

        // Load email template
        setDefaultEmailTemplate(defaultTemplate || "")
        if (event.emailTemplate) {
          setEmailTemplate(event.emailTemplate)
          setUseCustomEmail(true)
        }

        // Set initial values for change tracking - use a timeout to ensure all state updates are complete
        setTimeout(() => {
          const initialState = JSON.stringify({
            title: event.title,
            slug: event.slug,
            description: event.description ?? "",
            location: event.location ?? "",
            eventDate: event.eventDate ? formatDateForDateInput(new Date(event.eventDate)) : "",
            startTime: event.startTime ?? "10:00",
            endTime: event.endTime ?? "17:00",
            mapsLink: event.mapsLink ?? "",
            coverImageUrl: event.coverImageUrl ?? "",
            status: event.status,
            formFields: loadedFormFields,
            customQuestions: loadedCustomQuestions,
            emailTemplate: event.emailTemplate || "",
            useCustomEmail: !!event.emailTemplate,
          })
          setInitialValues(initialState)
          setIsInitialLoadComplete(true)
        }, 0)

        // Get registrant count
        const count = await getRegistrantCount(eventId)
        setRegistrantCount(count)
      } catch (error) {
        setErrors({ form: "Failed to load event" })
      }
      setIsLoading(false)
    }

    loadData()
  }, [eventId])

  // Helper to format date for date input (YYYY-MM-DD only)
  function formatDateForDateInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
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

  // Handle form builder changes
  const handleFormBuilderChange = useCallback((fields: FormField[], questions: CustomQuestion[]) => {
    setFormFields(fields)
    setCustomQuestions(questions)
  }, [])

  // Build preview fields from form fields and custom questions
  const previewFields = useCallback(() => {
    const allFields: Array<{
      id: string
      label: string
      fieldType: "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"
      options?: { label: string; value: string }[]
      isRequired: boolean
    }> = []

    // Add built-in fields first
    allFields.push(
      { id: "__firstName__", label: "First Name", fieldType: "short_text", isRequired: true },
      { id: "__lastName__", label: "Last Name", fieldType: "short_text", isRequired: true },
      { id: "__email__", label: "Email Address", fieldType: "short_text", isRequired: true }
    )

    // Add form fields (enabled global fields)
    formFields.forEach((field) => {
      allFields.push({
        id: field.id,
        label: field.label,
        fieldType: field.fieldType,
        options: field.options,
        isRequired: field.isRequired,
      })
    })

    // Add custom questions
    customQuestions.forEach((question) => {
      allFields.push({
        id: question.id,
        label: question.question,
        fieldType: question.fieldType,
        options: question.options,
        isRequired: question.isRequired,
      })
    })

    return allFields
  }, [formFields, customQuestions])

  async function handleSubmit(status: "draft" | "open" | "closed" | "ended") {
    if (!formRef.current) return

    setIsSubmitting(true)
    setErrors({})

    // Combine date and time for eventDate
    let eventDateValue: Date | undefined
    if (eventDate) {
      // Create date from the date input value (YYYY-MM-DD format)
      // Use startTime if available, otherwise use a default
      const [year, month, day] = eventDate.split("-").map(Number)
      const [hours, minutes] = startTime.split(":").map(Number)
      eventDateValue = new Date(year, month - 1, day, hours || 10, minutes || 0)
    }

    const input: EventDetailsInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim() || undefined,
      location: location.trim() || undefined,
      eventDate: eventDateValue,
      startTime: startTime.trim() || undefined,
      endTime: endTime.trim() || undefined,
      mapsLink: mapsLink.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      status,
      formFields: formFields.length > 0 ? formFields : undefined,
      customQuestions: customQuestions.length > 0 ? customQuestions : undefined,
      // If useCustomEmail is false, set to null to clear the stored template
      // If true and has content, set the template; if true but empty, set null
      emailTemplate: useCustomEmail && emailTemplate.trim() ? emailTemplate.trim() : null,
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
      // Update initial values to reflect saved state
      setInitialValues(getCurrentStateJson())
      setToast({ message: "Event saved successfully!", type: "success" })
      router.refresh()
    } else {
      setErrors({ form: result.error || "Failed to update event" })
      setToast({ message: result.error || "Failed to save event", type: "error" })
    }

    setIsSubmitting(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-[var(--on-surface-variant)]">Loading event...</div>
        </div>
      </div>
    )
  }

  if (errors.form && !title) {
    return (
      <div className="min-h-screen bg-[var(--surface)]">
        <div className="max-w-6xl mx-auto px-6 py-8">
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

  const unsaved = hasUnsavedChanges()

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-24">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/admin/events"
          className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Events
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--on-surface)]">Edit Event</h1>
          <p className="mt-1 text-[var(--on-surface-variant)]">
            Update event details and settings
          </p>
          {selectedStatus === "draft" && (
            <div className="mt-3 flex items-center gap-3">
              <Link href={`/e/${slug}?preview=true`} target="_blank">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Eye className="w-4 h-4" />
                  Preview Form
                </Button>
              </Link>
              <span className="text-xs text-[var(--on-surface-variant)]">
                Preview shows how the registration form will look
              </span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 p-1 rounded-lg bg-[var(--surface-container-low)]">
          <TabButton
            active={activeTab === "details"}
            onClick={() => setActiveTab("details")}
            icon={<Settings className="w-4 h-4" />}
            label="Event Details"
          />
          <TabButton
            active={activeTab === "form"}
            onClick={() => setActiveTab("form")}
            icon={<FileText className="w-4 h-4" />}
            label="Registration Form"
          />
          <TabButton
            active={activeTab === "email"}
            onClick={() => setActiveTab("email")}
            icon={<Mail className="w-4 h-4" />}
            label="Confirmation Email"
          />
        </div>

        {/* Unsaved Changes Warning */}
        {unsaved && (
          <div className="mb-6 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-800">
              You have unsaved changes. Don&apos;t forget to save your progress.
            </span>
          </div>
        )}

        <form ref={formRef}>
          {errors.form && (
            <div className="mb-6 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errors.form}
            </div>
          )}

          {/* Event Details Tab */}
          {activeTab === "details" && (
            <div className="space-y-6">
              {/* Read-only Info Section */}
              <Card className="mb-6">
                <h2 className="text-lg font-semibold text-[var(--on-surface)] mb-6">
                  Event Info
                </h2>

                <div className="grid grid-cols-2 gap-4">
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

                  {/* Event Date */}
                  <div>
                    <Label htmlFor="eventDate">Event Date</Label>
                    <Input
                      id="eventDate"
                      name="eventDate"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
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
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
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
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
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
                      value={mapsLink}
                      onChange={(e) => setMapsLink(e.target.value)}
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
            </div>
          )}

          {/* Registration Form Tab */}
          {activeTab === "form" && (
            <div className="space-y-6">
              {/* Split view: Form Builder + Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Form Builder */}
                <Card className="overflow-visible">
                  <h2 className="text-lg font-semibold text-[var(--on-surface)] mb-4">
                    Configure Fields
                  </h2>
                  <p className="text-sm text-[var(--on-surface-variant)] mb-6">
                    Enable global fields or add custom questions for the registration form.
                  </p>
                  <FormBuilder
                    globalFields={globalFields}
                    initialFormFields={formFields}
                    initialCustomQuestions={customQuestions}
                    onChange={handleFormBuilderChange}
                  />
                </Card>

                {/* Right: Form Preview */}
                <div className="lg:sticky lg:top-8 lg:self-start">
                  <Card>
                    <FormPreview fields={previewFields()} />
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Email Template Tab */}
          {activeTab === "email" && (
            <div className="space-y-6">
              <Card>
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-[var(--primary)]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--on-surface)]">Confirmation Email</h2>
                    <p className="text-sm text-[var(--on-surface-variant)]">
                      Customize the email sent to registrants after they sign up. Leave empty to use the default template from settings.
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Toggle for custom template */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useCustomEmail"
                      checked={useCustomEmail}
                      onChange={(e) => {
                        setUseCustomEmail(e.target.checked)
                        if (!e.target.checked) {
                          setEmailTemplate("")
                        }
                      }}
                      className="w-5 h-5 rounded accent-[var(--primary)]"
                    />
                    <label htmlFor="useCustomEmail" className="text-sm font-medium text-[var(--on-surface)]">
                      Use custom email template for this event
                    </label>
                  </div>

                  {useCustomEmail && (
                    <>
                      <div>
                        <Label htmlFor="emailTemplate">Email Template (HTML)</Label>
                        <textarea
                          id="emailTemplate"
                          value={emailTemplate}
                          onChange={(e) => setEmailTemplate(e.target.value)}
                          rows={12}
                          placeholder="<h1>You're Registered!</h1>&#10;<p>Hi {{firstName}},</p>&#10;<p>Your ticket for {{eventName}} is confirmed!</p>&#10;<p><a href=&quot;{{ticketUrl}}&quot;>View Your Ticket</a></p>"
                          className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all resize-none font-mono text-sm"
                        />
                      </div>

                      {/* Available Variables */}
                      <div className="p-4 rounded-xl bg-[var(--surface-container-low)]">
                        <p className="text-xs font-label font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">
                          Available Variables
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {["firstName", "lastName", "fullName", "email", "eventName", "eventDate", "eventTime", "eventLocation", "ticketUrl", "eventSlug"].map((v) => (
                            <code key={v} className="px-2 py-1 rounded bg-[var(--surface-container)] text-xs text-[var(--on-surface)]">
                              {`{{${v}}}`}
                            </code>
                          ))}
                        </div>
                        <p className="text-xs text-[var(--on-surface-variant)] mt-3">
                          The QR code will be automatically embedded in emails. Use <code className="px-1 rounded bg-[var(--surface-container)]">{`{{ticketUrl}}`}</code> to link to the ticket page.
                        </p>
                      </div>
                    </>
                  )}

                  {!useCustomEmail && defaultEmailTemplate && (
                    <div className="p-4 rounded-xl bg-[var(--surface-container-low)]">
                      <p className="text-xs font-label font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">
                        Using Default Template from Settings
                      </p>
                      <p className="text-sm text-[var(--on-surface-variant)]">
                        Enable custom template above to override. The default template can be changed in{" "}
                        <Link href="/admin/settings/general" className="text-[var(--primary)] hover:underline">
                          General Settings
                        </Link>.
                      </p>
                    </div>
                  )}

                  {!useCustomEmail && !defaultEmailTemplate && (
                    <div className="p-4 rounded-xl bg-[var(--surface-container-low)]">
                      <p className="text-sm text-[var(--on-surface-variant)]">
                        Using built-in default template. You can customize it in{" "}
                        <Link href="/admin/settings/general" className="text-[var(--primary)] hover:underline">
                          General Settings
                        </Link>{" "}
                        or enable custom template above.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </form>
      </div>

      {/* Fixed Save/Publish Bar */}
      {unsaved && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-[var(--ghost-border)] shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Unsaved changes</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  // Reset to initial values
                  const parsed = JSON.parse(initialValues)
                  setTitle(parsed.title)
                  setSlug(parsed.slug)
                  setDescription(parsed.description)
                  setLocation(parsed.location)
                  setEventDate(parsed.eventDate)
                  setStartTime(parsed.startTime)
                  setEndTime(parsed.endTime)
                  setMapsLink(parsed.mapsLink)
                  setCoverImageUrl(parsed.coverImageUrl)
                  setSelectedStatus(parsed.status)
                  setFormFields(parsed.formFields || [])
                  setCustomQuestions(parsed.customQuestions || [])
                }}
              >
                Discard
              </Button>
              {selectedStatus === "draft" && (
                <Button
                  type="button"
                  onClick={() => handleSubmit("open")}
                  disabled={isSubmitting}
                  className="gap-1.5"
                >
                  <Rocket className="w-4 h-4" />
                  {isSubmitting ? "Publishing..." : "Save & Publish"}
                </Button>
              )}
              <Button
                type="button"
                variant={selectedStatus === "draft" ? "secondary" : "primary"}
                onClick={() => handleSubmit(selectedStatus as "draft" | "open" | "closed" | "ended")}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save as Draft"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}