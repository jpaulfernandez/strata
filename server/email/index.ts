import { Resend } from "resend"
import { generateQRCode } from "@/lib/qr"

/**
 * Initialize Resend client
 * Requires RESEND_API_KEY environment variable
 */
const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Get the from address for emails
 * Uses EMAIL_FROM environment variable, or defaults to onboarding@resend.dev for testing
 */
function getFromAddress(): string {
  const emailFrom = process.env.EMAIL_FROM
  if (emailFrom) {
    return emailFrom
  }
  // Default to Resend's test address for development
  // This only works in development mode with a test API key
  return "Strata <onboarding@resend.dev>"
}

/**
 * Registrant information for confirmation email
 */
interface RegistrantInfo {
  firstName: string
  lastName: string
  email: string
  qrToken: string
}

/**
 * Event information for confirmation email
 */
interface EventInfo {
  title: string
  eventDate: Date | string | null
  location: string | null
  slug: string
  startTime?: string | null
  endTime?: string | null
  description?: string | null
}

/**
 * Template variables available for email templates
 */
interface TemplateVariables {
  firstName: string
  lastName: string
  fullName: string
  email: string
  eventName: string
  eventDate: string
  eventTime: string
  eventLocation: string
  ticketUrl: string
  eventSlug: string
}

/**
 * Substitute template variables in a string
 * Supports {{variableName}} syntax
 */
function substituteTemplateVars(template: string, vars: TemplateVariables): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return String(vars[key as keyof TemplateVariables] ?? match)
  })
}

/**
 * Format a date for display in email
 */
