import { redirect } from "next/navigation"
import { getRegistrantByQrToken } from "@/server/actions/registrants"
import { getEventBySlug } from "@/server/actions/events"

interface ThankYouPageProps {
  params: { slug: string }
  searchParams: { token?: string }
}

// This page now redirects to the permanent ticket page
export default async function ThankYouPage({ params, searchParams }: ThankYouPageProps) {
  const { slug } = params
  const { token } = searchParams

  // Validate token
  if (!token) {
    redirect(`/e/${slug}`)
  }

  // Get event and registrant to validate
  const event = await getEventBySlug(slug)
  if (!event) {
    redirect(`/e/${slug}`)
  }

  const registrant = await getRegistrantByQrToken(token)
  if (!registrant || registrant.eventId !== event.id) {
    redirect(`/e/${slug}`)
  }

  // Redirect to permanent ticket page with success indicator
  redirect(`/ticket/${registrant.qrToken}?new=true`)
}