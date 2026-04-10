"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, X } from "lucide-react"
import { Button, Input, Label, Card, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui"
import { createGlobalField } from "@/server/actions/settings"
import { globalFieldSchema, type GlobalFieldInput } from "@/lib/validations/settings"
import { zodErrorToFormErrors } from "@/lib/utils"

const fieldTypes = [
  { value: "short_text", label: "Short Text" },
  { value: "long_text", label: "Long Text" },
  { value: "dropdown", label: "Dropdown" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "checkboxes", label: "Checkboxes" },
]

export default function CreateGlobalFieldPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedType, setSelectedType] = useState<string>("short_text")
  const [options, setOptions] = useState<string[]>([])

  const needsOptions = ["dropdown", "multiple_choice", "checkboxes"].includes(selectedType)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const input: GlobalFieldInput = {
      label: formData.get("label") as string,
      fieldType: formData.get("fieldType") as GlobalFieldInput["fieldType"],
      options: needsOptions ? options : undefined,
      isRequired: formData.get("isRequired") === "on",
    }

    try {
      globalFieldSchema.parse(input)
    } catch (error: any) {
      setErrors(zodErrorToFormErrors(error))
      setIsSubmitting(false)
      return
    }

    const result = await createGlobalField(input)

    if (result.success) {
      router.push("/admin/settings/fields")
      router.refresh()
    } else {
      setErrors({ form: result.error || "Failed to create field" })
    }

    setIsSubmitting(false)
  }

  function addOption() {
    setOptions([...options, ""])
  }

  function removeOption(index: number) {
    setOptions(options.filter((_, i) => i !== index))
  }

  function updateOption(index: number, value: string) {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/settings/fields"
        className="inline-flex items-center text-sm text-[var(--on-surface-variant)] hover:text-[var(--on-surface)] mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Fields
      </Link>

      <h2 className="text-2xl font-bold text-[var(--on-surface)]">Create Field</h2>
      <p className="mt-1 text-[var(--on-surface-variant)] mb-8">
        Add a reusable form field for your events
      </p>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.form && (
            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {errors.form}
            </div>
          )}

          <div>
            <Label htmlFor="label">Field Label</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., Company Name"
              error={errors.label}
            />
          </div>

          <div>
            <Label htmlFor="fieldType">Field Type</Label>
            <Select
              name="fieldType"
              value={selectedType}
              onValueChange={setSelectedType}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fieldTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2 mt-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addOption}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isRequired"
              name="isRequired"
              className="w-4 h-4 rounded"
            />
            <Label htmlFor="isRequired" className="font-normal">
              Required field
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Link href="/admin/settings/fields">
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Field"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}