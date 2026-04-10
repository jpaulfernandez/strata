"use client"

import * as React from "react"
import { getGlobalSettings, updateGlobalSettings } from "@/server/actions/settings"
import { exportAllRegistrantsCsv } from "@/server/actions/export"
import { Button } from "@/components/ui"
import { Loader2, Save, MessageSquare, Mail, Download, FileSpreadsheet } from "lucide-react"

export default function GeneralSettingsPage() {
  const [ticketMessage, setTicketMessage] = React.useState("")
  const [emailTemplate, setEmailTemplate] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isExporting, setIsExporting] = React.useState(false)
  const [success, setSuccess] = React.useState<"ticket" | "email" | null>(null)

  React.useEffect(() => {
    async function loadSettings() {
      const settings = await getGlobalSettings()
      setTicketMessage(settings.ticketMessage || "")
      setEmailTemplate(settings.defaultEmailTemplate || "")
      setIsLoading(false)
    }
    loadSettings()
  }, [])

  const handleSaveTicket = async () => {
    setIsSaving(true)
    setSuccess(null)

    const result = await updateGlobalSettings({ ticketMessage })

    if (result.success) {
      setSuccess("ticket")
      setTimeout(() => setSuccess(null), 3000)
    }

    setIsSaving(false)
  }

  const handleSaveEmail = async () => {
    setIsSaving(true)
    setSuccess(null)

    const result = await updateGlobalSettings({ defaultEmailTemplate: emailTemplate || null })

    if (result.success) {
      setSuccess("email")
      setTimeout(() => setSuccess(null), 3000)
    }

    setIsSaving(false)
  }

  const handleExportAllEvents = async () => {
    setIsExporting(true)
    try {
      const csv = await exportAllRegistrantsCsv()
      if (csv) {
        // Create download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `all-events-registrants-${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error("Export failed:", error)
    }
    setIsExporting(false)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-8">
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
              {success === "ticket" && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
              <Button
                onClick={handleSaveTicket}
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

      {/* Default Email Template */}
      <div className="bg-[var(--surface-container-lowest)] rounded-[1.5rem] p-6 shadow-ghost border border-[var(--outline-variant)]/10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[var(--primary-container)]/30 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div>
            <h2 className="font-headline font-bold text-[var(--on-surface)] text-lg">Default Email Template</h2>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Customize the confirmation email sent to registrants. Leave empty to use the default template.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <textarea
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows={10}
            placeholder="<h1>You're Registered!</h1>&#10;<p>Hi {{firstName}},</p>&#10;<p>Your ticket for {{eventName}} is confirmed!</p>&#10;<p><a href=&quot;{{ticketUrl}}&quot;>View Your Ticket</a></p>"
            className="w-full px-4 py-3 rounded-xl bg-[var(--surface-container-low)] border border-[var(--outline-variant)]/20 text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)]/50 focus:outline-none focus:ring-2 focus:ring-[var(--primary-container)] transition-all resize-none font-mono text-sm"
          />

          {/* Available Variables */}
          <div className="p-4 rounded-xl bg-[var(--surface-container-low)]">
            <p className="text-xs font-label font-semibold uppercase tracking-widest text-[var(--on-surface-variant)] mb-2">
              Available Variables
            </p>
            <div className="flex flex-wrap gap-2">
              {["firstName", "lastName", "fullName", "email", "eventName", "eventDate", "eventTime", "eventLocation", "ticketUrl", "eventSlug"].map((v) => (
                <code key={v} className="px-2 py-1 rounded bg-[var(--surface-container)] text-xs text-[var(--on-surface)]">
                  {`{{${v}}}`}
                </code>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--on-surface-variant)]">
              {emailTemplate.length} characters • HTML supported
            </p>

            <div className="flex items-center gap-3">
              {success === "email" && (
                <span className="text-sm text-green-600 font-medium">Saved!</span>
              )}
              <Button
                onClick={handleSaveEmail}
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
                    Save Template
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Export All Events */}
      <div className="bg-[var(--surface-container-lowest)] rounded-[1.5rem] p-6 shadow-ghost border border-[var(--outline-variant)]/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[var(--tertiary-container)]/30 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-[var(--primary)]" />
          </div>
          <div className="flex-1">
            <h2 className="font-headline font-bold text-[var(--on-surface)] text-lg">Export All Events Report</h2>
            <p className="text-sm text-[var(--on-surface-variant)] mb-4">
              Download a CSV file containing all registrants across all events.
            </p>
            <Button
              variant="secondary"
              onClick={handleExportAllEvents}
              disabled={isExporting}
              className="rounded-full"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download CSV
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}