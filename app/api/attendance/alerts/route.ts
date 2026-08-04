import { type NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

export const runtime = "nodejs"

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

    let query = ctx.service
      .from("attendance_alerts")
      .select(
        `
        *,
        employee:employees(id, first_name, last_name, employee_id),
        rule:attendance_alert_rules(rule_name, severity, notification_channels)
      `,
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(limit)

    // "open" is treated as pending for UI convenience
    if (status && status !== "all") {
      if (status === "open") query = query.eq("status", "pending")
      else query = query.eq("status", status)
    }
    if (employeeId) query = query.eq("employee_id", employeeId)
    if (severity && severity !== "all") query = query.eq("severity", severity)
    if (alertType) query = query.eq("alert_type", alertType)

    const { data, error } = await query
    if (error) {
      // Fallback without join / company filter if schema differs
      if (/does not exist|column/i.test(error.message)) {
        const fb = await ctx.service
          .from("attendance_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit)
        if (fb.error) throw new Error(fb.error.message)
        return NextResponse.json({ success: true, data: fb.data || [] })
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

    const { data, error } = await ctx.service
      .from("attendance_alerts")
      .insert({
        company_id: ctx.companyId,
        rule_id: body.rule_id ?? null,
        employee_id: body.employee_id ?? null,
        alert_type: body.alert_type || "general",
        severity: body.severity || "medium",
        title: body.title || "Attendance alert",
        message: body.message || null,
        metadata: body.metadata || {},
        status: body.status || "pending",
      })
      .select()
      .single()

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

    if (action === "acknowledge" || action === "acknowledged") {
      updates.status = "acknowledged"
      updates.acknowledged_at = new Date().toISOString()
      if (ctx.userId) updates.acknowledged_by = ctx.userId
    } else if (action === "resolve" || action === "resolved") {
      updates.status = "resolved"
      updates.resolved_at = new Date().toISOString()
      if (ctx.userId) updates.resolved_by = ctx.userId
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

    if (error && /column|does not exist/i.test(error.message)) {
      // Retry with minimal columns
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

    if ((action === "acknowledge" || action === "acknowledged") && (body.response_note || body.resolution_note)) {
      await ctx.service.from("alert_acknowledgments").insert({
        alert_id: alertId,
        employee_id: ctx.userId,
        response_note: body.response_note || body.resolution_note,
        action_taken: action,
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return jsonError(error, "Failed to update attendance alert")
  }
}
