import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { syncOvertimeToPayroll } from "@/lib/services/overtime-payroll-service"

/**
 * POST /api/overtime/sync-payroll
 * Body: { period: "YYYY-MM", overwrite?: boolean }
 * Rolls approved OT amounts into payroll_pay_inputs.overtime_amount (company-scoped).
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

    const result = await syncOvertimeToPayroll({
      companyId: ctx.companyId,
      period,
      overwriteManual: Boolean(body.overwrite),
    })

    return NextResponse.json({
      success: true,
      message: `Synced overtime for ${result.employees_synced} employee(s) into pay inputs`,
      ...result,
      next_step: "Open Payroll → Pay Inputs to review overtime amounts, then process the payroll run.",
    })
  } catch (err) {
    return jsonError(err, "Failed to sync overtime to payroll")
  }
}
