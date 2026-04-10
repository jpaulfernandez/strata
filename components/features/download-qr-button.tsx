"use client"

import * as React from "react"
import { Download } from "lucide-react"

interface DownloadQrButtonProps {
  qrCodeDataUrl: string
  registrantName: string
}

export function DownloadQrButton({ qrCodeDataUrl, registrantName }: DownloadQrButtonProps) {
  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = qrCodeDataUrl
    link.download = `${registrantName.replace(/\s+/g, "-")}-ticket-qr.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[var(--outline-variant)]/30 text-sm font-medium text-[var(--on-surface)] hover:bg-[var(--surface-container-low)] transition-colors"
    >
      <Download className="w-4 h-4" />
      Save QR
    </button>
  )
}