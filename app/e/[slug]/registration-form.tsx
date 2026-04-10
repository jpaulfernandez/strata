"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { registerForEvent, checkDuplicateEmail } from "@/server/actions/registrants"
import type { Event, FormFieldConfig, CustomQuestion } from "@/lib/db/schema"
import { cn } from "@/lib/utils"
import { AlertCircle, Loader2 } from "lucide-react"

interface RegistrationFormProps {
  event: Event
}

type FieldType = "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"

interface FormData {
  firstName: string
  lastName: string
  email: string
  [key: string]: string | string[]
}

export function RegistrationForm({ event }: RegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [duplicateEmail, setDuplicateEmail] = React.useState(false)
  const [formData, setFormData] = React.useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
  })

  // Combine form fields and custom questions for rendering
  const allFields = React.useMemo(() => {
    const fields: Array<{
      id: string
      label: string
      fieldType: FieldType
      options?: { label: string; value: string }[]
      isRequired: boolean
    }> = []

    // Add enabled global fields (formFields)
    if (event.formFields) {
      (event.formFields as FormFieldConfig[]).forEach((field) => {
        fields.push({
          id: field.id,
          label: field.label,
          fieldType: field.fieldType,
          options: field.options,
          isRequired: field.isRequired,
        })
      })
    }

    // Add custom questions
    if (event.customQuestions) {
      (event.customQuestions as CustomQuestion[]).forEach((question) => {
        fields.push({
          id: question.id,
          label: question.question,
          fieldType: question.fieldType,
          options: question.options,
          isRequired: question.isRequired,
        })
      })
    }

    return fields
  }, [event.formFields, event.customQuestions])

  // Handle input change
  const handleInputChange = (id: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
    // Clear error for this field
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }
  }

  // Check for duplicate email on blur
  const handleEmailBlur = async () => {
    if (formData.email && formData.email.trim()) {
      const result = await checkDuplicateEmail(event.id, formData.email.trim())
      setDuplicateEmail(result.isRegistered)
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Required built-in fields
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate dynamic fields
    allFields.forEach((field) => {
      if (field.isRequired) {
        const value = formData[field.id]
        if (!value || (typeof value === "string" && !value.trim()) || (Array.isArray(value) && value.length === 0)) {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    if (duplicateEmail) {
      return
    }

    setIsSubmitting(true)

    try {
      const result = await registerForEvent(event.id, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        formData: allFields.reduce((acc, field) => {
          const value = formData[field.id]
          if (value !== undefined) {
            acc[field.id] = value
          }
          return acc
        }, {} as Record<string, unknown>),
      })

      if (result.success && result.qrToken) {
        // Navigate to thank-you page
        router.push(`/e/${event.slug}/thanks?token=${result.qrToken}`)
      } else {
        setErrors({ form: result.error || "Registration failed. Please try again." })
      }
    } catch (error) {
      setErrors({ form: "An unexpected error occurred. Please try again." })
    }

    setIsSubmitting(false)
  }

  // Render field by type
  const renderField = (field: {
    id: string
    label: string
    fieldType: FieldType
    options?: { label: string; value: string }[]
    isRequired: boolean
  }) => {
    const baseInputClass = "w-full px-5 py-4 rounded-xl bg-[var(--surface-container-low)] border-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all placeholder:text-[var(--outline)]/50"

    switch (field.fieldType) {
      case "short_text":
        return (
          <Input
            type="text"
            placeholder="Enter your answer"
            className={baseInputClass}
            value={(formData[field.id] as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={isSubmitting}
          />
        )

      case "long_text":
        return (
          <Textarea
            placeholder="Enter your answer"
            rows={3}
            className={cn(baseInputClass, "resize-none")}
            value={(formData[field.id] as string) || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            disabled={isSubmitting}
          />
        )

      case "dropdown":
        return (
          <Select
            value={(formData[field.id] as string) || ""}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={isSubmitting}
          >
            <SelectTrigger className={cn(baseInputClass, "pr-10")}>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case "multiple_choice":
        return (
          <div className="space-y-3">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-[var(--surface-container-low)] transition-colors"
              >
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={(formData[field.id] as string) === opt.value}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  disabled={isSubmitting}
                  className="w-5 h-5 rounded-full accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--on-surface)]">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )

      case "checkboxes":
        return (
          <div className="space-y-3">
            {field.options?.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-[var(--surface-container-low)] transition-colors"
              >
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={(formData[field.id] as string[])?.includes(opt.value) || false}
                  onChange={(e) => {
                    const current = (formData[field.id] as string[]) || []
                    if (e.target.checked) {
                      handleInputChange(field.id, [...current, opt.value])
                    } else {
                      handleInputChange(field.id, current.filter((v) => v !== opt.value))
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-5 h-5 rounded accent-[var(--primary)]"
                />
                <span className="text-sm text-[var(--on-surface)]">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Form Error */}
      {errors.form && (
        <div className="p-4 rounded-xl bg-red-50 text-red-600 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm">{errors.form}</span>
        </div>
      )}

      {/* Duplicate Email Warning */}
      {duplicateEmail && (
        <div className="p-4 rounded-xl bg-amber-50 text-amber-700 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium text-sm">You&apos;re already registered!</p>
            <p className="text-xs mt-1">
              This email is already registered for this event.
              <a
                href={`/ticket/lookup?email=${encodeURIComponent(formData.email)}&event=${event.id}`}
                className="text-[var(--primary)] hover:underline ml-1"
              >
                Retrieve your ticket
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Built-in Fields */}
      <div className="space-y-5">
        <h3 className="text-lg font-headline font-semibold text-[var(--on-surface)]">
          Your Information
        </h3>

        {/* First Name & Last Name Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-label text-xs font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter first name"
              className="w-full px-5 py-4 rounded-xl bg-[var(--surface-container-low)] border-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all placeholder:text-[var(--outline)]/50"
              value={formData.firstName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                if (errors.firstName) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.firstName
                    return next
                  })
                }
              }}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className="text-xs text-red-500 ml-1">{errors.firstName}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block font-label text-xs font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Enter last name"
              className="w-full px-5 py-4 rounded-xl bg-[var(--surface-container-low)] border-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all placeholder:text-[var(--outline)]/50"
              value={formData.lastName}
              onChange={(e) => {
                setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                if (errors.lastName) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.lastName
                    return next
                  })
                }
              }}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className="text-xs text-red-500 ml-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="block font-label text-xs font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <Input
            type="email"
            placeholder="Enter your email"
            className="w-full px-5 py-4 rounded-xl bg-[var(--surface-container-low)] border-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all placeholder:text-[var(--outline)]/50"
            value={formData.email}
            onChange={(e) => {
              setFormData((prev) => ({ ...prev, email: e.target.value }))
              setDuplicateEmail(false)
              if (errors.email) {
                setErrors((prev) => {
                  const next = { ...prev }
                  delete next.email
                  return next
                })
              }
            }}
            onBlur={handleEmailBlur}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-xs text-red-500 ml-1">{errors.email}</p>
          )}
        </div>
      </div>

      {/* Dynamic Fields */}
      {allFields.length > 0 && (
        <div className="space-y-5 pt-4">
          <h3 className="text-lg font-headline font-semibold text-[var(--on-surface)]">
            Additional Information
          </h3>

          {allFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <label className="block font-label text-xs font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] ml-1">
                {field.label} {field.isRequired && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
              {errors[field.id] && (
                <p className="text-xs text-red-500 ml-1">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting || duplicateEmail}
          className="w-full py-5 px-8 bg-gradient-to-tr from-[var(--primary)] to-[var(--primary-container)] text-white rounded-full font-headline font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_12px_40px_rgba(74,69,75,0.06)] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Registering...</span>
            </>
          ) : (
            <>
              <span>Complete Registration</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* Disclaimer */}
      <p className="text-center font-label text-[10px] uppercase tracking-widest text-[var(--outline)]">
        By registering, you agree to receive event-related communications.
      </p>
    </form>
  )
}