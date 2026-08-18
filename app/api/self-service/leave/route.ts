import { NextRequest, NextResponse } from "next/server"
import {
  requirePortalSession,
  isPortalError,
  portalJsonError,
  logPortalActivity,
} from "@/lib/self-service/portal-session"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function businessDays(start: string, end: string) {
  const from = new Date(start)
  const to = new Date(end)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 0
  let days = 0
  const cursor = new Date(from)
  while (cursor <= to) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) days += 1
    cursor.setDate(cursor.getDate() + 1)
  }
  return days
}

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const year = new Date().getFullYear()
    const [typesRes, balancesRes, requestsRes] = await Promise.all([
      session.db
        .from("leave_types")
        .select("id, name, code, annual_entitlement, is_paid, min_notice_days, requires_approval, max_consecutive_days, is_active")
        .eq("company_id", session.companyId)
        .eq("is_active", true)
        .order("name"),
      session.db
        .from("leave_balances")
        .select("id, leave_type_id, year, entitled_days, used_days, remaining_days")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .eq("year", year),
      session.db
        .from("leave_requests")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    const types = typesRes.data || []
    const typeName = new Map(types.map((t: any) => [t.id, t.name]))
    const balances = (balancesRes.data || []).map((b: any) => ({
      ...b,
      leave_type_name: typeName.get(b.leave_type_id) || "Leave",
    }))

    return NextResponse.json({
      leave_types: types,
      balances,
      requests: (requestsRes.data || []).map((r: any) => ({
        ...r,
        leave_type_name: r.leave_type_name || typeName.get(r.leave_type_id) || "Leave",
      })),
      year,
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load leave data")
  }
}

/** POST — submit a leave request for the signed-in employee. */
export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const start = body.start_date ? String(body.start_date).slice(0, 10) : null
    const end = body.end_date ? String(body.end_date).slice(0, 10) : null

    if (!start || !end) {
      return NextResponse.json({ error: "Start and end dates are required" }, { status: 400 })
    }
    if (new Date(end) < new Date(start)) {
      return NextResponse.json({ error: "End date cannot be before the start date" }, { status: 400 })
    }
    if (!body.leave_type_id) {
      return NextResponse.json({ error: "Select a leave type" }, { status: 400 })
    }

    const { data: leaveType } = await session.db
      .from("leave_types")
      .select("id, name, is_paid, min_notice_days, max_consecutive_days")
      .eq("id", body.leave_type_id)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!leaveType) {
      return NextResponse.json({ error: "That leave type is not available" }, { status: 400 })
    }

    const days = Number(body.days_requested) || businessDays(start, end)
    if (days <= 0) {
      return NextResponse.json({ error: "The selected range contains no working days" }, { status: 400 })
    }
    if (leaveType.max_consecutive_days && days > Number(leaveType.max_consecutive_days)) {
      return NextResponse.json(
        { error: `${leaveType.name} allows a maximum of ${leaveType.max_consecutive_days} consecutive days` },
        { status: 400 },
      )
    }

    // Overlap guard against the employee's own pending/approved leave.
    const { data: overlapping } = await session.db
      .from("leave_requests")
      .select("id, start_date, end_date, status")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .in("status", ["pending", "Pending", "approved", "Approved"])
      .lte("start_date", end)
      .gte("end_date", start)
      .limit(1)

    if (overlapping && overlapping.length) {
      return NextResponse.json(
        { error: "You already have a leave request covering some of those dates" },
        { status: 409 },
      )
    }

    const { data, error } = await session.db
      .from("leave_requests")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        leave_type_id: leaveType.id,
        leave_type_name: leaveType.name,
        start_date: start,
        end_date: end,
        days_requested: days,
        reason: String(body.reason || "").trim() || null,
        status: "pending",
        initiated_by: "employee",
        initiated_by_user_id: session.user.id,
        is_paid_leave: leaveType.is_paid ?? true,
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)

    await logPortalActivity(session, "leave_request", `${leaveType.name} ${start} to ${end}`, {
      request_id: data.id,
      days,
    })

    await session.db.from("employee_notifications").insert({
      company_id: session.companyId,
      employee_id: session.employeeId,
      category: "leave",
      title: "Leave request submitted",
      message: `${leaveType.name}: ${start} to ${end} (${days} day(s)) is awaiting approval.`,
      severity: "info",
      action_url: "/self-service/leave",
    })

    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit leave request")
  }
}

/** PATCH — the employee cancels their own pending request. */
export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Request id is required" }, { status: 400 })

    const { data: existing } = await session.db
      .from("leave_requests")
      .select("id, status")
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 })
    if (String(existing.status).toLowerCase() !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be cancelled" }, { status: 400 })
    }

    const { data, error } = await session.db
      .from("leave_requests")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: session.user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "leave_cancel", body.id)

    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to cancel leave request")
  }
}
