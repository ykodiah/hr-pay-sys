import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { applyGovernedEmployeeUpdate } from "@/lib/services/employee-audit-service"
import { ORG_TRANSFER_FIELDS } from "@/lib/employees/audit-fields"
import {
  buildDiffs,
  EMPLOYEE_UPDATE_FIELDS,
  FINANCIAL_UPDATE_FIELDS,
  toEffectiveDate,
} from "@/lib/employees/audit-fields"

function stripOrgFields(patch: Record<string, any> = {}) {
  const cleaned = { ...patch }
  for (const key of ORG_TRANSFER_FIELDS) delete cleaned[key]
  return cleaned
}

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

    // Org fields are ignored (not errors) — Transfer Employee owns those
    const patch = stripOrgFields(body.patch || {})
    const financial = body.financial || null
    const reason = String(body.reason || "").trim()
    const effectiveDate = toEffectiveDate(body.effective_date || body.effectiveDate)

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
      return NextResponse.json({
        diffs: [...empDiffs, ...finDiffs],
        employee: before,
        effective_date: effectiveDate,
        note: "Organisational fields are excluded — use Transfer Employee for dept/location moves.",
      })
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
      effectiveDate,
      allowances: Array.isArray(body.allowances) ? body.allowances : null,
      documents: Array.isArray(body.documents) ? body.documents : null,
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
