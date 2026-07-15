/**
 * Ghana PAYE calculation tests (GRA rates effective 1 Jan 2024)
 */

import {
  applyPayeBands,
  calculateGhanaTax,
  calculateMonthlyPaye,
  GRA_2025_PAYE_BANDS,
  GRA_MONTHLY_PAYE_BANDS,
  normalizePayeBands,
  DEFAULT_TAX_RATES,
} from "@/lib/ghana-tax/engine"

describe("GRA PAYE bands (effective Jan 2024)", () => {
  it("applies monthly progressive bands for a mid-income employee", () => {
    // Taxable income 2,884.50 → GRA worked example ≈ 395.54
    const { monthlyTax } = calculateMonthlyPaye(2884.5)
    expect(monthlyTax).toBeCloseTo(395.54, 1)
  })

  it("charges 0% on the first GHS 490", () => {
    expect(calculateMonthlyPaye(490).monthlyTax).toBe(0)
    expect(calculateMonthlyPaye(489).monthlyTax).toBe(0)
  })

  it("applies 5% on income in the second band", () => {
    // 490 @ 0 + 110 @ 5% = 5.50
    expect(calculateMonthlyPaye(600).monthlyTax).toBeCloseTo(5.5, 2)
  })

  it("matches annual bands when annualized for stable monthly pay", () => {
    const monthlyTaxable = 5000
    const monthly = applyPayeBands(monthlyTaxable, GRA_MONTHLY_PAYE_BANDS).totalTax
    const annual = applyPayeBands(monthlyTaxable * 12, GRA_2025_PAYE_BANDS).totalTax
    expect(monthly).toBeCloseTo(annual / 12, 1)
  })

  it("replaces obsolete pre-2024 band tables", () => {
    const obsolete = [
      {
        band_order: 1,
        rate: 0,
        threshold_amount: 4380,
        is_remaining_amount: false,
        description: "old",
      },
    ]
    const { bands, isMonthly } = normalizePayeBands(obsolete)
    expect(isMonthly).toBe(true)
    expect(bands[0].threshold_amount).toBe(490)
  })

  it("does not subtract employer Tier 3 from chargeable income", () => {
    const result = calculateGhanaTax(
      {
        monthly_basic: 4000,
        monthly_allowances: { transport: 200 },
        tier2_applicable: false,
        tier3_applicable: true,
      },
      {
        ...DEFAULT_TAX_RATES,
        tier3: { employee_rate: 5, employer_rate: 5 },
        paye_bands_are_monthly: true,
      },
    )

    // Gross 4200 − SSNIT 5.5% of 4000 (220) − Tier3 employee 200 = 3780
    expect(result.monthly_taxable_income).toBeCloseTo(3780, 2)
    expect(result.monthly_tier3_employer).toBeCloseTo(200, 2)
    expect(result.monthly_taxable_income).toBeGreaterThan(3500)
  })
})
