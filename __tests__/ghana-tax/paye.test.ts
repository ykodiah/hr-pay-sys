/**
 * Ghana PAYE + Act 766 pension tests
 */

import {
  applyPayeBands,
  calculateGhanaTax,
  calculateMonthlyPaye,
  GRA_2025_PAYE_BANDS,
  GRA_MONTHLY_PAYE_BANDS,
  normalizePayeBands,
  normalizePensionRates,
  DEFAULT_TAX_RATES,
  GRA_2025_SSNIT,
  GRA_2025_TIER2,
} from "@/lib/ghana-tax/engine"

describe("GRA PAYE bands (effective Jan 2024)", () => {
  it("applies monthly progressive bands for a mid-income employee", () => {
    const { monthlyTax } = calculateMonthlyPaye(2884.5)
    expect(monthlyTax).toBeCloseTo(395.54, 1)
  })

  it("charges 0% on the first GHS 490", () => {
    expect(calculateMonthlyPaye(490).monthlyTax).toBe(0)
  })

  it("matches annual bands when annualized for stable monthly pay", () => {
    const monthlyTaxable = 5000
    const monthly = applyPayeBands(monthlyTaxable, GRA_MONTHLY_PAYE_BANDS).totalTax
    const annual = applyPayeBands(monthlyTaxable * 12, GRA_2025_PAYE_BANDS).totalTax
    expect(monthly).toBeCloseTo(annual / 12, 1)
  })

  it("replaces obsolete pre-2024 band tables", () => {
    const { bands, isMonthly } = normalizePayeBands([
      {
        band_order: 1,
        rate: 0,
        threshold_amount: 4380,
        is_remaining_amount: false,
        description: "old",
      },
    ])
    expect(isMonthly).toBe(true)
    expect(bands[0].threshold_amount).toBe(490)
  })
})

describe("Act 766 SSNIT / Tier 2", () => {
  it("deducts SSNIT (5.5%) on payroll and keeps Tier 2 (5%) report-only", () => {
    const result = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: {}, tier2_applicable: true },
      DEFAULT_TAX_RATES,
    )
    expect(result.monthly_ssnit_employee).toBeCloseTo(220, 2) // 5.5%
    expect(result.monthly_tier2_employee).toBeCloseTo(200, 2) // 5% (reports only)
    // Payroll pension cash = SSNIT only (Tier 2 excluded from deductions / net)
    expect(result.monthly_pension_employee).toBeCloseTo(220, 2)
    expect(result.monthly_pension_employer).toBeCloseTo(520, 2) // 13%
    expect(result.monthly_total_employee_deductions).toBeCloseTo(
      result.monthly_ssnit_employee + result.monthly_total_paye_withheld,
      2,
    )
    expect(result.monthly_total_employee_deductions).not.toBeCloseTo(
      result.monthly_ssnit_employee + result.monthly_tier2_employee + result.monthly_total_paye_withheld,
      2,
    )
  })

  it("normalizes missing rates to Act 766 defaults", () => {
    const fixed = normalizePensionRates(
      { employee_rate: Number.NaN, employer_rate: 13 },
      { employee_rate: 5, employer_rate: 0 },
    )
    expect(fixed.ssnit).toEqual(GRA_2025_SSNIT)
    expect(fixed.tier2).toEqual(GRA_2025_TIER2)
  })

  it("repairs legacy SSNIT 0.5% and Tier 2 employer 5%", () => {
    const fixed = normalizePensionRates(
      { employee_rate: 0.5, employer_rate: 13 },
      { employee_rate: 5, employer_rate: 5 },
    )
    expect(fixed.ssnit.employee_rate).toBe(5.5)
    expect(fixed.tier2.employer_rate).toBe(0)
  })

  it("excludes Tier 2 from PAYE chargeable income (report-only)", () => {
    const result = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: { transport: 200 }, tier2_applicable: true },
      DEFAULT_TAX_RATES,
    )
    // Gross 4200 − SSNIT 220 (Tier 2 not subtracted) = 3980
    expect(result.monthly_taxable_income).toBeCloseTo(3980, 2)
  })
})

describe("Taxable components and bonus WHT", () => {
  it("includes taxable allowances but excludes non-taxable allowances from PAYE income", () => {
    const result = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: { other: 1000 }, monthly_taxable_allowances: 400 },
      DEFAULT_TAX_RATES,
    )
    expect(result.monthly_gross).toBe(5000)
    expect(result.monthly_taxable_income).toBeCloseTo(4180, 2)
  })

  it("withholds 5% on bonuses and back-pay represented as bonus earnings", () => {
    const result = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: {}, monthly_bonus: 1000 },
      DEFAULT_TAX_RATES,
    )
    expect(result.monthly_bonus_tax).toBe(50)
    expect(result.monthly_total_paye_withheld).toBeCloseTo(result.monthly_paye_tax + 50, 2)
  })
})

describe("Overtime tax and other deductions", () => {
  it("taxes overtime at marginal PAYE and includes it in total PAYE withheld", () => {
    const base = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: { other: 200 } },
      DEFAULT_TAX_RATES,
    )
    const withOt = calculateGhanaTax(
      { monthly_basic: 4000, monthly_allowances: { other: 200 }, monthly_overtime: 500 },
      DEFAULT_TAX_RATES,
    )
    expect(withOt.monthly_overtime_tax).toBeGreaterThan(0)
    expect(withOt.monthly_total_paye_withheld).toBeCloseTo(
      withOt.monthly_paye_tax + withOt.monthly_overtime_tax,
      2,
    )
    expect(withOt.monthly_total_paye_withheld).toBeGreaterThan(base.monthly_total_paye_withheld)
  })

  it("subtracts loans/advances/other from net after statutory tax", () => {
    const result = calculateGhanaTax(
      {
        monthly_basic: 4000,
        monthly_allowances: {},
        other_deductions: { loan: 100, advance: 50, other: 25 },
      },
      DEFAULT_TAX_RATES,
    )
    expect(result.monthly_loan_deduction).toBe(100)
    expect(result.monthly_advance_deduction).toBe(50)
    expect(result.monthly_other_deduction).toBe(25)
    expect(result.monthly_total_employee_deductions).toBeCloseTo(
      result.monthly_statutory_deductions + 175,
      2,
    )
    expect(result.monthly_net_pay).toBeCloseTo(
      result.monthly_gross - result.monthly_total_employee_deductions,
      2,
    )
  })
})
