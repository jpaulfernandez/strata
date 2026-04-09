"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive"
  size?: "sm" | "md" | "lg"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
          // Size variants
          size === "sm" && "h-8 px-3 text-sm rounded-full",
          size === "md" && "h-10 px-5 text-sm rounded-full",
          size === "lg" && "h-12 px-6 text-base rounded-full",
          // Primary variant - gradient from primary to primary_container
          variant === "primary" && [
            "bg-gradient-to-br from-[var(--primary)] to-[var(--primary-container)]",
            "text-[var(--on-primary)]",
            "shadow-sm",
            "hover:scale-[1.02]",
            "hover:shadow-[var(--shadow-ghost)]",
            "active:scale-[0.98]",
          ],
          // Secondary variant - ghost border
          variant === "secondary" && [
            "bg-transparent",
            "border border-[var(--ghost-border)]",
            "text-[var(--on-surface)]",
            "hover:bg-[var(--surface-container-low)]",
          ],
          // Ghost variant - text only
          variant === "ghost" && [
            "bg-transparent",
            "text-[var(--on-surface-variant)]",
            "hover:bg-[var(--surface-container-low)]",
            "hover:text-[var(--on-surface)]",
          ],
          // Destructive variant
          variant === "destructive" && [
            "bg-red-600",
            "text-white",
            "hover:bg-red-700",
          ],
          className
        )}
        style={{ transitionTimingFunction: "var(--transition-smooth)" }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }