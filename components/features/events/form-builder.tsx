"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { GripVertical, Plus, Trash2, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// Types from schema
interface FieldOption {
  label: string
  value: string
}

type FieldType = "short_text" | "long_text" | "dropdown" | "multiple_choice" | "checkboxes"

interface GlobalField {
  id: string
  label: string
  fieldType: FieldType
  options: FieldOption[] | null
  isRequired: boolean
}

interface FormField {
  id: string
  label: string
  fieldType: FieldType
  options?: FieldOption[]
  isRequired: boolean
  order: number
}

interface CustomQuestion {
  id: string
  question: string
  fieldType: FieldType
  options?: FieldOption[]
  isRequired: boolean
  order: number
}

interface FormBuilderProps {
  globalFields: GlobalField[]
  initialFormFields?: FormField[]
  initialCustomQuestions?: CustomQuestion[]
  onChange: (formFields: FormField[], customQuestions: CustomQuestion[]) => void
}

const fieldTypeLabels: Record<FieldType, string> = {
  short_text: "Short Text",
  long_text: "Long Text",
  dropdown: "Dropdown",
  multiple_choice: "Multiple Choice",
  checkboxes: "Checkboxes",
}

const fieldTypeBadgeColors: Record<FieldType, string> = {
  short_text: "bg-blue-100 text-blue-800",
  long_text: "bg-green-100 text-green-800",
  dropdown: "bg-purple-100 text-purple-800",
  multiple_choice: "bg-orange-100 text-orange-800",
  checkboxes: "bg-pink-100 text-pink-800",
}

// Built-in fields that are always present (First Name, Last Name, Email)
const BUILT_IN_FIELDS = [
  { id: "__firstName__", label: "First Name", fieldType: "short_text" as const, isRequired: true, isBuiltIn: true },
  { id: "__lastName__", label: "Last Name", fieldType: "short_text" as const, isRequired: true, isBuiltIn: true },
  { id: "__email__", label: "Email Address", fieldType: "short_text" as const, isRequired: true, isBuiltIn: true },
]

// Sortable Item Component
interface SortableItemProps {
  id: string
  children: React.ReactNode
  className?: string
}

function SortableItem({ id, children, className }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-[var(--surface-container-lowest)]",
        "border border-transparent",
        "transition-all duration-150",
        isDragging && "opacity-50 shadow-lg scale-[1.02] border-[var(--primary)]/20",
        className
      )}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  )
}

// Built-in Field Item (required but reorderable)
function BuiltInFieldItem({ field }: { field: typeof BUILT_IN_FIELDS[0] }) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <div className="flex items-center justify-center w-5 h-5 rounded-md bg-[var(--primary-container)] text-[var(--on-primary-container)]">
          <Check className="h-3 w-3" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--on-surface)]">
            {field.label}
          </span>
        </div>
      </div>
      <Badge
        variant="default"
        className={cn("text-xs", fieldTypeBadgeColors[field.fieldType])}
      >
        {fieldTypeLabels[field.fieldType]}
      </Badge>
      <Badge variant="secondary" className="text-xs">
        Required
      </Badge>
    </div>
  )
}

// Global Field Item
interface GlobalFieldItemProps {
  field: GlobalField
  isEnabled: boolean
  onToggle: () => void
}

function GlobalFieldItem({ field, isEnabled, onToggle }: GlobalFieldItemProps) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-2 flex-1">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150",
            isEnabled
              ? "bg-[var(--primary)] border-[var(--primary)] text-white"
              : "border-[var(--ghost-border)] hover:border-[var(--primary)]/50"
          )}
        >
          {isEnabled && <Check className="h-3.5 w-3.5" />}
        </button>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-[var(--on-surface)]">
            {field.label}
          </span>
        </div>
      </div>
      <Badge
        variant="default"
        className={cn("text-xs", fieldTypeBadgeColors[field.fieldType])}
      >
        {fieldTypeLabels[field.fieldType]}
      </Badge>
      {field.isRequired && (
        <Badge variant="secondary" className="text-xs">
          Required
        </Badge>
      )}
    </div>
  )
}

