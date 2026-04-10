"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

// Types from schema
interface FieldOption {
  label: string
  value: string
}

type FieldType = "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"

interface PreviewField {
  id: string
  label: string
  fieldType: FieldType
  options?: FieldOption[]
  isRequired: boolean
}

interface FormPreviewProps {
  fields: PreviewField[]
}

// Field renderer for each type
function FieldRenderer({ field }: { field: PreviewField }) {
  const baseInputClass = "bg-[var(--surface-container-high)] border-none rounded-lg"

  switch (field.fieldType) {
    case "short_text":
      return (
        <Input
          type="text"
          placeholder="Enter your answer"
          className={baseInputClass}
          disabled
        />
      )

    case "long_text":
      return (
        <Textarea
          placeholder="Enter your answer"
          rows={3}
          className={cn(baseInputClass, "resize-none")}
          disabled
        />
      )

    case "dropdown":
      return (
        <Select disabled>
          <SelectTrigger className={baseInputClass}>
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
        <div className="space-y-2">
          {field.options?.map((opt, index) => (
            <div key={opt.value} className="flex items-center gap-3">
              <div className={cn(
                "w-4 h-4 rounded-full border-2",
                "border-[var(--outline-variant)]",
                index === 0 && "bg-[var(--primary)] border-[var(--primary)]"
              )} />
              <span className="text-sm text-[var(--on-surface)]">{opt.label}</span>
            </div>
          ))}
        </div>
      )

    case "checkboxes":
      return (
        <div className="space-y-2">
          {field.options?.map((opt) => (
            <div key={opt.value} className="flex items-center gap-3">
              <div className={cn(
                "w-4 h-4 rounded border-2 flex items-center justify-center",
                "border-[var(--outline-variant)]"
              )} />
              <span className="text-sm text-[var(--on-surface)]">{opt.label}</span>
            </div>
          ))}
        </div>
      )

    default:
      return null
  }
}

export function FormPreview({ fields }: FormPreviewProps) {
  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[var(--surface-container-low)] border border-dashed border-[var(--ghost-border)] min-h-[200px]">
        <p className="text-sm text-[var(--on-surface-variant)]">
          No fields configured yet.
        </p>
        <p className="text-xs text-[var(--on-surface-variant)]/70 mt-1">
          Enable fields in the form builder to see the preview.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="px-1">
        <h3 className="text-lg font-semibold text-[var(--on-surface)]">
          Registration Form Preview
        </h3>
        <p className="text-xs text-[var(--on-surface-variant)] mt-1">
          This is how registrants will see the form
        </p>
      </div>

      {/* Form container */}
      <div className="p-4 rounded-xl bg-[var(--surface-container-lowest)] space-y-5">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-[var(--on-surface)]">
                {field.label}
              </Label>
              {field.isRequired && (
                <span className="text-red-500 text-xs">*</span>
              )}
            </div>
            <FieldRenderer field={field} />
          </div>
        ))}
      </div>

      {/* Submit button preview */}
      <div className="px-4">
        <div className="w-full py-3 px-4 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] text-white text-sm font-medium text-center opacity-70">
          Submit Registration
        </div>
      </div>
    </div>
  )
}

export default FormPreview