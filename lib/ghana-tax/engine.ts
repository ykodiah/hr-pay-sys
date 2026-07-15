/**
 * Ghana Tax Calculation Engine
 *
 * Implements GRA Income Tax (Amendment) Act, 2023 (Act 1094) rules for:
 *   - PAYE (Pay As You Earn) using progressive annual bands
 *   - SSNIT Tier 1 (5.5% employee / 13% employer)
 *   - SSNIT Tier 2 / NHIA (5% employee / 5% employer)
 *   - Voluntary Tier 3 provident fund
 *   - Standard tax reliefs (CRA, marriage, old-age, disability, education)
 *
 * All monetary values are in GHS.
 * All calculations are annual; monthly values are divided by 12.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PAYEBand {
  band_order: number
  rate: number          // percentage, e.g. 5 = 5%
  threshold_amount: number  // annual GHS amount this band covers
  is_remaining_amount: boolean
  description: string
}

export interface SSNITRates {
  employee_rate: number   // e.g. 5.5
  employer_rate: number   // e.g. 13
}

export interface Tier2Rates {
  employee_rate: number   // e.g. 5
  employer_rate: number   // e.g. 5
}

export interface Tier3Rates {
  employee_rate: number   // e.g. 0 (voluntary, company configures)
  employer_rate: number
}

export interface TaxRates {
  paye_bands: PAYEBand[]
  ssnit: SSNITRates
  tier2: Tier2Rates
  tier3: Tier3Rates
}

export interface TaxReliefItem {
  relief_code: string
  relief_name: string
  annual_amount: number
}

export interface EmployeePayInput {
  /** Monthly basic salary */
  monthly_basic: number
  /** Monthly allowances (transport, housing, medical, etc.) */
  monthly_allowances: {
    transport?: number
    housing?: number
    medical?: number
    meal?: number
    communication?: number
    uniform?: number
    other?: number
  }
  /** Monthly overtime earnings (taxed separately in Ghana) */
  monthly_overtime?: number
  /** Monthly bonus (taxed separately) */
  monthly_bonus?: number
  /** Whether Tier 2 is applicable for this employee */
  tier2_applicable?: boolean
  /** Whether Tier 3 is applicable / opted-in */
  tier3_applicable?: boolean
  /** Tax reliefs the employee is entitled to (annual totals) */
  annual_tax_reliefs?: TaxReliefItem[]
}

export interface PAYEBandBreakdown {
  band_order: number
  description: string
  taxable_in_band: number
  rate: number
  tax_in_band: number
}

export interface TaxCalculationResult {
  // --- Earnings ---
  monthly_basic: number
  monthly_allowances_total: number
  monthly_gross: number
  annual_gross: number

  // --- SSNIT ---
  monthly_ssnit_employee: number
  monthly_ssnit_employer: number
  annual_ssnit_employee: number
  annual_ssnit_employer: number

  // --- Tier 2 ---
  monthly_tier2_employee: number
  monthly_tier2_employer: number

  // --- Tier 3 ---
  monthly_tier3_employee: number
  monthly_tier3_employer: number

  // --- PAYE ---
  annual_taxable_income: number    // gross - SSNIT employee - reliefs
  annual_tax_reliefs: number
  annual_paye_tax: number
  monthly_paye_tax: number
  effective_tax_rate: number       // % of gross
  paye_band_breakdown: PAYEBandBreakdown[]

  // --- Totals ---
  monthly_total_employee_deductions: number
  monthly_net_pay: number
  monthly_total_employer_cost: number

  // --- Overtime (taxed at marginal rate) ---
  monthly_overtime: number
  monthly_overtime_tax: number

  // --- Bonus ---
  monthly_bonus: number
  monthly_bonus_tax: number
}

// ---------------------------------------------------------------------------
// GRA 2025 default bands (fallback when DB is unavailable)
// ---------------------------------------------------------------------------