// Custom Question Item
interface CustomQuestionItemProps {
  question: CustomQuestion
  onEdit: () => void
  onDelete: () => void
}

function CustomQuestionItem({ question, onEdit, onDelete }: CustomQuestionItemProps) {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-[var(--surface-container-low)] text-[var(--on-surface-variant)]">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex flex-col flex-1">
        <span className="text-sm font-medium text-[var(--on-surface)]">
          {question.question}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <Badge
            variant="default"
            className={cn("text-xs", fieldTypeBadgeColors[question.fieldType])}
          >
            {fieldTypeLabels[question.fieldType]}
          </Badge>
          {question.isRequired && (
            <Badge variant="secondary" className="text-xs">
              Required
            </Badge>
          )}
          {question.options && question.options.length > 0 && (
            <span className="text-xs text-[var(--on-surface-variant)]">
              {question.options.length} options
            </span>
          )}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        className="h-8 px-2 text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
      >
        Edit
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Add Question Dialog
interface AddQuestionDialogProps {
  open: boolean
  onClose: () => void
  onSave: (question: Omit<CustomQuestion, "id" | "order">) => void
  initialData?: CustomQuestion | null
}

function AddQuestionDialog({ open, onClose, onSave, initialData }: AddQuestionDialogProps) {
  const [question, setQuestion] = React.useState(initialData?.question || "")
  const [fieldType, setFieldType] = React.useState<FieldType>(initialData?.fieldType || "short_text")
  const [options, setOptions] = React.useState<string[]>(
    initialData?.options?.map(o => o.label) || []
  )
  const [isRequired, setIsRequired] = React.useState(initialData?.isRequired || false)
  const [optionInput, setOptionInput] = React.useState("")

  React.useEffect(() => {
    if (open) {
      setQuestion(initialData?.question || "")
      setFieldType(initialData?.fieldType || "short_text")
      setOptions(initialData?.options?.map(o => o.label) || [])
      setIsRequired(initialData?.isRequired || false)
      setOptionInput("")
    }
  }, [open, initialData])

  const needsOptions = fieldType === "dropdown" || fieldType === "multiple_choice" || fieldType === "checkboxes"

  const handleAddOption = () => {
    if (optionInput.trim() && !options.includes(optionInput.trim())) {
      setOptions([...options, optionInput.trim()])
      setOptionInput("")
    }
  }

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!question.trim()) return

    onSave({
      question: question.trim(),
      fieldType,
      options: needsOptions ? options.map(o => ({ label: o, value: o })) : undefined,
      isRequired,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Question" : "Add Custom Question"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Question Text</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter your question..."
            />
          </div>

          <div className="space-y-2">
            <Label>Field Type</Label>
            <Select value={fieldType} onValueChange={(v) => setFieldType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short_text">Short Text</SelectItem>
                <SelectItem value="long_text">Long Text</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="checkboxes">Checkboxes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {needsOptions && (
            <div className="space-y-2">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Input
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  placeholder="Add an option..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddOption()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddOption} variant="secondary">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {options.map((opt, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveOption(index)}
                  >
                    {opt} ×
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRequired(!isRequired)}
              className={cn(
                "flex items-center justify-center w-5 h-5 rounded-md border-2 transition-all duration-150",
                isRequired
                  ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                  : "border-[var(--ghost-border)] hover:border-[var(--primary)]/50"
              )}
            >
              {isRequired && <Check className="h-3.5 w-3.5" />}
            </button>
            <Label className="cursor-pointer" onClick={() => setIsRequired(!isRequired)}>
              Required field
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={!question.trim()}>
            {initialData ? "Update" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Main Form Builder Component
export function FormBuilder({
  globalFields,
  initialFormFields = [],
  initialCustomQuestions = [],
  onChange,
}: FormBuilderProps) {
  // Track if this is the initial mount
  const isInitialMount = React.useRef(true)

  // All field IDs in order (built-in + enabled global fields)
  const [allFieldIds, setAllFieldIds] = React.useState<string[]>(() => {
    // Initialize with built-in fields first
    const builtInIds = BUILT_IN_FIELDS.map(f => f.id)
    // Then add existing global field IDs that were enabled
    const globalIds = initialFormFields
      .filter(f => !f.id.startsWith("__"))
      .sort((a, b) => a.order - b.order)
      .map(f => f.id)
    return [...builtInIds, ...globalIds]
  })

  // Track which global fields are enabled
  const [enabledGlobalIds, setEnabledGlobalIds] = React.useState<Set<string>>(() => {
    return new Set(initialFormFields.filter(f => !f.id.startsWith("__")).map(f => f.id))
  })

  const [customQuestions, setCustomQuestions] = React.useState<CustomQuestion[]>(
    () => [...initialCustomQuestions].sort((a, b) => a.order - b.order)
  )
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = React.useState(false)
  const [editingQuestion, setEditingQuestion] = React.useState<CustomQuestion | null>(null)
  const [activeDragId, setActiveDragId] = React.useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Notify parent of changes (skip initial mount)
  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const formFields: FormField[] = allFieldIds
      .filter(id => !id.startsWith("__") && enabledGlobalIds.has(id))
      .map((id, index) => {
        const field = globalFields.find(f => f.id === id)
        return {
          id,
          label: field?.label || "",
          fieldType: field?.fieldType || "short_text",
          options: field?.options || undefined,
          isRequired: field?.isRequired || false,
          order: index,
        }
      })

    const orderedCustomQuestions = customQuestions.map((q, index) => ({
      ...q,
      order: index,
    }))

    onChange(formFields, orderedCustomQuestions)
  }, [allFieldIds, enabledGlobalIds, customQuestions, globalFields, onChange])

  // Get all fields for display (built-in + enabled global)
  const allFieldsForDisplay = allFieldIds.map(id => {
    if (id.startsWith("__")) {
      return BUILT_IN_FIELDS.find(f => f.id === id)
    }
    return globalFields.find(f => f.id === id && enabledGlobalIds.has(id))
  }).filter(Boolean)

  const handleToggleGlobalField = (fieldId: string) => {
    setEnabledGlobalIds(prev => {
      const next = new Set(prev)
      if (next.has(fieldId)) {
        next.delete(fieldId)
        // Remove from allFieldIds
        setAllFieldIds(ids => ids.filter(id => id !== fieldId))
      } else {
        next.add(fieldId)
        // Add to allFieldIds at the end
        setAllFieldIds(ids => {
          if (!ids.includes(fieldId)) {
            return [...ids, fieldId]
          }
          return ids
        })
      }
      return next
    })
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    if (active.id !== over.id) {
      setAllFieldIds(items => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
    setActiveDragId(null)
  }

  const handleCustomDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    if (active.id !== over.id) {
      setCustomQuestions(items => {
        const oldIndex = items.findIndex(i => i.id === active.id)
        const newIndex = items.findIndex(i => i.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
    setActiveDragId(null)
  }

  const handleAddQuestion = (data: Omit<CustomQuestion, "id" | "order">) => {
    const newQuestion: CustomQuestion = {
      ...data,
      id: crypto.randomUUID(),
      order: customQuestions.length,
    }
    setCustomQuestions(prev => [...prev, newQuestion])
  }

  const handleEditQuestion = (data: Omit<CustomQuestion, "id" | "order">) => {
    if (!editingQuestion) return
    setCustomQuestions(prev =>
      prev.map(q =>
        q.id === editingQuestion.id ? { ...q, ...data } : q
      )
    )
    setEditingQuestion(null)
  }

  const handleDeleteQuestion = (id: string) => {
    setCustomQuestions(prev => prev.filter(q => q.id !== id))
  }

  // Disabled global fields (not yet enabled)
  const disabledGlobalFields = globalFields.filter(f => !enabledGlobalIds.has(f.id))

  return (
    <div className="space-y-8">
      {/* All Fields Section (Built-in + Global) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--on-surface)]">
            Registration Fields
          </h3>
          <span className="text-sm text-[var(--on-surface-variant)]">
            {allFieldsForDisplay.length} fields
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-[var(--on-surface-variant)]">
            Drag to reorder all fields. Built-in fields (First Name, Last Name, Email) are always required and cannot be disabled.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={(e) => setActiveDragId(e.active.id as string)}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={allFieldIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {allFieldsForDisplay.map((field) => {
                  if (!field) return null

                  // Built-in field
                  if ("isBuiltIn" in field && field.isBuiltIn) {
                    return (
                      <SortableItem key={field.id} id={field.id}>
                        <BuiltInFieldItem field={field} />
                      </SortableItem>
                    )
                  }

                  // Global field
                  return (
                    <SortableItem key={field.id} id={field.id}>
                      <GlobalFieldItem
                        field={field as GlobalField}
                        isEnabled={true}
                        onToggle={() => handleToggleGlobalField(field.id)}
                      />
                    </SortableItem>
                  )
                })}
              </div>
            </SortableContext>

            {/* Available global fields (disabled) */}
            {disabledGlobalFields.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-[var(--surface-container-high)]">
                <p className="text-xs font-medium text-[var(--on-surface-variant)] uppercase tracking-wider">
                  Available Global Fields
                </p>
                {disabledGlobalFields.map(field => (
                  <div
                    key={field.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-container-low)]/50 opacity-70"
                  >
                    <div className="p-1.5 text-[var(--on-surface-variant)]/30">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleGlobalField(field.id)}
                        className="flex items-center justify-center w-5 h-5 rounded-md border-2 border-[var(--ghost-border)] hover:border-[var(--primary)]/50 transition-all duration-150"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--on-surface)]">
                          {field.label}
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant="default"
                      className={cn("text-xs", fieldTypeBadgeColors[field.fieldType])}
                    >
                      {fieldTypeLabels[field.fieldType]}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            <DragOverlay>
              {activeDragId && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-container-lowest)] shadow-lg border border-[var(--primary)]/20 opacity-90">
                  <div className="p-1.5 text-[var(--on-surface-variant)]">
                    <GripVertical className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-[var(--on-surface)]">
                    {BUILT_IN_FIELDS.find(f => f.id === activeDragId)?.label ||
                     globalFields.find(f => f.id === activeDragId)?.label ||
                     customQuestions.find(q => q.id === activeDragId)?.question}
                  </span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>

      {/* Custom Questions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--on-surface)]">
            Custom Questions
          </h3>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingQuestion(null)
              setIsQuestionDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Question
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleCustomDragEnd}
          onDragStart={(e) => setActiveDragId(e.active.id as string)}
          modifiers={[restrictToVerticalAxis]}
        >
          <SortableContext
            items={customQuestions.map(q => q.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {customQuestions.length === 0 ? (
                <div className="p-8 text-center rounded-xl bg-[var(--surface-container-low)] border border-dashed border-[var(--ghost-border)]">
                  <p className="text-sm text-[var(--on-surface-variant)]">
                    No custom questions yet.
                  </p>
                  <p className="text-xs text-[var(--on-surface-variant)]/70 mt-1">
                    Click &quot;Add Question&quot; to create custom fields for this event.
                  </p>
                </div>
              ) : (
                customQuestions.map(question => (
                  <SortableItem key={question.id} id={question.id}>
                    <CustomQuestionItem
                      question={question}
                      onEdit={() => {
                        setEditingQuestion(question)
                        setIsQuestionDialogOpen(true)
                      }}
                      onDelete={() => handleDeleteQuestion(question.id)}
                    />
                  </SortableItem>
                ))
              )}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeDragId && customQuestions.find(q => q.id === activeDragId) && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-container-lowest)] shadow-lg border border-[var(--primary)]/20 opacity-90">
                <div className="p-1.5 text-[var(--on-surface-variant)]">
                  <GripVertical className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-[var(--on-surface)]">
                  {customQuestions.find(q => q.id === activeDragId)?.question}
                </span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Add/Edit Question Dialog */}
      <AddQuestionDialog
        open={isQuestionDialogOpen}
        onClose={() => {
          setIsQuestionDialogOpen(false)
          setEditingQuestion(null)
        }}
        onSave={editingQuestion ? handleEditQuestion : handleAddQuestion}
        initialData={editingQuestion}
      />
    </div>
  )
}

export default FormBuilder