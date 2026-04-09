import Link from "next/link"
import { Settings, Calendar, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"

export const dynamic = 'force-dynamic'

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
  },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--surface)]">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-40 glass border-b border-[var(--ghost-border)]">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="text-xl font-semibold text-[var(--on-surface)] font-[var(--font-manrope)]"
            >
              EventFlow
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className="fixed left-0 top-16 bottom-0 w-64 bg-[var(--surface-container-low)] border-r border-[var(--ghost-border)] p-4 overflow-y-auto">
        <nav className="space-y-1">
          {adminNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all",
                "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-lowest)] hover:text-[var(--on-surface)]"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Link
            href="/login/signout"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-full text-sm font-medium transition-all",
              "text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-lowest)] hover:text-[var(--on-surface)]"
            )}
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="pl-64 pt-16">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}