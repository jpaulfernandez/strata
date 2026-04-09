"use client"

import { useState, useEffect } from "react"
import { Plus, UserCog, Trash2, Loader2 } from "lucide-react"
import { getStaffData, removeStaff } from "@/server/actions/staff"
import { Button, Badge, Card } from "@/components/ui"

const roleLabels: Record<string, { label: string; badge: string }> = {
  super_admin: { label: "Super Admin", badge: "default" },
  admin: { label: "Admin", badge: "secondary" },
  staff: { label: "Staff", badge: "outline" },
}

interface StaffMember {
  id: string
  email: string
  fullName: string | null
  role: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getStaffData()
        setStaff(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  async function handleRemove(id: string) {
    if (!confirm("Are you sure you want to remove this staff member?")) return
    await removeStaff(id)
    setStaff(staff.filter(s => s.id !== id))
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
          <h2 className="text-2xl font-bold text-[var(--on-surface)]">Staff Members</h2>
          <p className="mt-1 text-[var(--on-surface-variant)]">
            Manage team members and their roles
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[var(--on-surface-variant)]">No staff members yet.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <Card key={member.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center">
                  <span className="text-sm font-medium text-[var(--on-primary)]">
                    {member.fullName?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--on-surface)]">{member.fullName}</h3>
                  <p className="text-sm text-[var(--on-surface-variant)]">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={roleLabels[member.role]?.badge as any || "outline"}>
                  {roleLabels[member.role]?.label || member.role}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm">
                    <UserCog className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(member.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}