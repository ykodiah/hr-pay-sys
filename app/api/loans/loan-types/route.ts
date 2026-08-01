import { NextRequest, NextResponse } from "next/server"
import {
  resolveTenantContext,
  jsonError,
  isUnresolvedTenant,
} from "@/lib/settings/resolve-tenant"
import { getLoanTypes, createLoanType } from "@/lib/services/loan-advanced-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const { companyId } = ctx

    const loanTypes = await getLoanTypes(companyId)
    return NextResponse.json(loanTypes)
  } catch (error) {
    console.error("[v0] Loan types error:", error)
    return jsonError(error, "Failed to fetch loan types")
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
    const { companyId, userId } = ctx

    const { company_id: _ignored, created_by: _cb, ...rest } = body
    const loanType = await createLoanType(companyId, {
      ...rest,
      created_by: userId || "system",
    })

    return NextResponse.json(loanType, { status: 201 })
  } catch (error) {
    console.error("[v0] Create loan type error:", error)
    return jsonError(error, "Failed to create loan type")
  }
}
