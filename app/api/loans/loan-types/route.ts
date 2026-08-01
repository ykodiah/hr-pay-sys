import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { getLoanTypes, createLoanType } from "@/lib/services/loan-advanced-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
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
    const { companyId, userId } = ctx

    const loanType = await createLoanType(companyId, {
      ...body,
      company_id: companyId,
      created_by: userId || "system",
    })

    return NextResponse.json(loanType, { status: 201 })
  } catch (error) {
    console.error("[v0] Create loan type error:", error)
    return jsonError(error, "Failed to create loan type")
  }
}
