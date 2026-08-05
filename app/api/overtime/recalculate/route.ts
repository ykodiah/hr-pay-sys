import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { recalculateApprovedOvertime } from "@/lib/services/overtime-payroll-service"

/**
 * POST /api/overtime/recalculate
 * Body: { period: "YYYY-MM" }
 * Recomputes hourly rate (GRA floor) × multiplier × hours for approved OT rows.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const period =
      body.period ||
      (() => {
        const d = new Date()
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      })()

    const result = await recalculateApprovedOvertime({
      companyId: ctx.companyId,
      period,
    })

    return NextResponse.json({
      success: true,
      message: `Recalculated ${result.updated} of ${result.total} approved OT row(s)`,
      ...result,
    })
  } catch (err) {
    return jsonError(err, "Failed to recalculate overtime")
  }
}
