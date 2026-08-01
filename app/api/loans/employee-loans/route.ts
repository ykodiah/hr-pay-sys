import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { createLoan as createAdvancedLoan } from "@/lib/services/loan-advanced-service"
import { createLoan as createPayrollLoan, listLoans } from "@/lib/services/loan-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get("employee_id") ?? undefined

    const loans = await listLoans({
      company_id: companyId,
      employee_id: employeeId,
    })
    return NextResponse.json(loans)
  } catch (error) {
    console.error("[v0] Get employee loans error:", error)
    return jsonError(error, "Failed to fetch loans")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, service } = ctx

    if (!body.employee_id) {
      return NextResponse.json({ error: "employee_id required" }, { status: 400 })
    }

    const { data: emp } = await service
      .from("employees")
      .select("id")
      .eq("id", body.employee_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!emp?.id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 403 })
    }

    // Prefer advanced loan-type path when loan_type_id is supplied
    if (body.loan_type_id) {
      const result = await createAdvancedLoan({
        companyId,
        employeeId: body.employee_id,
        loanTypeId: body.loan_type_id,
        principalAmount: Number(body.principal_amount ?? body.principal),
        tenureMonths: Number(body.tenure_months ?? body.repayment_months),
        reason: body.reason || body.purpose,
        initiatedByRole: body.initiated_by_role || "employee",
        initiatedById: userId || "system",
      })
      return NextResponse.json(result, { status: 201 })
    }

    // Fallback: payroll-compatible loan create
    const loan = await createPayrollLoan({
      company_id: companyId,
      employee_id: body.employee_id,
      loan_type: body.loan_type || "Personal Loan",
      purpose: body.purpose || body.reason,
      principal: Number(body.principal_amount ?? body.principal),
      interest_rate: Number(body.interest_rate ?? 0),
      repayment_months: Number(body.tenure_months ?? body.repayment_months),
      start_date: body.start_date,
      auto_deduct: body.auto_deduct ?? true,
      notes: body.notes,
      created_by: userId ?? undefined,
      activate: false,
    })

    return NextResponse.json(loan, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Create loan error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create loan" },
      { status: 500 },
    )
  }
}
