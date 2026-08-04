import { type NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

export const runtime = "nodejs"

const REL_ERR = /does not exist|column|more than one relationship|could not embed/i

async function loadAlertsPlain(service: any, companyId: string, opts: {
  status?: string | null
  employeeId?: string | null
  severity?: string | null
  alertType?: string | null
  limit: number
}) {
  let query = service
    .from("attendance_alerts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(opts.limit)

  // Prefer company filter when column exists
  const withCompany = query.eq("company_id", companyId)
  let { data, error } = await withCompany
  if (error && REL_ERR.test(error.message)) {
    ;({ data, error } = await service
      .from("attendance_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(opts.limit))
  }
  if (error) throw new Error(error.message)

  let rows = (data || []).filter((r: any) => !r.company_id || r.company_id === companyId)
  if (opts.status && opts.status !== "all") {
    const st = opts.status === "open" ? "pending" : opts.status
    rows = rows.filter((r: any) => r.status === st)
  }
  if (opts.employeeId) rows = rows.filter((r: any) => r.employee_id === opts.employeeId)
  if (opts.severity && opts.severity !== "all") rows = rows.filter((r: any) => r.severity === opts.severity)
  if (opts.alertType) rows = rows.filter((r: any) => r.alert_type === opts.alertType)

  // Attach employees in a second query (avoids ambiguous FK embed)
  const empIds = [...new Set(rows.map((r: any) => r.employee_id).filter(Boolean))]
  let empMap = new Map<string, any>()
  if (empIds.length) {
    const { data: emps } = await service
      .from("employees")
      .select("id, first_name, last_name, employee_id")
      .eq("company_id", companyId)
      .in("id", empIds)
    empMap = new Map((emps || []).map((e: any) => [e.id, e]))
  }

  return rows.map((r: any) => ({
    ...r,
    employee: r.employee_id ? empMap.get(r.employee_id) || null : null,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const employeeId = searchParams.get("employee_id")
    const severity = searchParams.get("severity")
    const alertType = searchParams.get("alert_type")
    const limit = Number.parseInt(searchParams.get("limit") || "100", 10)

    // Explicit FK hint — avoids "more than one relationship" with acknowledged_by/resolved_by
    let query = ctx.service
      .from("attendance_alerts")
      .select(
        `
        *,
        employee:employees!attendance_alerts_employee_id_fkey(id, first_name, last_name, employee_id),
        rule:attendance_alert_rules(rule_name, severity, notification_channels)
      `,
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status && status !== "all") {
      if (status === "open") query = query.eq("status", "pending")
      else query = query.eq("status", status)
    }
    if (employeeId) query = query.eq("employee_id", employeeId)
    if (severity && severity !== "all") query = query.eq("severity", severity)
    if (alertType) query = query.eq("alert_type", alertType)

    const { data, error } = await query
    if (error) {
      if (REL_ERR.test(error.message)) {
        const rows = await loadAlertsPlain(ctx.service, ctx.companyId, {
          status,
          employeeId,
          severity,
          alertType,
          limit,
        })
        return NextResponse.json({ success: true, data: rows })
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return jsonError(error, "Failed to load attendance alerts")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const payload: Record<string, any> = {
      company_id: ctx.companyId,
      rule_id: body.rule_id ?? null,
      employee_id: body.employee_id ?? null,
      alert_type: body.alert_type || "general",
      severity: body.severity || "medium",
      title: body.title || "Attendance alert",
      message: body.message || "",
      metadata: body.metadata || {},
      status: body.status || "pending",
    }

    let { data, error } = await ctx.service.from("attendance_alerts").insert(payload).select().single()
    if (error && /column|does not exist/i.test(error.message)) {
      const minimal = {
        company_id: ctx.companyId,
        employee_id: payload.employee_id,
        alert_type: payload.alert_type,
        severity: payload.severity,
        title: payload.title,
        message: payload.message || "Attendance alert",
        status: "pending",
      }
      ;({ data, error } = await ctx.service.from("attendance_alerts").insert(minimal).select().single())
    }
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return jsonError(error, "Failed to create attendance alert")
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const alertId = body.alert_id || body.id
    if (!alertId) {
      return NextResponse.json({ error: "alert_id required" }, { status: 400 })
    }

    const action = String(body.action || body.status || "").toLowerCase()
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    }

    // Do NOT set acknowledged_by/resolved_by to auth.uid — those FKs point at employees(id)
    if (action === "acknowledge" || action === "acknowledged") {
      updates.status = "acknowledged"
      updates.acknowledged_at = new Date().toISOString()
    } else if (action === "resolve" || action === "resolved") {
      updates.status = "resolved"
      updates.resolved_at = new Date().toISOString()
      if (body.resolution_note || body.response_note) {
        updates.resolution_note = body.resolution_note || body.response_note
      }
    } else if (action === "dismiss" || action === "dismissed") {
      updates.status = "dismissed"
      updates.resolved_at = new Date().toISOString()
      if (body.resolution_note || body.response_note) {
        updates.resolution_note = body.resolution_note || body.response_note
      }
    } else if (action === "escalate" || action === "escalated") {
      updates.status = "escalated"
      updates.escalated_at = new Date().toISOString()
      updates.escalation_level = (body.current_escalation_level || 0) + 1
    } else if (body.status) {
      updates.status = body.status
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use acknowledge | resolve | dismiss | escalate" },
        { status: 400 },
      )
    }

    let { data, error } = await ctx.service
      .from("attendance_alerts")
      .update(updates)
      .eq("id", alertId)
      .eq("company_id", ctx.companyId)
      .select()
      .single()

    if (error && REL_ERR.test(error.message)) {
      const minimal: Record<string, any> = { status: updates.status }
      if (updates.acknowledged_at) minimal.acknowledged_at = updates.acknowledged_at
      if (updates.resolved_at) minimal.resolved_at = updates.resolved_at
      if (updates.escalated_at) minimal.escalated_at = updates.escalated_at
      const retry = await ctx.service
        .from("attendance_alerts")
        .update(minimal)
        .eq("id", alertId)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return jsonError(error, "Failed to update attendance alert")
  }
}
