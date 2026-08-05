import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

function monthBounds(ym: string) {
  const [y, m] = ym.split("-").map(Number)
  const from = `${ym}-01`
  const last = new Date(y, m, 0).getDate()
  const to = `${ym}-${String(last).padStart(2, "0")}`
  return { from, to, year: y, month: m, daysInMonth: last }
}

/**
 * GET /api/leave/calendar?month=YYYY-MM
 * Heat-map friendly leave occupancy by day + per-employee bars.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const now = new Date()
    const month =
      request.nextUrl.searchParams.get("month") ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const { from, to, daysInMonth } = monthBounds(month)

    const { data: leaves, error } = await ctx.service
      .from("leave_requests")
      .select(
        `id, employee_id, start_date, end_date, days_requested, status,
         employees!leave_requests_employee_id_fkey(id, first_name, last_name, employee_id, department),
         leave_types(name, code, category)`,
      )
      .eq("company_id", ctx.companyId)
      .in("status", ["approved", "pending"])
      .lte("start_date", to)
      .gte("end_date", from)

    if (error) {
      const fb = await ctx.service
        .from("leave_requests")
        .select("*")
        .eq("company_id", ctx.companyId)
        .in("status", ["approved", "pending"])
        .lte("start_date", to)
        .gte("end_date", from)
      if (fb.error) throw new Error(fb.error.message)
      return NextResponse.json({
        month,
        from,
        to,
        days: buildDays(month, daysInMonth, fb.data || []),
        entries: fb.data || [],
        company_id: ctx.companyId,
      })
    }

    const entries = (leaves || []).map((r: any) => ({
      id: r.id,
      employee_id: r.employee_id,
      employee_name: r.employees
        ? `${r.employees.first_name || ""} ${r.employees.last_name || ""}`.trim()
        : "Employee",
      employee_code: r.employees?.employee_id || null,
      department: r.employees?.department || null,
      start_date: r.start_date,
      end_date: r.end_date,
      days_requested: r.days_requested,
      status: r.status,
      leave_type: r.leave_types?.name || "Leave",
      leave_code: r.leave_types?.code || null,
      category: r.leave_types?.category || "general",
    }))

    return NextResponse.json({
      month,
      from,
      to,
      days: buildDays(month, daysInMonth, entries),
      entries,
      company_id: ctx.companyId,
      summary: {
        approved: entries.filter((e: { status: string }) => e.status === "approved").length,
        pending: entries.filter((e: { status: string }) => e.status === "pending").length,
        people_out: new Set(
          entries
            .filter((e: { status: string }) => e.status === "approved")
            .map((e: { employee_id: string }) => e.employee_id),
        ).size,
      },
    })
  } catch (err) {
    return jsonError(err, "Failed to load leave calendar")
  }
}

function buildDays(month: string, daysInMonth: number, entries: any[]) {
  const days = []
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`
    const onLeave = entries.filter(
      (e) => e.start_date <= date && e.end_date >= date && e.status === "approved",
    )
    const pending = entries.filter(
      (e) => e.start_date <= date && e.end_date >= date && e.status === "pending",
    )
    days.push({
      date,
      day: d,
      weekday: new Date(`${date}T12:00:00`).getDay(),
      count: onLeave.length,
      pending_count: pending.length,
      heat: Math.min(1, onLeave.length / 8), // normalize for UI heat
      people: onLeave.map((e) => ({
        id: e.id || e.employee_id,
        name: e.employee_name || "Employee",
        leave_type: e.leave_type || e.leave_types?.name || "Leave",
        department: e.department || null,
      })),
    })
  }
  return days
}
