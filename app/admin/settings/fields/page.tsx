"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react"
import { getFieldsData, deleteGlobalField } from "@/server/actions/settings"
import { Button, Badge, Card } from "@/components/ui"
import { revalidatePath } from "next/cache"

const fieldTypeLabels: Record<string, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  checkboxes: "Checkboxes",
}

interface Field {
  id: string
  label: string
  fieldType: string
  isRequired: boolean
  options: any[] | null
}

export default function GlobalFieldsPage() {
  const [fields, setFields] = useState<Field[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFieldsData()
        setFields(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleDelete(id: string) {
    await deleteGlobalField(id)
    setFields(fields.filter(f => f.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--on-surface-variant)]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--on-surface)]">Global Fields</h2>
          <p className="mt-1 text-[var(--on-surface-variant)]">
            Reusable form fields that can be added to events
          </p>
        </div>
        <Link href="/admin/settings/fields/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </Link>
      </div>

      {fields.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[var(--on-surface-variant)] mb-4">No global fields yet.</p>
          <Link href="/admin/settings/fields/new">
            <Button variant="secondary">
              <Plus className="w-4 h-4 mr-2" />
              Create First Field
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {fields.map((field) => (
            <Card key={field.id} className="flex items-center justify-between group">
              <div>
                <h3 className="font-semibold text-[var(--on-surface)]">{field.label}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">{fieldTypeLabels[field.fieldType]}</Badge>
                  {field.isRequired && <Badge variant="outline">Required</Badge>}
                  {field.options && field.options.length > 0 && (
                    <span className="text-xs text-[var(--on-surface-variant)]">
                      {field.options.length} options
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/settings/fields/${field.id}/edit`}>
                  <Button variant="ghost" size="sm">
                    <Pencil className="w-4 h-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(field.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}