import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  getEmployeeAuditEvent,
  listEmployeeAuditEvents,
  reverseAuditEvent,
} from "@/lib/services/employee-audit-service"

/** GET /api/employees/audit?employee_id=&event_type=&id= */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const id = sp.get("id")
    if (id) {
      const event = await getEmployeeAuditEvent(ctx.companyId, id)
      if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 })
      return NextResponse.json({ event })
    }

    const events = await listEmployeeAuditEvents({
      companyId: ctx.companyId,
      employeeId: sp.get("employee_id"),
      eventType: sp.get("event_type"),
      limit: Number(sp.get("limit") || 50),
    })
    return NextResponse.json({ events })
  } catch (err) {
    return jsonError(err, "Failed to load audit trail")
  }
}

/** POST /api/employees/audit — reverse an event */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    if (body.action !== "reverse") {
      return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    }
    if (!body.event_id) {
      return NextResponse.json({ error: "event_id required" }, { status: 400 })
    }
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: "Reason is required to reverse" }, { status: 400 })
    }

    // Resolve actor role from linked employee for reverse gate
    let role: string | null = null
    if (ctx.userId) {
      const { data: me } = await ctx.service
        .from("employees")
        .select("special_role")
        .eq("company_id", ctx.companyId)
        .or(`user_id.eq.${ctx.userId},id.eq.${ctx.userId}`)
        .limit(1)
        .maybeSingle()
      role = me?.special_role || null
    }

    const result = await reverseAuditEvent({
      companyId: ctx.companyId,
      eventId: body.event_id,
      reason: body.reason,
      actor: { userId: ctx.userId, role },
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return jsonError(err, "Reverse failed")
  }
}
