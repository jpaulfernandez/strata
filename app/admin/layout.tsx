"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Settings, Calendar, LogOut, FileText, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const adminNavItems = [
  {
    title: "Events",
    href: "/admin/events",
    icon: Calendar,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
    subItems: [
      { title: "Fields", href: "/admin/settings/fields", icon: FileText },
      { title: "Staff", href: "/admin/settings/staff", icon: Users },
    ],
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--ghost-border)]">
        <div className="flex items-center justify-between h-16 px-6">
          <Link
            href="/admin"
            className="text-xl font-semibold bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] bg-clip-text text-transparent font-[var(--font-manrope)]"
          >
            Strata
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="pt-16">
        <div className="flex gap-6 p-6">
          {/* Floating Sidebar */}
          <aside className="sticky top-22 self-start w-48 shrink-0">
            <nav className="bg-[var(--surface-container-lowest)]/90 backdrop-blur-xl rounded-2xl p-3 shadow-[0_12px_40px_rgba(74,69,75,0.08)] border border-[var(--ghost-border)]">
              <div className="space-y-1">
                {adminNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                  const isSubItemActive = item.subItems?.some(
                    (sub) => pathname === sub.href || pathname.startsWith(sub.href + "/")
                  )

                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                          (isActive || isSubItemActive)
                            ? "bg-gradient-to-r from-[var(--primary)] to-[var(--primary-container)] text-white shadow-sm"
                            : "text-[var(--on-surface-variant)] hover:bg-[var(--secondary-container)] hover:text-[var(--on-surface)]"
                        )}
                      >
                        <item.icon className="w-5 h-5 shrink-0" />
                        {item.title}
                      </Link>

                      {/* Sub Items */}
                      {item.subItems && (isActive || isSubItemActive) && (
                        <div className="mt-1 ml-4 pl-4 border-l border-[var(--ghost-border)] space-y-1">
                          {item.subItems.map((subItem) => {
                            const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/")
                            return (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className={cn(
                                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                  isSubActive
                                    ? "text-[var(--primary)] font-medium"
                                    : "text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]"
                                )}
                              >
                                <subItem.icon className="w-4 h-4 shrink-0" />
                                {subItem.title}
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--ghost-border)]">
                <Link
                  href="/login/signout"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    "text-[var(--on-surface-variant)] hover:bg-red-50 hover:text-red-600"
                  )}
                >
                  <LogOut className="w-5 h-5 shrink-0" />
                  Sign Out
                </Link>
              </div>
            </nav>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </main>
    </div>
  )
}