import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  applyEmployeeTransfer,
  listEmployeeTransfers,
} from "@/lib/services/employee-audit-service"

/** GET /api/employees/transfers?employee_id= */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const employeeId = request.nextUrl.searchParams.get("employee_id")
    const transfers = await listEmployeeTransfers(ctx.companyId, employeeId)
    return NextResponse.json({ transfers })
  } catch (err) {
    return jsonError(err, "Failed to load transfers")
  }
}

/** POST /api/employees/transfers — apply org transfer */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    if (!body.employee_id) {
      return NextResponse.json({ error: "employee_id required" }, { status: 400 })
    }
    if (!body.reason?.trim()) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 })
    }

    const result = await applyEmployeeTransfer({
      companyId: ctx.companyId,
      employeeId: body.employee_id,
      effectiveDate: body.effective_date || new Date().toISOString().slice(0, 10),
      reason: body.reason,
      referenceNo: body.reference_no || null,
      notes: body.notes || null,
      to: {
        subsidiary_id: body.to_subsidiary_id !== undefined ? body.to_subsidiary_id : body.subsidiary_id,
        division: body.to_division !== undefined ? body.to_division : body.division,
        department: body.to_department !== undefined ? body.to_department : body.department,
        location: body.to_location !== undefined ? body.to_location : body.location,
        direct_supervisor:
          body.to_direct_supervisor !== undefined
            ? body.to_direct_supervisor
            : body.direct_supervisor,
        head_of_department:
          body.to_head_of_department !== undefined
            ? body.to_head_of_department
            : body.head_of_department,
      },
      actor: { userId: ctx.userId },
    })

    return NextResponse.json({ success: true, ...result }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Transfer failed")
  }
}
