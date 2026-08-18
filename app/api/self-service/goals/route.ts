import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"
import { coerceFieldValue } from "@/lib/employees/audit-fields"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const STATUSES = ["not_started", "in_progress", "completed", "on_hold"]

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const [ownRes, assignedRes] = await Promise.all([
      session.db
        .from("employee_self_service_goals")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("created_at", { ascending: false }),
      session.db
        .from("performance_goals")
        .select("id, title, description, category, priority, status, progress, target_value, current_value, unit, start_date, due_date, end_date")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("due_date", { ascending: true, nullsFirst: false }),
    ])

    const goals = ownRes.data || []
    const assigned = assignedRes.data || []
    const all = [...goals, ...assigned]

    return NextResponse.json({
      goals,
      assigned_goals: assigned,
      summary: {
        total: all.length,
        completed: all.filter((g: any) => String(g.status) === "completed").length,
        in_progress: all.filter((g: any) => String(g.status) === "in_progress").length,
        average_progress: all.length
          ? Math.round(all.reduce((s: number, g: any) => s + Number(g.progress || 0), 0) / all.length)
          : 0,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load goals")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const title = String(body.title || "").trim()
    if (!title) return NextResponse.json({ error: "A goal title is required" }, { status: 400 })

    const progress = Math.max(0, Math.min(100, Number(body.progress) || 0))
    const status = STATUSES.includes(body.status) ? body.status : "not_started"

    const { data, error } = await session.db
      .from("employee_self_service_goals")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        title,
        progress,
        status,
        due_date: coerceFieldValue("due_date", body.due_date),
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "goal_create", title, { goal_id: data.id })
    return NextResponse.json({ success: true, goal: data })
  } catch (err) {
    return portalJsonError(err, "Failed to create goal")
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Goal id is required" }, { status: 400 })

    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.title !== undefined) patch.title = String(body.title).trim()
    if (body.progress !== undefined) {
      patch.progress = Math.max(0, Math.min(100, Number(body.progress) || 0))
      if (patch.progress === 100) patch.status = "completed"
    }
    if (body.status !== undefined && STATUSES.includes(body.status)) patch.status = body.status
    if (body.due_date !== undefined) patch.due_date = coerceFieldValue("due_date", body.due_date)

    const { data, error } = await session.db
      .from("employee_self_service_goals")
      .update(patch)
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .select("*")
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) return NextResponse.json({ error: "Goal not found" }, { status: 404 })

    return NextResponse.json({ success: true, goal: data })
  } catch (err) {
    return portalJsonError(err, "Failed to update goal")
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Goal id is required" }, { status: 400 })

    const { error } = await session.db
      .from("employee_self_service_goals")
      .delete()
      .eq("id", id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (err) {
    return portalJsonError(err, "Failed to delete goal")
  }
}
