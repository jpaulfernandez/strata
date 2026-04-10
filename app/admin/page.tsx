import { redirect } from "next/navigation";

/**
 * Admin root page - redirects to events list
 * The dashboard (Wave 7) is not yet implemented
 */
export default function AdminPage() {
  redirect("/admin/events");
}