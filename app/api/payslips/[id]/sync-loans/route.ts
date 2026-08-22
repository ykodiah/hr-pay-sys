/**
 * POST /api/payslips/[id]/sync-loans
 * Ensure loan payments for this payslip are split by loan type and
 * return the loan summary rows for Opening / This month / Closing.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { getPayslipById } from "@/lib/services/payslip-service"
import { ensurePayslipLoanPayments } from "@/lib/services/loan-service"
import {
  buildPayslipLoanSummaryRows,
  isLoanInPayPeriod,
  toPayPeriod,
} from "@/lib/payroll/loan-summary"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const { data: slip, error } = await getPayslipById(id)
    if (error || !slip) {
      return NextResponse.json({ error: error ?? "Payslip not found" }, { status: 404 })
    }

    const client = await createClient()
    const period = toPayPeriod(slip.pay_period)
    const loanDeduction = Number(slip.loan_deduction || 0)

    if (loanDeduction > 0) {
      await ensurePayslipLoanPayments({
        companyId: slip.company_id,
        employeeId: slip.employee_id,
        totalDeduction: loanDeduction,
        payrollRunId: slip.payroll_run_id ?? null,
        payslipId: slip.id,
        payPeriod: period,
        paymentDate: slip.pay_date || new Date().toISOString().slice(0, 10),
      })
    }

    const [loanRes, paymentRes] = await Promise.all([
      client
        .from("employee_loans")
        .select("*")
        .eq("employee_id", slip.employee_id)
        .eq("company_id", slip.company_id)
        .in("status", ["active", "approved", "disbursed", "completed"])
        .order("created_at", { ascending: true }),
      client
        .from("payroll_loan_payments")
        .select("loan_id, amount, balance_before, balance_after, payslip_id, pay_period, payroll_run_id, payment_date")
        .eq("employee_id", slip.employee_id)
        .eq("company_id", slip.company_id)
        .eq("payslip_id", slip.id),
    ])

    const payments = paymentRes.data ?? []
    const paidLoanIds = new Set(payments.map((p) => p.loan_id))
    const loans = (loanRes.data ?? []).filter((l) => {
      if (paidLoanIds.has(l.id)) return true
      if (!["active", "approved"].includes(String(l.status))) return false
      return isLoanInPayPeriod(l, period)
    })

    const summary = buildPayslipLoanSummaryRows(loans, payments, {
      loanDeductionTotal: loanDeduction,
    })

    await client
      .from("payslips")
      .update({
        loan_summary_lines: summary,
        updated_at: new Date().toISOString(),
      })
      .eq("id", slip.id)

    return NextResponse.json({
      loans: loans.map((l) => ({
        ...l,
        this_month_paid: Number(
          summary.find((s) => s.loan_id === l.id)?.this_month ||
            payments.filter((p) => p.loan_id === l.id).reduce((s, p) => s + Number(p.amount || 0), 0),
        ),
      })),
      payments,
      summary,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync loan summary" },
      { status: 500 },
    )
  }
}
