import { NextRequest, NextResponse } from "next/server"
import {
  isPortalError,
  logPortalActivity,
  portalJsonError,
  requirePortalSession,
} from "@/lib/self-service/portal-session"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const [casesRes, actionsRes] = await Promise.all([
      session.db
        .from("disciplinary_cases")
        .select("*")
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .order("created_at", { ascending: false }),
      session.db
        .from("disciplinary_actions")
        .select("*")
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .order("issued_at", { ascending: false }),
    ])
    if (casesRes.error) throw new Error(casesRes.error.message)
    if (actionsRes.error) throw new Error(actionsRes.error.message)
    return NextResponse.json({
      cases: (casesRes.data || []).filter((row: any) => row.employee_visible !== false),
      actions: (actionsRes.data || []).filter((row: any) => row.employee_visible !== false),
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load disciplinary records")
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const type = String(body.type || "action")
    const id = String(body.id || "")
    if (!id) return NextResponse.json({ error: "Record id is required" }, { status: 400 })
    const now = new Date().toISOString()

    if (type === "case") {
      const response = String(body.response || "").trim()
      if (!response) return NextResponse.json({ error: "Enter your response" }, { status: 400 })
      const { data, error } = await session.db
        .from("disciplinary_cases")
        .update({ employee_response: response, employee_responded_at: now, updated_at: now })
        .eq("id", id)
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .select("*")
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return NextResponse.json({ error: "Case not found" }, { status: 404 })
    } else {
      const { data, error } = await session.db
        .from("disciplinary_actions")
        .update({
          acknowledged: true,
          acknowledged_at: now,
          employee_response: String(body.response || "").trim() || null,
          updated_at: now,
        })
        .eq("id", id)
        .eq("company_id", session.companyId)
        .eq("employee_id", session.employeeId)
        .select("*")
        .maybeSingle()
      if (error) throw new Error(error.message)
      if (!data) return NextResponse.json({ error: "Action not found" }, { status: 404 })
    }

    await logPortalActivity(session, "disciplinary_acknowledgement", id, { type })
    return NextResponse.json({ success: true })
  } catch (err) {
    return portalJsonError(err, "Could not save acknowledgement")
  }
}
