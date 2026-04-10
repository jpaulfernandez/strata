"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, X } from "lucide-react"
import { getStaffData, removeStaff, addStaff } from "@/server/actions/staff"
import { Button, Badge, Card, Input, Label } from "@/components/ui"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const roleLabels: Record<string, { label: string; badge: "primary" | "secondary" | "outline" }> = {
  super_admin: { label: "Super Admin", badge: "primary" },
  admin: { label: "Admin", badge: "secondary" },
  staff: { label: "Staff", badge: "outline" },
}

interface StaffMember {
  id: string
  email: string
  name: string | null
  role: string
}

export default function StaffPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"admin" | "staff">("staff")

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
    const result = await removeStaff(id)
    if (result.success) {
      setStaff(staff.filter(s => s.id !== id))
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await addStaff({ name, email, password, role })

    if (result.success) {
      // Refresh staff list
      const data = await getStaffData()
      setStaff(data)
      setShowAddModal(false)
      // Reset form
      setName("")
      setEmail("")
      setPassword("")
      setRole("staff")
    } else {
      setError(result.error || "Failed to add staff member")
    }

    setIsSubmitting(false)
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
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-[var(--on-surface-variant)]">No staff members yet.</p>
          <Button onClick={() => setShowAddModal(true)} variant="secondary" className="mt-4">
            Add your first staff member
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {staff.map((member) => (
            <Card key={member.id} className="flex items-center justify-between group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--primary-container)] flex items-center justify-center">
                  <span className="text-sm font-medium text-[var(--on-primary)]">
                    {member.name?.charAt(0).toUpperCase() || "U"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--on-surface)]">{member.name}</h3>
                  <p className="text-sm text-[var(--on-surface-variant)]">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={roleLabels[member.role]?.badge || "outline"}>
                  {roleLabels[member.role]?.label || member.role}
                </Badge>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      {/* Add Staff Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Staff Member</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as "admin" | "staff")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-[var(--on-surface-variant)]">
                Staff can check in attendees. Admins can manage events and settings.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Staff Member"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}