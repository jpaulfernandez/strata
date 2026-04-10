"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const generatedId = React.useId()
    const textareaId = id || generatedId

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-[var(--on-surface-variant)] mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            "flex min-h-[80px] w-full px-3 py-2 text-sm",
            "bg-[var(--surface-container-high)]",
            "border-none rounded-[0.75rem]",
            "text-[var(--on-surface)]",
            "placeholder:text-[var(--on-surface-variant)]/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:bg-[var(--surface-container-highest)]",
            "transition-all duration-150",
            "resize-none",
            error && "ring-2 ring-red-500 focus-visible:ring-red-500",
            className
          )}
          style={{ transitionTimingFunction: "var(--transition-smooth)" }}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-red-500">{error}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }