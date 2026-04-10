"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Html5Qrcode } from "html5-qrcode"
import { checkInByQrToken, checkInByEmail, toggleVipStatus, getRegistrantsForEvent } from "@/server/actions/checkin"
import { getEvent } from "@/server/actions/events"
import type { Registrant, Event } from "@/lib/db/schema"
import { Button, Input } from "@/components/ui"
import { cn } from "@/lib/utils"
import { ArrowLeft, Check, X, AlertCircle, Star, Loader2, Keyboard, CameraOff, History, BarChart3, QrCode, Users } from "lucide-react"
import Link from "next/link"

// CSS to hide html5-qrcode default UI
const hideScannerUI = `
  #qr-scanner-video-container {
    padding: 0 !important;
    border: none !important;
  }
  .html5-qrcode-element {
    display: none !important;
  }
  .qr-shaded-region {
    display: none !important;
    border: none !important;
    background: transparent !important;
  }
  #html5-qrcode-button-camera-permission,
  #html5-qrcode-button-camera-start {
    display: none !important;
  }
`

// Check-in result slide-up panel (mobile-optimized)
function CheckInPanel({
  result,
  onClose,
  onVipToggle,
}: {
  result: {
    success: boolean
    registrant?: Registrant
    message: string
    alreadyCheckedIn?: boolean
  }
  onClose: () => void
  onVipToggle: () => void
}) {
  const [vipToggled, setVipToggled] = React.useState(false)
  const [isConfirming, setIsConfirming] = React.useState(false)

  if (!result.success) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="bg-white shadow-[0_-12px_40px_rgba(74,69,75,0.1)] rounded-t-[2.5rem] p-8 pb-12">
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8" />

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-100 flex items-center justify-center">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Not Found</h3>
            <p className="text-sm text-gray-500 mb-6">{result.message}</p>

            <button
              onClick={onClose}
              className="w-full py-4 px-6 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition-colors active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  const registrant = result.registrant!
  const initials = `${registrant.firstName[0]}${registrant.lastName[0]}`.toUpperCase()

  const handleConfirm = async () => {
    setIsConfirming(true)
    onClose()
    setIsConfirming(false)
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50">
      <div className="bg-white shadow-[0_-12px_40px_rgba(74,69,75,0.1)] rounded-t-[2.5rem] p-8 pb-12">
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-8" />

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-purple-200 bg-gradient-to-br from-[#2e2536] to-[#453b4d] flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {registrant.firstName} {registrant.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {(registrant.isVip || vipToggled) && (
                  <span className="flex items-center gap-1 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                    <Star className="w-3 h-3 fill-current" />
                    VIP
                  </span>
                )}
                <span className="text-gray-500 text-[11px] font-medium uppercase tracking-wider">
                  Ticket #{registrant.qrToken.slice(0, 8)}
                </span>
              </div>
            </div>
          </div>

          <div className={cn(
            "p-3 rounded-2xl",
            result.alreadyCheckedIn ? "bg-amber-100" : "bg-green-100"
          )}>
            {result.alreadyCheckedIn ? (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            ) : (
              <Check className="w-6 h-6 text-green-600" />
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Status
            </p>
            <p className={cn(
              "font-bold",
              result.alreadyCheckedIn ? "text-amber-600" : "text-green-600"
            )}>
              {result.alreadyCheckedIn ? "Already Checked In" : "Ready to Check-in"}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
              Email
            </p>
            <p className="text-gray-900 font-bold text-sm truncate">
              {registrant.email}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-full border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors active:scale-95"
          >
            Discard
          </button>
          {!result.alreadyCheckedIn && !registrant.isVip && !vipToggled && (
            <button
              onClick={() => {
                onVipToggle()
                setVipToggled(true)
              }}
              className="flex-1 py-4 px-6 rounded-full bg-amber-500 text-white font-bold hover:bg-amber-400 transition-colors flex items-center justify-center gap-2 active:scale-95"
            >
              <Star className="w-4 h-4" />
              VIP
            </button>
          )}
          <button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="flex-[2] py-4 px-6 rounded-full bg-gradient-to-br from-[#2e2536] to-[#453b4d] text-white font-bold shadow-lg hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-50"
          >
            {isConfirming ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : result.alreadyCheckedIn ? (
              "Close"
            ) : (
              "Confirm Check-in"
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// Manual check-in modal
function ManualCheckInModal({
  eventId,
  onClose,
  onSuccess,
}: {
  eventId: string
  onClose: () => void
  onSuccess: (registrant: Registrant, alreadyCheckedIn?: boolean) => void
}) {
  const [email, setEmail] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsSubmitting(true)
    setError(null)

    const result = await checkInByEmail(eventId, email.trim())

    if (result.success && result.registrant) {
      onSuccess(result.registrant, result.alreadyCheckedIn)
    } else {
      setError(result.error || "Failed to check in")
    }

    setIsSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-[2rem] p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <Keyboard className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Manual Entry</h3>
            <p className="text-sm text-gray-500">Check in by email address</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 ml-1 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="registrant@email.com"
                disabled={isSubmitting}
                className="w-full px-5 py-4 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-purple-300 transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-4 rounded-full font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className="flex-1 py-4 rounded-full font-bold"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Check In"
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

// Stats Panel
function StatsPanel({
  stats,
  onClose,
}: {
  stats: { total: number; checkedIn: number; vips: number }
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-30 bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="font-bold text-gray-900">Statistics</h1>
        <div className="w-12" />
      </div>
      <div className="flex-1 p-6">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm">
            <Users className="w-8 h-8 text-purple-600 mb-3" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Registered</p>
            <p className="text-3xl font-extrabold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm">
            <Check className="w-8 h-8 text-green-500 mb-3" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Checked In</p>
            <p className="text-3xl font-extrabold text-green-600">{stats.checkedIn}</p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] shadow-sm col-span-2">
            <Star className="w-8 h-8 text-amber-500 mb-3" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">VIP Guests</p>
            <p className="text-3xl font-extrabold text-amber-500">{stats.vips}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

// History Panel
function HistoryPanel({
  registrants,
  onClose,
}: {
  registrants: Registrant[]
  onClose: () => void
}) {
  const checkedIn = registrants.filter(r => r.checkedIn).slice(0, 20)

  return (
    <div className="fixed inset-0 z-30 bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button onClick={onClose} className="flex items-center gap-2 text-gray-500">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <h1 className="font-bold text-gray-900">Recent Check-ins</h1>
        <div className="w-12" />
      </div>

      <div className="flex-1 overflow-auto p-4">
        {checkedIn.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No check-ins yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {checkedIn.map((r) => {
              const initials = `${r.firstName[0]}${r.lastName[0]}`.toUpperCase()
              return (
                <div key={r.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2e2536] to-[#453b4d] flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{r.email}</p>
                  </div>
                  {r.isVip && (
                    <Star className="w-5 h-5 text-amber-500 fill-current" />
                  )}
                  <Check className="w-5 h-5 text-green-500" />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ScannerPage() {
  const params = useParams()
  const eventId = params.id as string

  const [event, setEvent] = React.useState<Event | null>(null)
  const [registrants, setRegistrants] = React.useState<Registrant[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [activePanel, setActivePanel] = React.useState<"scan" | "history" | "stats" | null>(null)
  const [showManualModal, setShowManualModal] = React.useState(false)
  const [checkInResult, setCheckInResult] = React.useState<{
    success: boolean
    registrant?: Registrant
    message: string
    alreadyCheckedIn?: boolean
  } | null>(null)
  const [cameraError, setCameraError] = React.useState<string | null>(null)

  const scannerRef = React.useRef<Html5Qrcode | null>(null)
  const hasStartedRef = React.useRef(false)

  // Load event and registrants
  React.useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      const result = await getEvent(eventId)
      if (result) {
        setEvent(result)
        const regs = await getRegistrantsForEvent(eventId)
        setRegistrants(regs)
      } else {
        setError("Event not found")
      }
      setIsLoading(false)
    }
    loadData()
  }, [eventId])

  // Start scanner
  const startScanner = React.useCallback(async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true

    setCameraError(null)

    // Request camera permission explicitly
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      })
      stream.getTracks().forEach(track => track.stop())
    } catch (permError) {
      console.error("Camera permission denied:", permError)
      setCameraError("Camera permission denied. Please allow camera access.")
      hasStartedRef.current = false
      return
    }

    try {
      scannerRef.current = new Html5Qrcode(`qr-scanner-${eventId}`, { verbose: false })

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
        },
        async (decodedText) => {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop()
            hasStartedRef.current = false
          }

          // Extract token from URL or use raw text
          // QR codes contain URLs like: http://localhost:3000/ticket/{token}
          // or just the token UUID directly
          let qrToken = decodedText
          try {
            const url = new URL(decodedText)
            // Extract token from /ticket/{token} path
            const pathParts = url.pathname.split('/')
            if (pathParts[1] === 'ticket' && pathParts[2]) {
              qrToken = pathParts[2]
            }
          } catch {
            // If decodedText is not a valid URL, it might be the raw token
            // Use it directly
          }

          try {
            const result = await checkInByQrToken(eventId, qrToken)
            setCheckInResult({
              success: result.success,
              registrant: result.registrant,
              message: result.error || "Check-in successful",
              alreadyCheckedIn: result.alreadyCheckedIn,
            })
          } catch (err) {
            setCheckInResult({
              success: false,
              message: err instanceof Error ? err.message : "Check-in failed",
            })
          }
        },
        () => {} // Ignore scan errors
      )
    } catch (err) {
      console.error("Failed to start scanner:", err)
      setCameraError(err instanceof Error ? err.message : "Failed to access camera")
      hasStartedRef.current = false
    }
  }, [eventId])

  // Stop scanner
  const stopScanner = React.useCallback(async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
        hasStartedRef.current = false
      } catch (err) {
        console.error("Failed to stop scanner:", err)
      }
    }
  }, [])

  // Initialize scanner on mount
  React.useEffect(() => {
    if (!isLoading && !error && event) {
      startScanner()
    }
    return () => {
      stopScanner()
    }
  }, [isLoading, error, event, startScanner, stopScanner])

  // Handle manual check-in success
  const handleManualSuccess = (registrant: Registrant, alreadyCheckedIn?: boolean) => {
    setShowManualModal(false)
    setCheckInResult({
      success: true,
      registrant,
      message: alreadyCheckedIn ? "Already checked in" : "Check-in successful",
      alreadyCheckedIn,
    })
  }

  // Handle VIP toggle
  const handleVipToggle = async () => {
    if (checkInResult?.registrant) {
      await toggleVipStatus(eventId, checkInResult.registrant.id)
    }
  }

  // Close overlay and resume scanning
  const handleCloseOverlay = async () => {
    setCheckInResult(null)
    setTimeout(startScanner, 100)
  }

  // Stats calculations
  const stats = React.useMemo(() => ({
    total: registrants.length,
    checkedIn: registrants.filter(r => r.checkedIn).length,
    vips: registrants.filter(r => r.isVip).length,
  }), [registrants])

  // Update registrants when check-in happens
  React.useEffect(() => {
    if (checkInResult?.success && checkInResult.registrant) {
      setRegistrants(prev => prev.map(r =>
        r.id === checkInResult.registrant?.id
          ? { ...r, checkedIn: true }
          : r
      ))
    }
  }, [checkInResult])

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-white mx-auto mb-4" />
          <p className="text-white/60">Loading scanner...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md mx-auto text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Error</h2>
          <p className="text-white/60 mb-6">{error || "Event not found"}</p>
          <Link href="/admin/events">
            <Button className="rounded-full">Back to Events</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-black relative overflow-hidden">
      {/* Hide html5-qrcode default UI */}
      <style dangerouslySetInnerHTML={{ __html: hideScannerUI }} />

      {/* Camera View - Full Screen */}
      <div
        id={`qr-scanner-${eventId}`}
        className="absolute inset-0 z-0"
      />

      {/* Top Header */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 pt-8">
        <div className="flex items-center justify-between">
          <Link href="/admin/events" className="flex items-center gap-2 text-white/80 hover:text-white bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <h1 className="font-bold text-white text-sm bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full max-w-[50%] truncate">
            {event.title}
          </h1>
          <div className="w-20" />
        </div>
      </div>

      {/* Scanner Frame Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Focus Window with Cutout */}
        <div className="relative w-72 h-72">
          {/* Cutout effect */}
          <div
            className="absolute inset-0 rounded-[2rem]"
            style={{ boxShadow: '0 0 0 2000px rgba(0, 0, 0, 0.6)' }}
          />

          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-14 h-14 border-t-4 border-l-4 border-[#cec2d6] rounded-tl-[2rem]" />
          <div className="absolute top-0 right-0 w-14 h-14 border-t-4 border-r-4 border-[#cec2d6] rounded-tr-[2rem]" />
          <div className="absolute bottom-0 left-0 w-14 h-14 border-b-4 border-l-4 border-[#cec2d6] rounded-bl-[2rem]" />
          <div className="absolute bottom-0 right-0 w-14 h-14 border-b-4 border-r-4 border-[#cec2d6] rounded-br-[2rem]" />

          {/* Scanning Line */}
          <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-[#cec2d6]/70 shadow-[0_0_12px_rgba(206,194,214,0.6)]" />
        </div>

        <p className="mt-8 text-white/80 font-medium tracking-wide text-center px-4">
          {cameraError ? "Camera unavailable" : "Align QR Code within the frame"}
        </p>
      </div>

      {/* Camera Error Overlay */}
      {cameraError && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/80">
          <div className="text-center text-white p-8 max-w-md">
            <CameraOff className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold mb-2">Camera Access Required</h3>
            <p className="text-sm text-white/70 mb-6">{cameraError}</p>
            <button
              onClick={startScanner}
              className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-white/90 transition-colors active:scale-95"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="absolute bottom-0 left-0 right-0 z-40 flex justify-around items-center px-6 pb-8 pt-4 bg-white/95 backdrop-blur-xl rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.15)]">
        <button
          onClick={() => { stopScanner(); setActivePanel(null); startScanner() }}
          className={cn(
            "flex flex-col items-center justify-center rounded-2xl px-4 py-2 transition-all duration-300",
            !activePanel
              ? "bg-[#2e2536] text-white scale-110"
              : "text-gray-500 active:scale-95"
          )}
        >
          <QrCode className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider mt-1">Scanner</span>
        </button>
        <button
          onClick={() => { stopScanner(); setActivePanel("history") }}
          className={cn(
            "flex flex-col items-center justify-center py-2 transition-all",
            activePanel === "history"
              ? "text-[#2e2536]"
              : "text-gray-500 active:scale-95"
          )}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider mt-1">History</span>
        </button>
        <button
          onClick={() => { stopScanner(); setActivePanel("stats") }}
          className={cn(
            "flex flex-col items-center justify-center py-2 transition-all",
            activePanel === "stats"
              ? "text-[#2e2536]"
              : "text-gray-500 active:scale-95"
          )}
        >
          <BarChart3 className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider mt-1">Stats</span>
        </button>
        <button
          onClick={() => { stopScanner(); setShowManualModal(true) }}
          className={cn(
            "flex flex-col items-center justify-center py-2 transition-all",
            showManualModal
              ? "text-[#2e2536]"
              : "text-gray-500 active:scale-95"
          )}
        >
          <Keyboard className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-wider mt-1">Manual</span>
        </button>
      </nav>

      {/* Stats Panel */}
      {activePanel === "stats" && (
        <StatsPanel
          stats={stats}
          onClose={() => { setActivePanel(null); startScanner() }}
        />
      )}

      {/* History Panel */}
      {activePanel === "history" && (
        <HistoryPanel
          registrants={registrants}
          onClose={() => { setActivePanel(null); startScanner() }}
        />
      )}

      {/* Manual Check-in Modal */}
      {showManualModal && (
        <ManualCheckInModal
          eventId={eventId}
          onClose={() => { setShowManualModal(false); startScanner() }}
          onSuccess={handleManualSuccess}
        />
      )}

      {/* Check-in Result Panel */}
      {checkInResult && (
        <CheckInPanel
          result={checkInResult}
          onClose={handleCloseOverlay}
          onVipToggle={handleVipToggle}
        />
      )}
    </div>
  )
}