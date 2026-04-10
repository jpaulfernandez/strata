import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Strata - Event Registration & Check-in Platform',
    template: '%s | Strata',
  },
  description: 'Streamline your event management with powerful registration, ticketing, and check-in tools.',
  keywords: ['event management', 'registration', 'check-in', 'tickets', 'QR code'],
  authors: [{ name: 'Strata Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    title: 'Strata - Event Registration & Check-in Platform',
    description: 'Streamline your event management with powerful registration, ticketing, and check-in tools.',
    siteName: 'Strata',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Strata - Event Registration & Check-in Platform',
    description: 'Streamline your event management with powerful registration, ticketing, and check-in tools.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable}`}>
      <body className="font-body text-on-surface bg-surface antialiased">
        {children}
      </body>
    </html>
  )
}