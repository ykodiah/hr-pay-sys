/**
 * Payslip loan summary helpers: period eligibility, this-month payments,
 * opening/closing balances from DB payment rows.
 */

export type PayslipLoanPayment = {
  loan_id: string
  amount?: number | null
  balance_before?: number | null
  balance_after?: number | null
  payslip_id?: string | null
  pay_period?: string | null
  payroll_run_id?: string | null
}

export type PayslipLoanSummaryRow = {
  loan_id: string
  loan_type: string
  opening_balance: number
  this_month: number
  closing_balance: number
}

export type AllocatableLoan = {
  id: string
  loan_type?: string | null
  monthly_payment?: number | null
  monthly_installment?: number | null
  remaining_balance?: number | null
  amount_paid?: number | null
  expected_total_payment?: number | null
  total_interest?: number | null
  principal?: number | null
  this_month_paid?: number | null
}

function round2(n: number): number {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

function n(v: unknown): number {
  return Number(v || 0)
}

/** YYYY-MM from a date or period string. */
export function toPayPeriod(value: string | null | undefined): string {
  if (!value) return ""
  return String(value).slice(0, 7)
}

/**
 * Loan should appear on a payslip only from its start / approval month onward —
 * not in retrospective periods before initiation.
 */
export function isLoanInPayPeriod(
  loan: {
    start_date?: string | null
    disbursed_at?: string | null
    approved_at?: string | null
    created_at?: string | null
    end_date?: string | null
    status?: string | null
  },
  payPeriod: string,
): boolean {
  const period = toPayPeriod(payPeriod)
  if (!period) return true

  const start =
    toPayPeriod(loan.start_date) ||
    toPayPeriod(loan.disbursed_at) ||
    toPayPeriod(loan.approved_at) ||
    toPayPeriod(loan.created_at)

  if (start && start > period) return false

  const end = toPayPeriod(loan.end_date)
  if (end && end < period && String(loan.status) === "completed") {
    return false
  }
  return true
}

function loanMonthlyCharge(loan: AllocatableLoan): number {
  return round2(Number(loan.monthly_payment ?? loan.monthly_installment ?? 0))
}

function loanTotalPayable(loan: AllocatableLoan): number {
  const expected = Number(loan.expected_total_payment || 0)
  if (expected > 0) return round2(expected)
  return round2(Number(loan.principal || 0) + Number(loan.total_interest || 0))
}

function loanBalance(loan: AllocatableLoan): number {
  if (loan.remaining_balance != null && loan.remaining_balance !== ("" as any)) {
    return round2(n(loan.remaining_balance))
  }
  return round2(Math.max(0, loanTotalPayable(loan) - n(loan.amount_paid)))
}

/**
 * Pure allocation of a payroll loan_deduction across loans.
 * First pass: each loan's monthly charge; second pass: leftover FIFO by balance.
 */
export function allocateLoanDeduction(
  loans: AllocatableLoan[],
  totalDeduction: number,
): Array<{ loanId: string; amount: number }> {
  let remaining = round2(totalDeduction)
  if (remaining <= 0 || !loans.length) return []

  const allocation: Array<{ loanId: string; amount: number }> = []

  for (const loan of loans) {
    if (remaining <= 0.009) break
    const charge = loanMonthlyCharge(loan)
    const bal = loanBalance(loan)
    if (charge <= 0.009 || bal <= 0.009) continue
    const pay = Math.min(charge, bal, remaining)
    if (pay <= 0.009) continue
    allocation.push({ loanId: String(loan.id), amount: pay })
    remaining = round2(remaining - pay)
  }

  if (remaining > 0.009) {
    for (const loan of loans) {
      if (remaining <= 0.009) break
      const already = allocation.find((a) => a.loanId === String(loan.id))?.amount || 0
      const bal = round2(loanBalance(loan) - already)
      if (bal <= 0.009) continue
      const pay = Math.min(bal, remaining)
      if (pay <= 0.009) continue
      const row = allocation.find((a) => a.loanId === String(loan.id))
      if (row) row.amount = round2(row.amount + pay)
      else allocation.push({ loanId: String(loan.id), amount: pay })
      remaining = round2(remaining - pay)
    }
  }

  return allocation
}

/**
 * Build loan summary rows. When payments are missing but loan_deduction > 0,
 * allocate the deduction across loans so "This month" matches Loan Repayment.
 */
export function buildPayslipLoanSummaryRows(
  loans: AllocatableLoan[],
  payments: PayslipLoanPayment[] = [],
  opts?: { loanDeductionTotal?: number },
): PayslipLoanSummaryRow[] {
  const byLoan = new Map<string, PayslipLoanPayment[]>()
  for (const p of payments) {
    if (!p.loan_id) continue
    const list = byLoan.get(p.loan_id) ?? []
    list.push(p)
    byLoan.set(p.loan_id, list)
  }

  let rows = (loans || []).map((l) => {
    const paymentRows = byLoan.get(String(l.id)) ?? []
    const thisMonth = round2(
      paymentRows.reduce((s, r) => s + n(r.amount), 0) || n(l.this_month_paid),
    )
    const paymentOpening = paymentRows.find((r) => r.balance_before != null)?.balance_before
    const paymentClosing = paymentRows.length
      ? paymentRows[paymentRows.length - 1]?.balance_after
      : null

    const closing =
      paymentClosing != null && paymentClosing !== ""
        ? round2(n(paymentClosing))
        : round2(loanBalance(l))

    const opening =
      paymentOpening != null && paymentOpening !== ""
        ? round2(n(paymentOpening))
        : round2(closing + thisMonth)

    const totalPayable = loanTotalPayable(l)

    return {
      loan_id: String(l.id || ""),
      loan_type: String(l.loan_type || "Loan"),
      opening_balance: opening > 0 ? opening : totalPayable,
      this_month: thisMonth,
      closing_balance: closing,
    }
  })

  const deduction = round2(n(opts?.loanDeductionTotal))
  const paidTotal = round2(rows.reduce((s, r) => s + r.this_month, 0))

  // Repair display when Loan Repayment has an amount but summary rows show 0
  if (deduction > 0.009 && Math.abs(paidTotal - deduction) > 0.05) {
    const allocation = allocateLoanDeduction(loans, deduction)
    const amountByLoan = new Map(allocation.map((a) => [a.loanId, a.amount]))
    rows = rows.map((r) => {
      const thisMonth = round2(amountByLoan.get(r.loan_id) || 0)
      const opening = r.opening_balance > 0 ? r.opening_balance : round2(r.closing_balance + thisMonth)
      return {
        ...r,
        opening_balance: opening,
        this_month: thisMonth,
        closing_balance: round2(Math.max(0, opening - thisMonth)),
      }
    })

    // Include loans that received allocation but were missing from the list
    for (const a of allocation) {
      if (rows.some((r) => r.loan_id === a.loanId)) continue
      const loan = loans.find((l) => String(l.id) === a.loanId)
      if (!loan) continue
      const opening = loanBalance(loan)
      rows.push({
        loan_id: a.loanId,
        loan_type: String(loan.loan_type || "Loan"),
        opening_balance: opening,
        this_month: a.amount,
        closing_balance: round2(Math.max(0, opening - a.amount)),
      })
    }
  }

  return rows
}
