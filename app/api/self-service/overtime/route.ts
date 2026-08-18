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
    const [requestsRes, ratesRes, attendanceRes] = await Promise.all([
      session.db
        .from("overtime_requests")
        .select("*")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .order("date", { ascending: false })
        .limit(100),
      session.db
        .from("overtime_rates")
        .select("*")
        .eq("company_id", session.companyId),
      session.db
        .from("attendance_records")
        .select("date, overtime_hours")
        .eq("employee_id", session.employeeId)
        .eq("company_id", session.companyId)
        .not("overtime_hours", "is", null)
        .order("date", { ascending: false })
        .limit(366),
    ])

    const requests = requestsRes.data || []
    const attendance = attendanceRes.data || []
    const approvedHours = requests
      .filter((r: any) => String(r.status).toLowerCase() === "approved")
      .reduce((s: number, r: any) => s + Number(r.hours_approved ?? r.hours_requested ?? 0), 0)
    const earned = requests.reduce((s: number, r: any) => s + Number(r.amount_earned || 0), 0)
    const monthMap = new Map<string, { clocked: number; requested: number; approved: number; pending: number; earned: number }>()
    const month = (date: string | null) => date ? date.slice(0, 7) : null
    const ensure = (key: string) => {
      const row = monthMap.get(key) || { clocked: 0, requested: 0, approved: 0, pending: 0, earned: 0 }
      monthMap.set(key, row)
      return row
    }
    for (const row of attendance) {
      const key = month(row.date)
      if (key) ensure(key).clocked += Number(row.overtime_hours || 0)
    }
    for (const row of requests) {
      const key = month(row.date)
      if (!key) continue
      const target = ensure(key)
      target.requested += Number(row.hours_requested || 0)
      const status = String(row.status || "").toLowerCase()
      if (status === "approved") target.approved += Number(row.hours_approved ?? row.hours_requested ?? 0)
      if (status === "pending") target.pending += Number(row.hours_requested || 0)
      target.earned += Number(row.amount_earned || 0)
    }
    const monthly_summary = [...monthMap.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 12).map(([month, values]) => ({ month, ...values }))

    return NextResponse.json({
      requests,
      rates: ratesRes.data || [],
      monthly_summary,
      summary: {
        approved_hours: approvedHours,
        pending: requests.filter((r: any) => String(r.status).toLowerCase() === "pending").length,
        total_earned: earned,
      },
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load overtime")
  }
}

export async function POST(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const date = body.date ? String(body.date).slice(0, 10) : null
    const hours = Number(body.hours_requested)

    if (!date) return NextResponse.json({ error: "Select the overtime date" }, { status: 400 })
    if (!Number.isFinite(hours) || hours <= 0 || hours > 16) {
      return NextResponse.json({ error: "Enter between 0.5 and 16 hours" }, { status: 400 })
    }
    if (new Date(date) > new Date()) {
      return NextResponse.json({ error: "Overtime can only be claimed for a past date" }, { status: 400 })
    }
    if (!String(body.reason || "").trim()) {
      return NextResponse.json({ error: "A reason is required" }, { status: 400 })
    }

    const { data: duplicate } = await session.db
      .from("overtime_requests")
      .select("id")
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .eq("date", date)
      .not("status", "in", '("rejected","cancelled")')
      .limit(1)

    if (duplicate && duplicate.length) {
      return NextResponse.json(
        { error: "You already submitted an overtime claim for that date" },
        { status: 409 },
      )
    }

    const { data, error } = await session.db
      .from("overtime_requests")
      .insert({
        company_id: session.companyId,
        employee_id: session.employeeId,
        date,
        hours_requested: hours,
        reason: String(body.reason).trim(),
        rate_type_id: body.rate_type_id || null,
        status: "pending",
        source: "self_service",
        requested_at: new Date().toISOString(),
      })
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    await logPortalActivity(session, "overtime_request", `${hours}h on ${date}`, { id: data.id })

    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to submit overtime request")
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    if (!body.id) return NextResponse.json({ error: "Request id is required" }, { status: 400 })

    const { data: existing } = await session.db
      .from("overtime_requests")
      .select("id, status")
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .eq("company_id", session.companyId)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 })
    if (String(existing.status).toLowerCase() !== "pending") {
      return NextResponse.json({ error: "Only pending claims can be cancelled" }, { status: 400 })
    }

    const { data, error } = await session.db
      .from("overtime_requests")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", body.id)
      .eq("employee_id", session.employeeId)
      .select("*")
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, request: data })
  } catch (err) {
    return portalJsonError(err, "Failed to cancel overtime request")
  }
}
