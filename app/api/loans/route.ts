import { NextRequest, NextResponse } from "next/server"
import {
  resolveTenantContext,
  jsonError,
  isUnresolvedTenant,
} from "@/lib/settings/resolve-tenant"
import { createLoan, listLoans } from "@/lib/services/loan-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
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
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const { companyId, userId, service } = ctx

    const {
      employee_id,
      loan_type,
      loan_type_id,
      purpose,
      principal,
      interest_rate,
      repayment_months,
      start_date,
      auto_deduct,
      notes,
      activate,
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

    let resolvedLoanType = loan_type ?? "Personal Loan"
    let resolvedInterest = Number(interest_rate ?? 0)
    let resolvedTypeId: string | null = loan_type_id || null

    if (loan_type_id) {
      const { data: typeRow } = await service
        .from("loan_types")
        .select("id, name, annual_interest_rate, min_amount, max_amount, min_tenure_months, max_tenure_months, company_id, is_active")
        .eq("id", loan_type_id)
        .eq("company_id", companyId)
        .maybeSingle()

      if (!typeRow?.id || typeRow.is_active === false) {
        return NextResponse.json({ error: "Selected loan type was not found" }, { status: 400 })
      }

      const amount = Number(principal)
      const tenure = Number(repayment_months)
      if (amount < Number(typeRow.min_amount ?? 0) || amount > Number(typeRow.max_amount ?? amount)) {
        return NextResponse.json(
          {
            error: `Principal must be between ${typeRow.min_amount} and ${typeRow.max_amount} for ${typeRow.name}`,
          },
          { status: 400 },
        )
      }
      if (
        tenure < Number(typeRow.min_tenure_months ?? 1) ||
        tenure > Number(typeRow.max_tenure_months ?? tenure)
      ) {
        return NextResponse.json(
          {
            error: `Tenure must be between ${typeRow.min_tenure_months} and ${typeRow.max_tenure_months} months for ${typeRow.name}`,
          },
          { status: 400 },
        )
      }

      resolvedLoanType = typeRow.name
      resolvedTypeId = typeRow.id
      if (interest_rate == null || interest_rate === "") {
        resolvedInterest = Number(typeRow.annual_interest_rate ?? 0)
      }
    }

    const loan = await createLoan({
      employee_id,
      company_id: companyId,
      loan_type: resolvedLoanType,
      loan_type_id: resolvedTypeId,
      purpose,
      principal: Number(principal),
      interest_rate: resolvedInterest,
      repayment_months: Number(repayment_months),
      start_date,
      auto_deduct,
      notes,
      created_by: userId ?? undefined,
      activate: activate !== false,
    })

    return NextResponse.json({ loan }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create loan")
  }
}
