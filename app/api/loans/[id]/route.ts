import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import {
  getLoanWithSchedule,
  approveLoan,
  rejectLoan,
  cancelLoan,
  recordLoanPayment,
} from "@/lib/services/loan-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx

    const { id } = await params
    const result = await getLoanWithSchedule(id)

    if (result.loan.company_id !== companyId) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (err) {
    return jsonError(err, "Failed to load loan")
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, service } = ctx

    const { id } = await params
    const body = await request.json()
    const { action, rejection_reason, amount, payslip_id } = body

    const { data: existing } = await service
      .from("employee_loans")
      .select("id, company_id")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle()

    if (!existing?.id) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    switch (action) {
      case "approve":
        await approveLoan(id, userId || "system")
        return NextResponse.json({
          success: true,
          message: "Loan approved and activated for payroll deduction",
        })
      case "reject":
        if (!rejection_reason) {
          return NextResponse.json({ error: "rejection_reason required" }, { status: 400 })
        }
        await rejectLoan(id, userId || "system", rejection_reason)
        return NextResponse.json({ success: true, message: "Loan rejected" })
      case "cancel":
        await cancelLoan(id)
        return NextResponse.json({ success: true, message: "Loan cancelled" })
      case "record_payment": {
        const payAmount = Number(amount)
        if (!payAmount || payAmount <= 0) {
          return NextResponse.json({ error: "amount must be a positive number" }, { status: 400 })
        }
        await recordLoanPayment(`loan:${id}`, payAmount, payslip_id)
        return NextResponse.json({ success: true, message: "Payment recorded" })
      }
      default:
        return NextResponse.json(
          { error: "Invalid action. Use: approve | reject | cancel | record_payment" },
          { status: 400 },
        )
    }
  } catch (err) {
    return jsonError(err, "Failed to update loan")
  }
}
