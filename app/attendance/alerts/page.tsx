import { redirect } from "next/navigation"

/** Legacy path — alerts live under the authenticated app layout with left nav. */
export default function LegacyAttendanceAlertsRedirect() {
  redirect("/app/attendance/alerts")
}
