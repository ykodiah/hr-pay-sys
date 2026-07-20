/**
 * Payroll cash deductions helpers.
 *
 * Tier 2 (Employee 5%) is report-only: it must never be included in
 * total_deductions, net_pay, or payslip deduction totals.
 */

export type PayrollCashComponents = {
  ssnit_employee?: number | null
  tier2_employee?: number | null
  tier3_employee?: number | null
  paye_tax?: number | null
  tax_deduction?: number | null
  loan_deduction?: number | null
  advance_deduction?: number | null
  other_deductions?: number | null
  gross_pay?: number | null
  total_deductions?: number | null
  net_pay?: number | null
  paye_taxable_income?: number | null
  tax_relief_total?: number | null
}

function n(v: unknown) {
  const x = Number(v ?? 0)
  return Number.isFinite(x) ? Math.round((x + Number.EPSILON) * 100) / 100 : 0
}

/** Cash statutory + voluntary deductions (excludes Tier 2). */
export function payrollCashDeductions(row: PayrollCashComponents): number {
  const paye = n(row.paye_tax ?? row.tax_deduction)
  return n(
    n(row.ssnit_employee) +
      n(row.tier3_employee) +
      paye +
      n(row.loan_deduction) +
      n(row.advance_deduction) +
      n(row.other_deductions),
  )
}

/** True when stored total_deductions still appears to include Tier 2. */
export function totalDeductionsIncludesTier2(row: PayrollCashComponents): boolean {
  const tier2 = n(row.tier2_employee)
  if (tier2 <= 0) return false
  const stored = n(row.total_deductions)
  const cash = payrollCashDeductions(row)
  const withTier2 = n(cash + tier2)
  return Math.abs(stored - withTier2) < 0.05 && Math.abs(stored - cash) >= 0.05
}

/**
 * Normalize stored payroll/payslip money fields so Tier 2 is never in cash totals.
 * Also repairs taxable income when it was previously reduced by Tier 2.
 */
export function normalizePayrollCashRow<T extends PayrollCashComponents>(row: T): T {
  const tier2 = n(row.tier2_employee)
  const cashDed = payrollCashDeductions(row)
  const gross = n(row.gross_pay)
  const includesTier2 = totalDeductionsIncludesTier2(row)

  let taxable = n(row.paye_taxable_income)
  if (includesTier2 && tier2 > 0) {
    taxable = n(taxable + tier2)
  }

  return {
    ...row,
    total_deductions: cashDed,
    net_pay: n(gross - cashDed),
    ...(taxable > 0 || includesTier2 ? { paye_taxable_income: taxable } : {}),
  }
}

export function normalizePayrollCashRows<T extends PayrollCashComponents>(rows: T[]): T[] {
  return rows.map((r) => normalizePayrollCashRow(r))
}
