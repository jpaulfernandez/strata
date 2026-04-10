"use client"

import * as React from "react"
import { getGlobalSettings, updateGlobalSettings } from "@/server/actions/settings"
import { Button } from "@/components/ui"
import { Loader2, Save, MessageSquare } from "lucide-react"

export default function GeneralSettingsPage() {
  const [ticketMessage, setTicketMessage] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [success, setSuccess] = React.useState(false)

  React.useEffect(() => {
    async function loadSettings() {
      const settings = await getGlobalSettings()
      setTicketMessage(settings.ticketMessage || "")
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    setSuccess(false)

    const result = await updateGlobalSettings({ ticketMessage })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }

    setIsSaving(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-headline font-bold text-[var(--on-surface)] mb-2">General Settings</h1>
        <p className="text-[var(--on-surface-variant)]">Configure global settings for your event platform.</p>
      </div>

      {/* E-Ticket Message */}
      <div className="bg-[var(--surface-container-lowest)] rounded-[1.5rem] p-6 shadow-ghost border border-[var(--outline-variant)]/10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--secondary-container)] flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-[var(--on-secondary-container)]" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-[var(--on-surface)] text-lg">E-Ticket Message</h2>
            <p className="text-sm text-[var(--on-surface-variant)]">
              This message appears on the ticket page below the QR code. Use it to give attendees instructions.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={ticketMessage}
            onChange={(e) => setTicketMessage(e.target.value)}
            rows={3}
            placeholder="Enter the message to display on e-tickets..."
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all resize-none"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--on-surface-variant)]">
              {ticketMessage.length} characters
            </p>

            <div className="flex items-center gap-3">
              {success && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-full px-6"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6 pt-6 border-t border-[var(--outline-variant)]/10">
          <p className="text-xs font-label font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] mb-3">
            Preview
          </p>
          <div className="p-4 rounded-xl bg-[var(--surface-container-low)] text-center">
            <p className="text-sm text-[var(--on-surface-variant)]">
              {ticketMessage || "No message set"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}