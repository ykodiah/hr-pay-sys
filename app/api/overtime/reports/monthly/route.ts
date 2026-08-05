import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { getMonthlyOvertimeReport } from "@/lib/services/overtime-payroll-service"

/**
 * GET /api/overtime/reports/monthly?period=YYYY-MM&employee_id=
 * Tenant-isolated monthly OT earnings statement per employee.
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const sp = request.nextUrl.searchParams
    const now = new Date()
    const period =
      sp.get("period") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    const employeeId = sp.get("employee_id")

    const report = await getMonthlyOvertimeReport({
      companyId: ctx.companyId,
      period,
      employeeId,
    })

    return NextResponse.json({ success: true, ...report })
  } catch (err) {
    return jsonError(err, "Failed to load monthly overtime report")
  }
}
