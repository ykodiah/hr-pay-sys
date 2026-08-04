import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { evaluateAttendanceAlerts } from "@/lib/services/attendance-alerts-evaluate"

/** POST /api/attendance/alerts/evaluate — scan attendance & create alerts from active rules */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const result = await evaluateAttendanceAlerts({
      companyId: ctx.companyId,
      from: body.from,
      to: body.to,
    })

    return NextResponse.json({
      success: true,
      message: `Created ${result.created} alert(s) from ${result.scanned} attendance row(s)`,
      ...result,
    })
  } catch (err) {
    return jsonError(err, "Failed to evaluate attendance alerts")
  }
}
