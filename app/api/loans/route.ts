import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { createLoan, listLoans } from "@/lib/services/loan-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx

    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get("employee_id") ?? undefined
    const status = searchParams.get("status") ?? undefined

    const loans = await listLoans({
      company_id: companyId,
      employee_id,
      status: status as any,
    })
    return NextResponse.json({ loans, company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to load loans")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, service } = ctx

    const {
      employee_id,
      loan_type,
      purpose,
      principal,
      interest_rate,
      repayment_months,
      start_date,
      auto_deduct,
      notes,
    } = body

    if (!employee_id || !principal || !repayment_months) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: emp } = await service
      .from("employees")
      .select("id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!emp?.id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 403 })
    }

    const loan = await createLoan({
      employee_id,
      company_id: companyId,
      loan_type: loan_type ?? "Personal Loan",
      purpose,
      principal: Number(principal),
      interest_rate: Number(interest_rate ?? 0),
      repayment_months: Number(repayment_months),
      start_date,
      auto_deduct,
      notes,
      created_by: userId,
    })

    return NextResponse.json({ loan }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create loan")
  }
}
