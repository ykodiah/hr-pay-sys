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
    const { data: cases } = await session.db
      .from("offboarding_cases")
      .select("*")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .order("created_at", { ascending: false })
      .limit(5)

    const active = (cases || [])[0] || null
    let checklist: any[] = []
    let assets: any[] = []

    if (active) {
      const [checkRes, assetRes] = await Promise.all([
        session.db.from("offboarding_checklist").select("*").eq("case_id", active.id),
        session.db.from("offboarding_assets").select("*").eq("case_id", active.id),
      ])
      checklist = checkRes.data || []
      assets = assetRes.data || []
    }

    return NextResponse.json({
      case: active,
      cases: cases || [],
      checklist,
      assets,
      employee: {
        date_of_joining: session.employee.date_of_joining,
        notice_period: session.employee.notice_period,
        position: session.employee.position,
        department: session.employee.department,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load exit process")
  }
}

/** POST — employee submits a resignation, which opens an offboarding case. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const lastDay = body.last_working_day ? String(body.last_working_day).slice(0, 10) : null
    const reason = String(body.reason || "").trim()

    if (!lastDay) return NextResponse.json({ error: "Select your last working day" }, { status: 400 })
    if (new Date(lastDay) < new Date(new Date().toDateString())) {
      return NextResponse.json({ error: "Last working day cannot be in the past" }, { status: 400 })
    }
    if (!reason) return NextResponse.json({ error: "A reason is required" }, { status: 400 })

    const { data: existing } = await session.db
      .from("offboarding_cases")
      .select("id, status")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .not("status", "in", '("completed","cancelled")')
      .limit(1)

    if (existing && existing.length) {
      return NextResponse.json(
        { error: "An exit case is already in progress for you" },
        { status: 409 },
      )
    }

    const caseNumber = `EXIT-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`

    const { data, error } = await session.db
      .from("offboarding_cases")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        case_number: caseNumber,
        department: session.employee.department,
        position: session.employee.position,
        last_working_day: lastDay,
        reason: String(body.exit_type || "resignation"),
        reason_notes: reason,
        status: "initiated",
        initiated_by: session.user.id,
        notes: String(body.notes || "").trim() || null,
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "resignation_submitted", caseNumber, { last_day: lastDay })

    await session.db.from("employee_notifications").insert({
      company_id: session.companyId,
      employee_id: session.employeeId,
      category: "offboarding",
      title: "Resignation submitted",
      message: `Exit case ${caseNumber} has been opened. HR will contact you about clearance.`,
      severity: "warning",
      action_url: "/self-service/exit-process",
    })

    return NextResponse.json({ success: true, case: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit resignation")
  }
}
