import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { applyGovernedEmployeeUpdate } from "@/lib/services/employee-audit-service"
import { hasOrgFieldsInBody } from "@/lib/employees/audit-fields"
import { buildDiffs, EMPLOYEE_UPDATE_FIELDS, FINANCIAL_UPDATE_FIELDS } from "@/lib/employees/audit-fields"

/**
 * POST /api/employees/update
 * Governed employee data update (non-org). Requires reason. Writes audit trail.
 * Body: { employee_id, reason, patch: {...}, financial?: {...} }
 *
 * GET ?employee_id=&preview=1 with proposed fields via query is not used —
 * POST with action=preview returns diffs without saving.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const employeeId = body.employee_id
    if (!employeeId) return NextResponse.json({ error: "employee_id required" }, { status: 400 })

    const orgAttempt = hasOrgFieldsInBody(body.patch || body)
    if (orgAttempt.length) {
      return NextResponse.json(
        {
          error: `Organisational fields (${orgAttempt.join(", ")}) must be changed via Transfer Employee, not Update Employee Data.`,
          use: "/app/employees/transfer",
        },
        { status: 400 },
      )
    }

    const patch = body.patch || {}
    const financial = body.financial || null
    const reason = String(body.reason || "").trim()

    // Preview only
    if (body.action === "preview") {
      const { data: before } = await ctx.service
        .from("employees")
        .select("*")
        .eq("id", employeeId)
        .eq("company_id", ctx.companyId)
        .maybeSingle()
      if (!before) return NextResponse.json({ error: "Employee not found" }, { status: 404 })
      const { data: beforeFin } = await ctx.service
        .from("employee_financial")
        .select("*")
        .eq("employee_id", employeeId)
        .maybeSingle()

      const empDiffs = buildDiffs(before, patch, EMPLOYEE_UPDATE_FIELDS, "employee")
      const finDiffs = financial
        ? buildDiffs(beforeFin || {}, financial, FINANCIAL_UPDATE_FIELDS, "financial")
        : []
      return NextResponse.json({ diffs: [...empDiffs, ...finDiffs], employee: before })
    }

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    const result = await applyGovernedEmployeeUpdate({
      companyId: ctx.companyId,
      employeeId,
      patch,
      financial,
      reason,
      actor: {
        userId: ctx.userId,
        email: undefined,
        name: undefined,
        role: undefined,
      },
      source: "hr_update",
    })

    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return jsonError(err, "Employee update failed")
  }
}
