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
    // Still show if needed via payment rows — caller handles that
    return false
  }
  return true
}

export function buildPayslipLoanSummaryRows(
  loans: Array<Record<string, any>>,
  payments: PayslipLoanPayment[] = [],
): PayslipLoanSummaryRow[] {
  const byLoan = new Map<string, PayslipLoanPayment[]>()
  for (const p of payments) {
    if (!p.loan_id) continue
    const list = byLoan.get(p.loan_id) ?? []
    list.push(p)
    byLoan.set(p.loan_id, list)
  }

  return (loans || []).map((l) => {
    const rows = byLoan.get(String(l.id)) ?? []
    const thisMonth = round2(rows.reduce((s, r) => s + n(r.amount), 0) || n(l.this_month_paid))
    const paymentOpening = rows.find((r) => r.balance_before != null)?.balance_before
    const paymentClosing = rows.length
      ? rows[rows.length - 1]?.balance_after
      : null

    const closing =
      paymentClosing != null && paymentClosing !== ""
        ? round2(n(paymentClosing))
        : round2(n(l.remaining_balance))

    // Opening = DB outstanding before this run's payment(s)
    const opening =
      paymentOpening != null && paymentOpening !== ""
        ? round2(n(paymentOpening))
        : round2(closing + thisMonth)

    const totalPayable = n(l.expected_total_payment) || n(l.principal) + n(l.total_interest)

    return {
      loan_id: String(l.id || ""),
      loan_type: String(l.loan_type || "Loan"),
      opening_balance: opening > 0 ? opening : totalPayable,
      this_month: thisMonth,
      closing_balance: closing,
    }
  })
}
