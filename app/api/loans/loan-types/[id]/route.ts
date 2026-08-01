import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { deleteLoanType, getLoanTypeById, updateLoanType } from "@/lib/services/loan-advanced-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx
    const { id } = await params

    const loanType = await getLoanTypeById(id)
    if (!loanType || loanType.company_id !== companyId) {
      return NextResponse.json({ error: "Loan type not found" }, { status: 404 })
    }
    return NextResponse.json(loanType)
  } catch (error) {
    return jsonError(error, "Failed to fetch loan type")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx
    const { id } = await params
    const body = await request.json()

    const existing = await getLoanTypeById(id)
    if (!existing || existing.company_id !== companyId) {
      return NextResponse.json({ error: "Loan type not found" }, { status: 404 })
    }

    const updated = await updateLoanType(id, body)
    return NextResponse.json(updated)
  } catch (error) {
    return jsonError(error, "Failed to update loan type")
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx
    const { id } = await params

    const existing = await getLoanTypeById(id)
    if (!existing || existing.company_id !== companyId) {
      return NextResponse.json({ error: "Loan type not found" }, { status: 404 })
    }

    await deleteLoanType(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return jsonError(error, "Failed to delete loan type")
  }
}
