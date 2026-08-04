import { type NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

export const runtime = "nodejs"

function asArray(value: unknown, fallback: string[]): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean)
    } catch {
      return value.split(",").map((s) => s.trim()).filter(Boolean)
    }
  }
  return fallback
}

/**
 * Insert alert rules with format fallbacks for JSONB vs text[] schema drift
 * between create_attendance_alerts_system.sql and script 100/101.
 */
async function insertRuleWithFallback(service: any, base: Record<string, any>) {
  const channels = asArray(base.notification_channels, ["in_app"])
  const roles = asArray(base.recipient_roles, ["admin", "hr"])

  const attempts: Record<string, any>[] = [
    // Prefer native arrays (works for text[] and usually for jsonb via PostgREST)
    { ...base, notification_channels: channels, recipient_roles: roles },
    // JSON strings for jsonb columns that reject arrays
    {
      ...base,
      notification_channels: JSON.stringify(channels),
      recipient_roles: JSON.stringify(roles),
    },
    // Minimal payload if optional columns fail
    {
      company_id: base.company_id,
      rule_name: base.rule_name,
      rule_type: base.rule_type,
      alert_category: base.alert_category,
      trigger_condition: base.trigger_condition,
      severity: base.severity,
      is_active: base.is_active,
      notification_channels: channels,
      recipient_roles: roles,
    },
    {
      company_id: base.company_id,
      rule_name: base.rule_name,
      rule_type: base.rule_type,
      alert_category: base.alert_category,
      trigger_condition: typeof base.trigger_condition === "string"
        ? base.trigger_condition
        : JSON.stringify(base.trigger_condition || {}),
      severity: base.severity,
      is_active: base.is_active,
      notification_channels: JSON.stringify(channels),
      recipient_roles: JSON.stringify(roles),
    },
  ]

  let lastError: Error | null = null
  for (const payload of attempts) {
    const { data, error } = await service.from("attendance_alert_rules").insert(payload).select().single()
    if (!error) return data
    lastError = new Error(error.message)
    // Only retry type / column mismatches
    if (!/json|array|column|type|invalid input|does not exist|null value/i.test(error.message)) {
      throw lastError
    }
  }
  throw lastError || new Error("Failed to insert alert rule")
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const ruleType = searchParams.get("rule_type")

    let query = ctx.service
      .from("attendance_alert_rules")
      .select("*")
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })

    if (ruleType) query = query.eq("rule_type", ruleType)

    const { data, error } = await query
    if (error) {
      if (/does not exist|column/i.test(error.message)) {
        const fb = await ctx.service
          .from("attendance_alert_rules")
          .select("*")
          .order("created_at", { ascending: false })
        if (fb.error) throw new Error(fb.error.message)
        const rows = (fb.data || []).filter((r: any) => !r.company_id || r.company_id === ctx.companyId)
        return NextResponse.json({ success: true, data: rows })
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return jsonError(error, "Failed to load alert rules")
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

    const ruleName = String(body.rule_name || body.name || "").trim()
    if (!ruleName) {
      return NextResponse.json({ error: "rule_name is required" }, { status: 400 })
    }

    const alertType = body.alert_type || body.alert_category || "late_arrival"
    const threshold = body.threshold_minutes != null ? Number(body.threshold_minutes) : null
    const channels = asArray(body.notification_channels || body.channels, ["in_app"])
    const roles = asArray(
      body.recipient_roles,
      [
        ...(body.notify_hr !== false ? ["hr"] : []),
        ...(body.notify_manager ? ["manager"] : []),
        "admin",
      ].filter(Boolean),
    )

    const payload = {
      company_id: ctx.companyId,
      rule_name: ruleName,
      rule_type: body.rule_type || "attendance",
      alert_category: alertType,
      trigger_condition: body.trigger_condition || {
        alert_type: alertType,
        threshold_minutes: threshold,
      },
      severity: body.severity || "medium",
      notification_channels: channels,
      recipient_roles: roles.length ? roles : ["admin", "hr"],
      is_auto_escalate: Boolean(body.is_auto_escalate),
      escalation_delay_hours: Number(body.escalation_delay_hours ?? 24),
      is_active: body.is_active !== false,
      template_key: body.template_key || null,
      updated_at: new Date().toISOString(),
    }

    const data = await insertRuleWithFallback(ctx.service, payload)
    return NextResponse.json({ success: true, data }, { status: 201 })
  } catch (error) {
    return jsonError(error, "Failed to create alert rule")
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

    const ruleId = body.rule_id || body.id
    if (!ruleId) {
      return NextResponse.json({ error: "rule_id required" }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.rule_name !== undefined || body.name !== undefined) {
      updates.rule_name = body.rule_name || body.name
    }
    if (body.trigger_condition !== undefined) updates.trigger_condition = body.trigger_condition
    if (body.severity !== undefined) updates.severity = body.severity
    if (body.notification_channels !== undefined || body.channels !== undefined) {
      updates.notification_channels = asArray(body.notification_channels || body.channels, ["in_app"])
    }
    if (body.recipient_roles !== undefined) {
      updates.recipient_roles = asArray(body.recipient_roles, ["admin", "hr"])
    }
    if (body.is_auto_escalate !== undefined) updates.is_auto_escalate = body.is_auto_escalate
    if (body.escalation_delay_hours !== undefined) updates.escalation_delay_hours = body.escalation_delay_hours
    if (body.is_active !== undefined) updates.is_active = body.is_active
    if (body.template_key !== undefined) updates.template_key = body.template_key
    if (body.alert_category !== undefined || body.alert_type !== undefined) {
      updates.alert_category = body.alert_category || body.alert_type
    }

    let { data, error } = await ctx.service
      .from("attendance_alert_rules")
      .update(updates)
      .eq("id", ruleId)
      .eq("company_id", ctx.companyId)
      .select()
      .single()

    if (error && /json|array|type|invalid input/i.test(error.message)) {
      const retryUpdates = { ...updates }
      if (Array.isArray(retryUpdates.notification_channels)) {
        retryUpdates.notification_channels = JSON.stringify(retryUpdates.notification_channels)
      }
      if (Array.isArray(retryUpdates.recipient_roles)) {
        retryUpdates.recipient_roles = JSON.stringify(retryUpdates.recipient_roles)
      }
      const retry = await ctx.service
        .from("attendance_alert_rules")
        .update(retryUpdates)
        .eq("id", ruleId)
        .eq("company_id", ctx.companyId)
        .select()
        .single()
      data = retry.data
      error = retry.error
    }

    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true, data })
  } catch (error) {
    return jsonError(error, "Failed to update alert rule")
  }
}
