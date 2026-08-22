/** Build named earnings/deduction lines for payslip UI and PDF. */

export type PayslipMoneyLine = { label: string; amount: number }

type StoredLine = PayslipMoneyLine & { category?: string; code?: string }

function n(v: unknown): number {
  return Number(v || 0)
}

function asLines(raw: unknown): StoredLine[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row) => ({
      label: String(
        (row as any)?.label || (row as any)?.name || (row as any)?.description || "",
      ).trim(),
      amount: n((row as any)?.amount ?? (row as any)?.val),
      category: String((row as any)?.category || "").toLowerCase(),
      code: String((row as any)?.code || "").toUpperCase(),
    }))
    .filter((row) => row.label && row.amount > 0)
}

const LOAN_CODES = new Set(["LOAN", "ADVANCE", "SAL_ADV", "STAFF_LOAN"])

function isBonusLike(row: StoredLine): boolean {
  return (
    row.category === "bonus" ||
    row.category === "backpay" ||
    /bonus|backpay|commission|13th/i.test(row.label)
  )
}

function isPfLike(row: StoredLine): boolean {
  return (
    row.category === "provident_fund" ||
    row.category === "pf" ||
    /^PF(_|$)/i.test(row.code || "") ||
    /^TIER\s*3/i.test(row.code || "") ||
    /\bpf\b|provident|tier\s*3/i.test(row.label)
  )
}

/**
 * Earnings lines: basic + standard master allowances + each assigned
 * allowance/bonus/backpay by name. Never bulk assigned amounts under
 * "Other Allowances" / "Bonus" when named lines are present.
 */
export function buildPayslipEarningsLines(slip: Record<string, any>): PayslipMoneyLine[] {
  const stored = asLines(slip.allowance_lines ?? slip.earnings_lines)
  const namedBonus = stored.filter(isBonusLike)
  const namedAllow = stored.filter((row) => !isBonusLike(row))

  const lines: PayslipMoneyLine[] = [
    { label: "Basic Salary", amount: n(slip.basic_salary) },
    { label: "Transport Allowance", amount: n(slip.transport_allowance) },
    { label: "Housing Allowance", amount: n(slip.housing_allowance) },
    { label: "Medical Allowance", amount: n(slip.medical_allowance) },
    { label: "Meal Allowance", amount: n(slip.meal_allowance) },
    { label: "Communication Allowance", amount: n(slip.communication_allowance) },
    { label: "Uniform Allowance", amount: n(slip.uniform_allowance) },
    { label: "Overtime", amount: n(slip.overtime_pay) },
  ].filter((e) => e.amount > 0)

  // Named assignment lines (each type/name on its own row)
  for (const row of namedAllow) {
    lines.push({ label: row.label, amount: row.amount })
  }
  for (const row of namedBonus) {
    lines.push({ label: row.label, amount: row.amount })
  }

  // Only fall back to bulk fields when those categories were not itemized
  if (!namedAllow.length) {
    const other = n(slip.other_allowances)
    if (other > 0) lines.push({ label: "Other Allowances", amount: other })
  }

  const namedBonusTotal = namedBonus.reduce((sum, row) => sum + row.amount, 0)
  if (!namedBonus.length) {
    if (n(slip.bonus_pay) > 0) lines.push({ label: "Bonus", amount: n(slip.bonus_pay) })
  } else {
    const residualBonus = Math.max(0, n(slip.bonus_pay) - namedBonusTotal)
    if (residualBonus > 0.009) lines.push({ label: "Bonus", amount: residualBonus })
  }

  return lines
}

/**
 * Deduction lines: statutory + loan/advance + each assigned deduction/PF by name.
 * Avoids bulking named deductions under "Other Deductions".
 */
export function buildPayslipDeductionLines(slip: Record<string, any>): PayslipMoneyLine[] {
  const stored = asLines(slip.deduction_lines)
  const namedPf = stored.filter(isPfLike)
  const namedDed = stored.filter(
    (row) => !LOAN_CODES.has(row.code || "") && !isPfLike(row),
  )

  const lines: PayslipMoneyLine[] = [
    { label: "SSNIT (Employee 5.5%)", amount: n(slip.ssnit_employee) },
    { label: "PAYE Tax", amount: n(slip.paye_tax) },
    { label: "Loan Repayment", amount: n(slip.loan_deduction) },
    { label: "Advance Deduction", amount: n(slip.advance_deduction) },
  ].filter((d) => d.amount > 0)

  // Pay components are source of truth for PF — show named lines only (no bulk residual)
  if (namedPf.length) {
    for (const row of namedPf) {
      lines.push({ label: row.label, amount: row.amount })
    }
  } else if (n(slip.tier3_employee) > 0) {
    lines.push({ label: "Tier 3 / Provident Fund", amount: n(slip.tier3_employee) })
  }

  for (const row of namedDed) {
    lines.push({ label: row.label, amount: row.amount })
  }

  // Bulk / residual "Other" — subtract amounts already shown as named deduction lines
  const namedDedTotal = namedDed.reduce((sum, row) => sum + row.amount, 0)
  if (!namedDed.length && !namedPf.length) {
    const other = n(slip.other_deductions)
    if (other > 0) lines.push({ label: "Other Deductions", amount: other })
  } else {
    const residualOther = Math.max(0, n(slip.other_deductions) - namedDedTotal)
    if (residualOther > 0.009) {
      lines.push({ label: "Other Deductions", amount: residualOther })
    }
  }

  return lines
}

export {
  buildPayslipLoanSummaryRows,
  allocateLoanDeduction,
  isLoanInPayPeriod,
  toPayPeriod,
  type PayslipLoanSummaryRow,
} from "@/lib/payroll/loan-summary"
