import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { data, error } = await session.db
      .from("grievances")
      .select("*")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw new Error(error.message)
    const rows = data || []

    return NextResponse.json({
      grievances: rows,
      summary: {
        total: rows.length,
        open: rows.filter((g: any) => !["resolved", "closed"].includes(String(g.status).toLowerCase()))
          .length,
        resolved: rows.filter((g: any) =>
          ["resolved", "closed"].includes(String(g.status).toLowerCase()),
        ).length,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load grievances")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body.title || body.subject || "").trim()
    const description = String(body.description || "").trim()

    if (!title) return NextResponse.json({ error: "A subject is required" }, { status: 400 })
    if (description.length < 20) {
      return NextResponse.json(
        { error: "Please describe the issue in at least 20 characters" },
        { status: 400 },
      )
    }

    const { data, error } = await session.db
      .from("grievances")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        subject: title,
        title,
        description,
        grievance_type: String(body.grievance_type || "general"),
        priority: ["low", "medium", "high", "critical"].includes(String(body.priority))
          ? body.priority
          : "medium",
        desired_outcome: String(body.desired_outcome || "").trim() || null,
        status: "open",
        filed_at: new Date().toISOString(),
        submitted_by: session.user.id,
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "grievance_filed", title, { id: data.id })

    await session.db.from("employee_notifications").insert({
      company_id: session.companyId,
      employee_id: session.employeeId,
      category: "grievance",
      title: "Grievance received",
      message: `"${title}" has been logged and routed to HR.`,
      severity: "info",
      action_url: "/self-service/grievances",
    })

    return NextResponse.json({ success: true, grievance: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit grievance")
  }
}
