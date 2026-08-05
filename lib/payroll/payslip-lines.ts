/** Build named earnings/deduction lines for payslip UI and PDF. */

export type PayslipMoneyLine = { label: string; amount: number }

function n(v: unknown): number {
  return Number(v || 0)
}

function asLines(raw: unknown): PayslipMoneyLine[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => ({
      label: String((row as any)?.label || (row as any)?.name || (row as any)?.description || "").trim(),
      amount: n((row as any)?.amount ?? (row as any)?.val),
    }))
    .filter((row) => row.label && row.amount > 0)
}

/** Earnings lines: standard named allowances + any issued allowance cards. */
export function buildPayslipEarningsLines(slip: Record<string, any>): PayslipMoneyLine[] {
  const stored = asLines(slip.allowance_lines ?? slip.earnings_lines)
  const standard: PayslipMoneyLine[] = [
    { label: "Basic Salary", amount: n(slip.basic_salary) },
    { label: "Transport Allowance", amount: n(slip.transport_allowance) },
    { label: "Housing Allowance", amount: n(slip.housing_allowance) },
    { label: "Medical Allowance", amount: n(slip.medical_allowance) },
    { label: "Meal Allowance", amount: n(slip.meal_allowance) },
    { label: "Communication Allowance", amount: n(slip.communication_allowance) },
    { label: "Uniform Allowance", amount: n(slip.uniform_allowance) },
    { label: "Overtime", amount: n(slip.overtime_pay) },
    { label: "Bonus", amount: n(slip.bonus_pay) },
  ].filter((e) => e.amount > 0)

  // Prefer explicit issued lines when present; otherwise show master other_allowances
  if (stored.length) {
    return [...standard, ...stored]
  }

  const other = n(slip.other_allowances)
  if (other > 0) standard.push({ label: "Other Allowances", amount: other })
  return standard
}

/** Deduction lines: statutory + loan/advance + named other deduction cards. */
export function buildPayslipDeductionLines(slip: Record<string, any>): PayslipMoneyLine[] {
  const stored = asLines(slip.deduction_lines)
  const standard: PayslipMoneyLine[] = [
    { label: "SSNIT (Employee 5.5%)", amount: n(slip.ssnit_employee) },
    { label: "Tier 3 / Provident Fund", amount: n(slip.tier3_employee) },
    { label: "PAYE Tax", amount: n(slip.paye_tax) },
    { label: "Loan Repayment", amount: n(slip.loan_deduction) },
    { label: "Advance Deduction", amount: n(slip.advance_deduction) },
  ].filter((d) => d.amount > 0)

  if (stored.length) {
    return [...standard, ...stored]
  }

  const other = n(slip.other_deductions)
  if (other > 0) standard.push({ label: "Other Deductions", amount: other })
  return standard
}

export {
  buildPayslipLoanSummaryRows,
  isLoanInPayPeriod,
  toPayPeriod,
  type PayslipLoanSummaryRow,
} from "@/lib/payroll/loan-summary"