function formatEventDate(date: Date | string | null): string {
  if (!date) return "Date to be announced"
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format time for display in email
 */
function formatEventTime(date: Date | string | null): string {
  if (!date) return ""
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Get default email template HTML
 */
function getDefaultEmailTemplateHtml(): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ticket for {{eventName}}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: #f4f3f5;
      color: #1a1c1d;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #ffffff;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 12px 40px rgba(74, 69, 75, 0.06);
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #453b4d;
      margin-bottom: 8px;
    }
    .title {
      font-size: 28px;
      font-weight: 700;
      color: #1a1c1d;
      margin: 0 0 8px 0;
      line-height: 1.2;
    }
    .subtitle {
      font-size: 16px;
      color: #685f70;
      margin: 0;
    }
    .event-details {
      background-color: #faf9fb;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      font-size: 14px;
      color: #685f70;
      width: 80px;
      flex-shrink: 0;
    }
    .detail-value {
      font-size: 14px;
      color: #1a1c1d;
      font-weight: 500;
    }
    .qr-section {
      text-align: center;
      margin-bottom: 32px;
    }
    .qr-code {
      width: 200px;
      height: 200px;
      margin: 0 auto 16px;
      border-radius: 16px;
      overflow: hidden;
    }
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    .qr-instructions {
      font-size: 14px;
      color: #685f70;
      margin: 0;
    }
    .divider {
      height: 1px;
      background-color: #e8dbef;
      margin: 32px 0;
    }
    .registrant-info {
      text-align: center;
      margin-bottom: 24px;
    }
    .registrant-name {
      font-size: 20px;
      font-weight: 600;
      color: #1a1c1d;
      margin: 0 0 4px 0;
    }
    .registrant-email {
      font-size: 14px;
      color: #685f70;
      margin: 0;
    }
    .footer {
      text-align: center;
      padding-top: 24px;
    }
    .footer-text {
      font-size: 12px;
      color: #685f70;
      margin: 0 0 8px 0;
    }
    .footer-link {
      color: #453b4d;
      text-decoration: none;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #2e2536 0%, #453b4d 100%);
      color: #ffffff;
      padding: 14px 28px;
      border-radius: 100px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">Strata</div>
        <h1 class="title">You're Registered!</h1>
        <p class="subtitle">Your ticket for {{eventName}} is confirmed</p>
      </div>

      <div class="event-details">
        <div class="detail-row">
          <span class="detail-label">Event</span>
          <span class="detail-value">{{eventName}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">{{eventDate}}{{eventTime}}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">{{eventLocation}}</span>
        </div>
      </div>

      <div class="qr-section">
        <p class="qr-instructions">Scan this QR code at the venue for quick check-in</p>
      </div>

      <div class="divider"></div>

      <div class="registrant-info">
        <p class="registrant-name">{{fullName}}</p>
        <p class="registrant-email">{{email}}</p>
      </div>

      <div style="text-align: center;">
        <a href="{{ticketUrl}}" class="button">View Your Ticket</a>
      </div>

      <div class="footer">
        <p class="footer-text">Present this QR code at the event entrance.</p>
        <p class="footer-text">
          Can't make it? <a href="{{ticketUrl}}" class="footer-link">Manage your registration</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim()
}

/**
 * Get default email template plain text
 */
function getDefaultEmailTemplateText(): string {
  return `
You're Registered!

Your ticket for {{eventName}} is confirmed.

Event Details:
- Event: {{eventName}}
- Date: {{eventDate}}{{eventTime}}
- Location: {{eventLocation}}

Registrant: {{fullName}}
Email: {{email}}

View your ticket and QR code at: {{ticketUrl}}

Present your QR code at the event entrance for quick check-in.

Thank you for registering!
  `.trim()
}

/**
 * Build template variables from registrant and event info
 */
function buildTemplateVariables(
  registrant: RegistrantInfo,
  event: EventInfo,
  ticketUrl: string
): TemplateVariables {
  const eventDateFormatted = formatEventDate(event.eventDate)

  // Build time string
  let eventTimeFormatted = ""
  if (event.startTime && event.endTime) {
    eventTimeFormatted = ` at ${event.startTime} – ${event.endTime}`
  } else if (event.eventDate) {
    const timeStr = formatEventTime(event.eventDate)
    if (timeStr) eventTimeFormatted = ` at ${timeStr}`
  }

  return {
    firstName: registrant.firstName,
    lastName: registrant.lastName,
    fullName: `${registrant.firstName} ${registrant.lastName}`,
    email: registrant.email,
    eventName: event.title,
    eventDate: eventDateFormatted,
    eventTime: eventTimeFormatted,
    eventLocation: event.location || "Location TBA",
    ticketUrl,
    eventSlug: event.slug,
  }
}

/**
 * Generate HTML email body with embedded QR code
 * Uses custom template if provided, otherwise uses default
 */
function generateConfirmationEmailHtml(
  registrant: RegistrantInfo,
  event: EventInfo,
  qrCodeDataUrl: string,
  ticketUrl: string,
  customTemplate?: string | null
): string {
  const vars = buildTemplateVariables(registrant, event, ticketUrl)

  // Use custom template or default
  let template = customTemplate || getDefaultEmailTemplateHtml()

  // Substitute variables
  let html = substituteTemplateVars(template, vars)

  // Inject QR code image if there's a placeholder or in default template
  // The QR code is embedded in the qr-section div
  if (html.includes("qr-section") && !html.includes("<img")) {
    html = html.replace(
      /<div class="qr-section">([\s\S]*?)<\/div>/,
      `<div class="qr-section">
        <div class="qr-code">
          <img src="${qrCodeDataUrl}" alt="Your ticket QR code" />
        </div>
        $1
      </div>`
    )
  }

  return html
}

/**
 * Generate plain text email body
 */
function generateConfirmationEmailText(
  registrant: RegistrantInfo,
  event: EventInfo,
  ticketUrl: string,
  customTemplate?: string | null
): string {
  const vars = buildTemplateVariables(registrant, event, ticketUrl)

  // Use custom template or default
  let template = customTemplate || getDefaultEmailTemplateText()

  // Substitute variables
  return substituteTemplateVars(template, vars)
}

/**
 * Send a confirmation email to a registrant with their ticket QR code
 *
 * @param registrant - The registrant information (firstName, lastName, email, qrToken)
 * @param event - The event information (title, eventDate, location, slug, startTime, endTime)
 * @param customTemplate - Optional custom HTML template (uses default if not provided)
 * @returns Promise resolving to the result of the email send operation
 *
 * @example
 * ```ts
 * const result = await sendConfirmationEmail(
 *   { firstName: "John", lastName: "Doe", email: "john@example.com", qrToken: "abc123" },
 *   { title: "Tech Conference", eventDate: new Date("2024-06-15"), location: "Convention Center", slug: "tech-conf" }
 * )
 * ```
 */
export async function sendConfirmationEmail(
  registrant: RegistrantInfo,
  event: EventInfo,
  customTemplate?: string | null
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  // Validate required environment variable
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY environment variable is not set")
    return { success: false, error: "Email service not configured" }
  }

  // Validate required fields
  if (!registrant.email) {
    return { success: false, error: "Registrant email is required" }
  }
  if (!registrant.qrToken) {
    return { success: false, error: "QR token is required" }
  }
  if (!event.title) {
    return { success: false, error: "Event title is required" }
  }

  try {
    // Generate the ticket URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL environment variable is not set")
      return { success: false, error: "App URL not configured" }
    }

    const ticketUrl = `${appUrl}/ticket/${registrant.qrToken}`

    // Generate QR code as base64 data URL
    const qrCodeDataUrl = await generateQRCode(ticketUrl, {
      width: 300,
      margin: 2,
    })

    // Generate email content with custom template if provided
    const html = generateConfirmationEmailHtml(registrant, event, qrCodeDataUrl, ticketUrl, customTemplate)
    const text = generateConfirmationEmailText(registrant, event, ticketUrl, customTemplate)

    // Send the email
    const { data, error } = await resend.emails.send({
      from: getFromAddress(),
      to: registrant.email,
      subject: `Your ticket for ${event.title}`,
      html,
      text,
    })

    if (error) {
      console.error("Failed to send confirmation email:", error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send confirmation email"
    console.error("Error sending confirmation email:", error)
    return { success: false, error: message }
  }
}

/**
 * Check if the Resend client is properly configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

/**
 * Export the Resend client for advanced use cases
 */
export { resend }