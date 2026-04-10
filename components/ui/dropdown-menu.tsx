"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: "left" | "right"
}

export function DropdownMenu({ trigger, children, align = "right" }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [position, setPosition] = React.useState({ top: 0, left: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Calculate position when opening
  const updatePosition = React.useCallback(() => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: rect.bottom + window.scrollY + 4,
        left: align === "right" ? rect.right - 160 : rect.left,
      })
    }
  }, [align])

  React.useEffect(() => {
    if (isOpen) {
      updatePosition()
    }
  }, [isOpen, updatePosition])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleScroll() {
      if (isOpen) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("scroll", handleScroll, true)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("scroll", handleScroll, true)
    }
  }, [isOpen])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const menuContent = isOpen && (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[160px] rounded-xl bg-[var(--surface-container-lowest)] shadow-lg border border-[var(--ghost-border)] py-1"
      style={{
        top: position.top,
        left: position.left,
      }}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ onClick?: () => void }>, {
              onClick: () => {
                setIsOpen(false)
                ;(child.props as { onClick?: () => void }).onClick?.()
              },
            })
          : child
      )}
    </div>
  )

  return (
    <>
      <div ref={triggerRef} onClick={handleToggle} className="cursor-pointer">
        {trigger}
      </div>
      {typeof window !== "undefined" && menuContent && createPortal(menuContent, document.body)}
    </>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
}

export function DropdownMenuItem({ children, onClick, className, disabled }: DropdownMenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "w-full text-left px-4 py-2 text-sm text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-[var(--ghost-border)] my-1" />
}