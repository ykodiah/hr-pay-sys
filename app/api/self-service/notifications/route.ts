import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { data, error } = await session.db
      .from("employee_notifications")
      .select("*")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)

    const notifications = data || []
    return NextResponse.json({
      notifications,
      unread: notifications.filter((n: any) => !n.read_at).length,
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load notifications")
  }
}

/** PATCH — mark one or all notifications read. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    let query = session.db
      .from("employee_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .is("read_at", null)

    if (body.id) query = query.eq("id", body.id)

    const { error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ success: true })
  } catch (err) {
    return portalJsonError(err, "Failed to update notifications")
  }
}
