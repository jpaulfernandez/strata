"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "warning" | "error"
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          "transition-colors",
          variant === "default" && "bg-[var(--primary-container)] text-[var(--on-primary)]",
          variant === "secondary" && "bg-[var(--secondary-container)] text-[var(--on-secondary-container)]",
          variant === "outline" && "border border-[var(--ghost-border)] text-[var(--on-surface-variant)]",
          variant === "success" && "bg-green-100 text-green-800",
          variant === "warning" && "bg-yellow-100 text-yellow-800",
          variant === "error" && "bg-red-100 text-red-800",
          className
        )}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge }