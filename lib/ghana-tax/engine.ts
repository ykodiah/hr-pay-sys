/**
 * Ghana Tax Calculation Engine
 *
 * Implements GRA PAYE rates effective 1 January 2024 (still current for 2025/2026):
 *   - PAYE using progressive bands (monthly computation; annual = monthly × 12)
 *   - SSNIT Tier 1 (5.5% employee / 13% employer of basic)
 *   - Tier 2 / Tier 3 (company-configurable)
 *   - Standard tax reliefs
 *
 * All monetary values are in GHS.
 *
 * Reference: https://gra.gov.gh/domestic-tax/tax-types/paye/
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PAYEBand {
  band_order: number
  rate: number // percentage, e.g. 5 = 5%
  /** Width of this band in GHS (annual or monthly depending on band set). */
  threshold_amount: number
  is_remaining_amount: boolean
  description: string
}

export interface SSNITRates {
  employee_rate: number // e.g. 5.5
  employer_rate: number // e.g. 13
}

export interface Tier2Rates {
  employee_rate: number
  employer_rate: number
}

export interface Tier3Rates {
  employee_rate: number
  employer_rate: number
}

export interface TaxRates {
  paye_bands: PAYEBand[]
  ssnit: SSNITRates
  tier2: Tier2Rates
  tier3: Tier3Rates
  /** When true, paye_bands are monthly widths; otherwise annual. */
  paye_bands_are_monthly?: boolean
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
  monthly_taxable_income: number
  annual_taxable_income: number
  annual_tax_reliefs: number
  annual_paye_tax: number
  monthly_paye_tax: number
  effective_tax_rate: number
  paye_band_breakdown: PAYEBandBreakdown[]

  // --- Totals ---
  monthly_total_employee_deductions: number
  monthly_net_pay: number
  monthly_total_employer_cost: number

  // --- Overtime ---
  monthly_overtime: number
  monthly_overtime_tax: number

  // --- Bonus ---
  monthly_bonus: number
  monthly_bonus_tax: number
}

// ---------------------------------------------------------------------------
// GRA PAYE bands effective 1 Jan 2024 (current for 2025/2026)
// ---------------------------------------------------------------------------

/** Monthly band widths published by GRA for employer withholding. */
export const GRA_MONTHLY_PAYE_BANDS: PAYEBand[] = [
  { band_order: 1, rate: 0, threshold_amount: 490, is_remaining_amount: false, description: "0% on first GHS 490" },
  { band_order: 2, rate: 5, threshold_amount: 110, is_remaining_amount: false, description: "5% on next GHS 110" },
  { band_order: 3, rate: 10, threshold_amount: 130, is_remaining_amount: false, description: "10% on next GHS 130" },
  { band_order: 4, rate: 17.5, threshold_amount: 3166.67, is_remaining_amount: false, description: "17.5% on next GHS 3,166.67" },
  { band_order: 5, rate: 25, threshold_amount: 16000, is_remaining_amount: false, description: "25% on next GHS 16,000" },
  { band_order: 6, rate: 30, threshold_amount: 30520, is_remaining_amount: false, description: "30% on next GHS 30,520" },
  { band_order: 7, rate: 35, threshold_amount: 0, is_remaining_amount: true, description: "35% on amount exceeding GHS 50,416.67" },
]

/** Annual equivalents (monthly × 12). Used when DB stores annual thresholds. */
export const GRA_2025_PAYE_BANDS: PAYEBand[] = [
  { band_order: 1, rate: 0, threshold_amount: 5880, is_remaining_amount: false, description: "0% on first GHS 5,880" },
  { band_order: 2, rate: 5, threshold_amount: 1320, is_remaining_amount: false, description: "5% on next GHS 1,320" },
  { band_order: 3, rate: 10, threshold_amount: 1560, is_remaining_amount: false, description: "10% on next GHS 1,560" },
  { band_order: 4, rate: 17.5, threshold_amount: 38000, is_remaining_amount: false, description: "17.5% on next GHS 38,000" },
  { band_order: 5, rate: 25, threshold_amount: 192000, is_remaining_amount: false, description: "25% on next GHS 192,000" },
  { band_order: 6, rate: 30, threshold_amount: 366240, is_remaining_amount: false, description: "30% on next GHS 366,240" },
  { band_order: 7, rate: 35, threshold_amount: 0, is_remaining_amount: true, description: "35% on amount exceeding GHS 605,000" },
]

/** Known obsolete first-band widths (pre-2024) that must be replaced. */
const OBSOLETE_FIRST_BAND_THRESHOLDS = new Set([365, 402, 4380, 4824])

export const GRA_2025_SSNIT: SSNITRates = { employee_rate: 5.5, employer_rate: 13 }
export const GRA_2025_TIER2: Tier2Rates = { employee_rate: 5, employer_rate: 5 }
export const GRA_2025_TIER3: Tier3Rates = { employee_rate: 0, employer_rate: 0 }

export const DEFAULT_TAX_RATES: TaxRates = {
  paye_bands: GRA_MONTHLY_PAYE_BANDS,
  ssnit: GRA_2025_SSNIT,
  tier2: GRA_2025_TIER2,
  tier3: GRA_2025_TIER3,
  paye_bands_are_monthly: true,
}

// ---------------------------------------------------------------------------
// Core helpers
// ---------------------------------------------------------------------------

/** Round to 2 decimal places */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/** Apply progressive PAYE bands to a taxable amount (monthly or annual). */
export function applyPayeBands(
  taxableIncome: number,
  bands: PAYEBand[],
): { totalTax: number; breakdown: PAYEBandBreakdown[] } {
  const sortedBands = [...bands].sort((a, b) => a.band_order - b.band_order)
  let remaining = Math.max(0, taxableIncome)
  let totalTax = 0
  const breakdown: PAYEBandBreakdown[] = []

  for (const band of sortedBands) {
    if (remaining <= 0) break

    const taxableInBand = band.is_remaining_amount
      ? remaining
      : Math.min(remaining, band.threshold_amount)

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

/**
 * Normalize company/DB bands: replace obsolete pre-2024 tables and detect
 * whether thresholds are monthly or annual.
 */
export function normalizePayeBands(bands: PAYEBand[] | null | undefined): {
  bands: PAYEBand[]
  isMonthly: boolean
} {
  if (!bands || bands.length === 0) {
    return { bands: GRA_MONTHLY_PAYE_BANDS, isMonthly: true }
  }

  const sorted = [...bands].sort((a, b) => a.band_order - b.band_order)
  const first = sorted.find((b) => !b.is_remaining_amount)

  if (first && OBSOLETE_FIRST_BAND_THRESHOLDS.has(Number(first.threshold_amount))) {
    return { bands: GRA_MONTHLY_PAYE_BANDS, isMonthly: true }
  }

  // Monthly first band is 490; annual first band is 5,880
  const isMonthly = first != null && Number(first.threshold_amount) <= 1000
  return { bands: sorted, isMonthly }
}

/** Compute monthly PAYE from monthly chargeable income using GRA monthly bands. */
export function calculateMonthlyPaye(
  monthlyTaxableIncome: number,
  bands: PAYEBand[] = GRA_MONTHLY_PAYE_BANDS,
): { monthlyTax: number; breakdown: PAYEBandBreakdown[] } {
  const { totalTax, breakdown } = applyPayeBands(monthlyTaxableIncome, bands)
  return { monthlyTax: totalTax, breakdown }
}

// ---------------------------------------------------------------------------
// Main calculation function
// ---------------------------------------------------------------------------

export function calculateGhanaTax(
  input: EmployeePayInput,
  rates: TaxRates,
): TaxCalculationResult {
  const monthlyAllowancesBreakdown = input.monthly_allowances ?? {}
  const monthlyAllowancesTotal = round2(
    (monthlyAllowancesBreakdown.transport ?? 0) +
      (monthlyAllowancesBreakdown.housing ?? 0) +
      (monthlyAllowancesBreakdown.medical ?? 0) +
      (monthlyAllowancesBreakdown.meal ?? 0) +
      (monthlyAllowancesBreakdown.communication ?? 0) +
      (monthlyAllowancesBreakdown.uniform ?? 0) +
      (monthlyAllowancesBreakdown.other ?? 0),
  )
  const monthlyGross = round2(input.monthly_basic + monthlyAllowancesTotal)
  const annualGross = round2(monthlyGross * 12)
  const monthlyOvertime = round2(input.monthly_overtime ?? 0)
  const monthlyBonus = round2(input.monthly_bonus ?? 0)

  // SSNIT Tier 1 — on basic salary
  const monthlySsnitEmployee = round2(input.monthly_basic * (rates.ssnit.employee_rate / 100))
  const monthlySsnitEmployer = round2(input.monthly_basic * (rates.ssnit.employer_rate / 100))
  const annualSsnitEmployee = round2(monthlySsnitEmployee * 12)
  const annualSsnitEmployer = round2(monthlySsnitEmployer * 12)

  // Tier 2
  const tier2Applicable = input.tier2_applicable !== false
  const monthlyTier2Employee = tier2Applicable
    ? round2(input.monthly_basic * (rates.tier2.employee_rate / 100))
    : 0
  const monthlyTier2Employer = tier2Applicable
    ? round2(input.monthly_basic * (rates.tier2.employer_rate / 100))
    : 0

  // Tier 3 (voluntary) — employee portion is deductible from chargeable income
  const tier3Applicable = input.tier3_applicable === true
  const monthlyTier3Employee = tier3Applicable
    ? round2(input.monthly_basic * (rates.tier3.employee_rate / 100))
    : 0
  const monthlyTier3Employer = tier3Applicable
    ? round2(input.monthly_basic * (rates.tier3.employer_rate / 100))
    : 0

  const annualTaxReliefs = round2(
    (input.annual_tax_reliefs ?? []).reduce((sum, r) => sum + (r.annual_amount ?? 0), 0),
  )
  const monthlyTaxReliefs = round2(annualTaxReliefs / 12)

  // Chargeable income: gross − employee SSNIT − employee Tier 3 − reliefs
  // (Employer contributions are never deducted from the employee's chargeable income.)
  const monthlyTaxableIncome = round2(
    Math.max(0, monthlyGross - monthlySsnitEmployee - monthlyTier3Employee - monthlyTaxReliefs),
  )
  const annualTaxableIncome = round2(monthlyTaxableIncome * 12)

  const { bands: payeBands, isMonthly } = normalizePayeBands(rates.paye_bands)
  const useMonthly = rates.paye_bands_are_monthly ?? isMonthly

  let monthlyPayeTax: number
  let annualPayeTax: number
  let payeBandBreakdown: PAYEBandBreakdown[]

  if (useMonthly) {
    const result = applyPayeBands(monthlyTaxableIncome, payeBands)
    monthlyPayeTax = result.totalTax
    annualPayeTax = round2(monthlyPayeTax * 12)
    payeBandBreakdown = result.breakdown
  } else {
    const result = applyPayeBands(annualTaxableIncome, payeBands)
    annualPayeTax = result.totalTax
    monthlyPayeTax = round2(annualPayeTax / 12)
    payeBandBreakdown = result.breakdown
  }

  const effectiveTaxRate = annualGross > 0 ? round2((annualPayeTax / annualGross) * 100) : 0

  // Overtime: marginal tax on the additional amount
  let overtimeTax = 0
  if (monthlyOvertime > 0) {
    if (useMonthly) {
      const withOt = applyPayeBands(monthlyTaxableIncome + monthlyOvertime, payeBands)
      overtimeTax = round2(withOt.totalTax - monthlyPayeTax)
    } else {
      const withOt = applyPayeBands(annualTaxableIncome + monthlyOvertime * 12, payeBands)
      overtimeTax = round2((withOt.totalTax - annualPayeTax) / 12)
    }
  }

  // Bonus: 5% final withholding when within GRA bonus rules
  const bonusTax = round2(monthlyBonus * 0.05)

  const monthlyTotalEmployeeDeductions = round2(
    monthlySsnitEmployee +
      monthlyTier2Employee +
      monthlyTier3Employee +
      monthlyPayeTax +
      overtimeTax +
      bonusTax,
  )

  const monthlyNetPay = round2(
    monthlyGross + monthlyOvertime + monthlyBonus - monthlyTotalEmployeeDeductions,
  )

  const monthlyTotalEmployerCost = round2(
    monthlyGross + monthlySsnitEmployer + monthlyTier2Employer + monthlyTier3Employer,
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

    monthly_taxable_income: monthlyTaxableIncome,
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