export const GRA_2025_PAYE_BANDS: PAYEBand[] = [
  { band_order: 1, rate: 0,    threshold_amount:   4380,   is_remaining_amount: false, description: "0% on first GHS 4,380" },
  { band_order: 2, rate: 5,    threshold_amount:   1200,   is_remaining_amount: false, description: "5% on next GHS 1,200" },
  { band_order: 3, rate: 10,   threshold_amount:   1880,   is_remaining_amount: false, description: "10% on next GHS 1,880" },
  { band_order: 4, rate: 17.5, threshold_amount:  36720,   is_remaining_amount: false, description: "17.5% on next GHS 36,720" },
  { band_order: 5, rate: 25,   threshold_amount:  49120,   is_remaining_amount: false, description: "25% on next GHS 49,120" },
  { band_order: 6, rate: 30,   threshold_amount: 199240,   is_remaining_amount: false, description: "30% on next GHS 199,240" },
  { band_order: 7, rate: 35,   threshold_amount:      0,   is_remaining_amount: true,  description: "35% on remaining amount" },
]

export const GRA_2025_SSNIT: SSNITRates    = { employee_rate: 5.5,  employer_rate: 13 }
export const GRA_2025_TIER2: Tier2Rates    = { employee_rate: 5,    employer_rate: 5  }
export const GRA_2025_TIER3: Tier3Rates    = { employee_rate: 0,    employer_rate: 0  }

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places (banker-safe) */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Apply progressive PAYE bands to an annual taxable income. Returns total tax + breakdown. */
export function applyPayeBands(
  annualTaxableIncome: number,
  bands: PAYEBand[]
): { totalTax: number; breakdown: PAYEBandBreakdown[] } {
  const sortedBands = [...bands].sort((a, b) => a.band_order - b.band_order)
  let remaining = Math.max(0, annualTaxableIncome)
  let totalTax = 0
  const breakdown: PAYEBandBreakdown[] = []

  for (const band of sortedBands) {
    if (remaining <= 0) break

    let taxableInBand: number

    if (band.is_remaining_amount) {
      taxableInBand = remaining
    } else {
      taxableInBand = Math.min(remaining, band.threshold_amount)
    }

    const taxInBand = round2(taxableInBand * (band.rate / 100))
    totalTax += taxInBand
    remaining -= taxableInBand

    breakdown.push({
      band_order: band.band_order,
      description: band.description,
      taxable_in_band: round2(taxableInBand),
      rate: band.rate,
      tax_in_band: taxInBand,
    })
  }

  return { totalTax: round2(totalTax), breakdown }
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------

export function calculateGhanaTax(
  input: EmployeePayInput,
  rates: TaxRates
): TaxCalculationResult {
  // --- 1. Monthly earnings ---
  const monthlyAllowancesBreakdown = input.monthly_allowances ?? {}
  const monthlyAllowancesTotal = round2(
    (monthlyAllowancesBreakdown.transport     ?? 0) +
    (monthlyAllowancesBreakdown.housing       ?? 0) +
    (monthlyAllowancesBreakdown.medical       ?? 0) +
    (monthlyAllowancesBreakdown.meal          ?? 0) +
    (monthlyAllowancesBreakdown.communication ?? 0) +
    (monthlyAllowancesBreakdown.uniform       ?? 0) +
    (monthlyAllowancesBreakdown.other         ?? 0)
  )
  const monthlyGross   = round2(input.monthly_basic + monthlyAllowancesTotal)
  const annualGross    = round2(monthlyGross * 12)
  const monthlyOvertime = round2(input.monthly_overtime ?? 0)
  const monthlyBonus    = round2(input.monthly_bonus ?? 0)

  // --- 2. SSNIT (Tier 1) ---
  // Applied on basic salary only (GRA guidance: contributions based on basic)
  const monthlySsnitEmployee = round2(input.monthly_basic * (rates.ssnit.employee_rate / 100))
  const monthlySsnitEmployer = round2(input.monthly_basic * (rates.ssnit.employer_rate / 100))
  const annualSsnitEmployee  = round2(monthlySsnitEmployee * 12)
  const annualSsnitEmployer  = round2(monthlySsnitEmployer * 12)

  // --- 3. Tier 2 ---
  const tier2Applicable = input.tier2_applicable !== false  // default true
  const monthlyTier2Employee = tier2Applicable
    ? round2(input.monthly_basic * (rates.tier2.employee_rate / 100))
    : 0
  const monthlyTier2Employer = tier2Applicable
    ? round2(input.monthly_basic * (rates.tier2.employer_rate / 100))
    : 0

  // --- 4. Tier 3 ---
  const tier3Applicable = input.tier3_applicable === true
  const monthlyTier3Employee = tier3Applicable
    ? round2(input.monthly_basic * (rates.tier3.employee_rate / 100))
    : 0
  const monthlyTier3Employer = tier3Applicable
    ? round2(input.monthly_basic * (rates.tier3.employer_rate / 100))
    : 0

  // --- 5. PAYE taxable income ---
  // Annual gross - annual SSNIT employee contribution - annual Tier 3 employee (if applicable) - reliefs
  const annualTaxReliefs = round2(
    (input.annual_tax_reliefs ?? []).reduce((sum, r) => sum + (r.annual_amount ?? 0), 0)
  )
  const annualTaxableIncome = round2(
    Math.max(0, annualGross - annualSsnitEmployee - annualTaxReliefs)
  )

  // --- 6. Apply PAYE bands ---
  const { totalTax: annualPayeTax, breakdown: payeBandBreakdown } = applyPayeBands(
    annualTaxableIncome,
    rates.paye_bands
  )
  const monthlyPayeTax = round2(annualPayeTax / 12)

  // --- 7. Effective tax rate ---
  const effectiveTaxRate = annualGross > 0
    ? round2((annualPayeTax / annualGross) * 100)
    : 0

  // --- 8. Overtime tax (taxed at marginal rate — rate of the highest band reached) ---
  let overtimeTax = 0
  if (monthlyOvertime > 0) {
    const annualWithOvertime = annualTaxableIncome + (monthlyOvertime * 12)
    const { totalTax: taxWithOvertime } = applyPayeBands(annualWithOvertime, rates.paye_bands)
    overtimeTax = round2((taxWithOvertime - annualPayeTax) / 12)
  }

  // --- 9. Bonus tax (taxed at 5% flat rate per GRA directive for performance bonuses) ---
  const bonusTax = round2(monthlyBonus * 0.05)

  // --- 10. Total employee deductions ---
  const monthlyTotalEmployeeDeductions = round2(
    monthlySsnitEmployee +
    monthlyTier2Employee +
    monthlyTier3Employee +
    monthlyPayeTax +
    overtimeTax +
    bonusTax
  )

  // --- 11. Net pay ---
  const monthlyNetPay = round2(
    monthlyGross + monthlyOvertime + monthlyBonus - monthlyTotalEmployeeDeductions
  )

  // --- 12. Total employer cost ---
  const monthlyTotalEmployerCost = round2(
    monthlyGross +
    monthlySsnitEmployer +
    monthlyTier2Employer +
    monthlyTier3Employer
  )

  return {
    monthly_basic: input.monthly_basic,
    monthly_allowances_total: monthlyAllowancesTotal,
    monthly_gross: monthlyGross,
    annual_gross: annualGross,

    monthly_ssnit_employee: monthlySsnitEmployee,
    monthly_ssnit_employer: monthlySsnitEmployer,
    annual_ssnit_employee: annualSsnitEmployee,
    annual_ssnit_employer: annualSsnitEmployer,

    monthly_tier2_employee: monthlyTier2Employee,
    monthly_tier2_employer: monthlyTier2Employer,

    monthly_tier3_employee: monthlyTier3Employee,
    monthly_tier3_employer: monthlyTier3Employer,

    annual_taxable_income: annualTaxableIncome,
    annual_tax_reliefs: annualTaxReliefs,
    annual_paye_tax: annualPayeTax,
    monthly_paye_tax: monthlyPayeTax,
    effective_tax_rate: effectiveTaxRate,
    paye_band_breakdown: payeBandBreakdown,

    monthly_total_employee_deductions: monthlyTotalEmployeeDeductions,
    monthly_net_pay: monthlyNetPay,
    monthly_total_employer_cost: monthlyTotalEmployerCost,

    monthly_overtime: monthlyOvertime,
    monthly_overtime_tax: overtimeTax,
    monthly_bonus: monthlyBonus,
    monthly_bonus_tax: bonusTax,
  }
}
