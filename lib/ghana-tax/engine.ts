/**
 * Ghana Tax Calculation Engine
 *
 * Implements:
 *   - GRA PAYE rates effective 1 January 2024 (monthly progressive bands)
 *   - National Pensions Act 766 employee deductions (applied on basic salary):
 *       Tier 1 (SSNIT)  — employee 5.5%, employer 13%  → deducted on payroll / payslip
 *       Tier 2 (Trustee) — employee 5%,  employer 0%   → computed for compliance REPORTS only
 *         (not deducted on payroll/payslip; not included in total deductions or net pay)
 *   - Voluntary Tier 3 provident fund
 *   - Overtime taxed at marginal PAYE rate (remitted with PAYE)
 *   - Bonus final withholding at 5% (when within GRA bonus rules)
 *   - Non-tax deductions (loans, advances, other) after statutory tax
 *
 * All monetary values are in GHS.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PAYEBand {
  band_order: number
  rate: number
  threshold_amount: number
  is_remaining_amount: boolean
  description: string
}

export interface SSNITRates {
  /** Tier 1 (SSNIT) employee share — Act 766 default: 5.5% of basic */
  employee_rate: number
  /** Tier 1 (SSNIT) employer share — Act 766 default: 13% of basic */
  employer_rate: number
}

export interface Tier2Rates {
  /** Tier 2 (Trustee) employee share — Act 766 default: 5% of basic */
  employee_rate: number
  /** Tier 2 employer share — Act 766 default: 0 */
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
  paye_bands_are_monthly?: boolean
}

export interface TaxReliefItem {
  relief_code: string
  relief_name: string
  annual_amount: number
}

export interface OtherDeductionsInput {
  loan?: number
  advance?: number
  other?: number
}

export interface EmployeePayInput {
  monthly_basic: number
  monthly_allowances: {
    transport?: number
    housing?: number
    medical?: number
    meal?: number
    communication?: number
    uniform?: number
    other?: number
  }
  /** Overtime earnings for the period — taxed at marginal PAYE rate */
  monthly_overtime?: number
  /** Bonus — 5% final WHT when within GRA bonus rules */
  monthly_bonus?: number
  /** Tier 2 is mandatory under Act 766 for most employees (default true) */
  tier2_applicable?: boolean
  tier3_applicable?: boolean
  /** Optional per-employee provident fund / Tier 3 rate override (0–16.5). */
  tier3_employee_rate?: number
  annual_tax_reliefs?: TaxReliefItem[]
  /** Non-tax deductions applied after statutory tax to arrive at net */
  other_deductions?: OtherDeductionsInput
}

export interface PAYEBandBreakdown {
  band_order: number
  description: string
  taxable_in_band: number
  rate: number
  tax_in_band: number
}

export interface TaxCalculationResult {
  monthly_basic: number
  monthly_allowances_total: number
  monthly_gross: number
  annual_gross: number

  monthly_ssnit_employee: number
  monthly_ssnit_employer: number
  annual_ssnit_employee: number
  annual_ssnit_employer: number

  monthly_tier2_employee: number
  monthly_tier2_employer: number

  /** Total employee pension deducted (Tier1 + Tier2) — Act 766: 5.5% of basic */
  monthly_pension_employee: number
  /** Total employer pension cost (Tier1 + Tier2) — Act 766: 13% of basic */
  monthly_pension_employer: number

  monthly_tier3_employee: number
  monthly_tier3_employer: number

  monthly_taxable_income: number
  annual_taxable_income: number
  annual_tax_reliefs: number
  annual_paye_tax: number
  /** Base PAYE on chargeable income (excludes OT/bonus tax) */
  monthly_paye_tax: number
  /**
   * Total income tax to remit as PAYE to GRA:
   * base PAYE + overtime tax (marginal) + bonus WHT
   */
  monthly_total_paye_withheld: number
  effective_tax_rate: number
  paye_band_breakdown: PAYEBandBreakdown[]

  monthly_loan_deduction: number
  monthly_advance_deduction: number
  monthly_other_deduction: number

  monthly_statutory_deductions: number
  monthly_total_employee_deductions: number
  monthly_net_pay: number
  monthly_total_employer_cost: number

  monthly_overtime: number
  monthly_overtime_tax: number

  monthly_bonus: number
  monthly_bonus_tax: number
}

// ---------------------------------------------------------------------------
// GRA PAYE bands effective 1 Jan 2024
// ---------------------------------------------------------------------------

export const GRA_MONTHLY_PAYE_BANDS: PAYEBand[] = [
  { band_order: 1, rate: 0, threshold_amount: 490, is_remaining_amount: false, description: "0% on first GHS 490" },
  { band_order: 2, rate: 5, threshold_amount: 110, is_remaining_amount: false, description: "5% on next GHS 110" },
  { band_order: 3, rate: 10, threshold_amount: 130, is_remaining_amount: false, description: "10% on next GHS 130" },
  { band_order: 4, rate: 17.5, threshold_amount: 3166.67, is_remaining_amount: false, description: "17.5% on next GHS 3,166.67" },
  { band_order: 5, rate: 25, threshold_amount: 16000, is_remaining_amount: false, description: "25% on next GHS 16,000" },
  { band_order: 6, rate: 30, threshold_amount: 30520, is_remaining_amount: false, description: "30% on next GHS 30,520" },
  { band_order: 7, rate: 35, threshold_amount: 0, is_remaining_amount: true, description: "35% on amount exceeding GHS 50,416.67" },
]

export const GRA_2025_PAYE_BANDS: PAYEBand[] = [
  { band_order: 1, rate: 0, threshold_amount: 5880, is_remaining_amount: false, description: "0% on first GHS 5,880" },
  { band_order: 2, rate: 5, threshold_amount: 1320, is_remaining_amount: false, description: "5% on next GHS 1,320" },
  { band_order: 3, rate: 10, threshold_amount: 1560, is_remaining_amount: false, description: "10% on next GHS 1,560" },
  { band_order: 4, rate: 17.5, threshold_amount: 38000, is_remaining_amount: false, description: "17.5% on next GHS 38,000" },
  { band_order: 5, rate: 25, threshold_amount: 192000, is_remaining_amount: false, description: "25% on next GHS 192,000" },
  { band_order: 6, rate: 30, threshold_amount: 366240, is_remaining_amount: false, description: "30% on next GHS 366,240" },
  { band_order: 7, rate: 35, threshold_amount: 0, is_remaining_amount: true, description: "35% on amount exceeding GHS 605,000" },
]

const OBSOLETE_FIRST_BAND_THRESHOLDS = new Set([365, 402, 4380, 4824])

/**
 * GRA Act 766 defaults.
 * Tier 1 (SSNIT): employee 5.5%, employer 13% of basic salary — deducted on payroll.
 * Tier 2 (Trustee): employee 5%, employer 0% of basic salary — reports only (not payroll cash).
 * Voluntary Tier 3 / PF may also be deducted when applicable.
 */
export const GRA_2025_SSNIT: SSNITRates = { employee_rate: 5.5, employer_rate: 13 }
export const GRA_2025_TIER2: Tier2Rates = { employee_rate: 5, employer_rate: 0 }
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

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

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
 * Detect bands stored as cumulative absolute ceilings (from/to UI style)
 * instead of GRA width thresholds. Width format has a smaller second band
 * (e.g. 110 after 490); cumulative has strictly increasing ceilings
 * (490 → 600 → 730 …).
 */
function looksLikeCumulativeAbsoluteCeilings(sorted: PAYEBand[]): boolean {
  const finite = sorted.filter((b) => !b.is_remaining_amount)
  if (finite.length < 2) return false
  for (let i = 1; i < finite.length; i++) {
    if (Number(finite[i].threshold_amount) <= Number(finite[i - 1].threshold_amount)) {
      return false
    }
  }
  // Also treat huge sentinel ceilings from the settings UI as cumulative.
  return (
    Number(finite[1].threshold_amount) > Number(finite[0].threshold_amount) &&
    Number(finite[0].threshold_amount) > 0
  )
}

function convertCumulativeCeilingsToWidths(sorted: PAYEBand[]): PAYEBand[] {
  let previousCeiling = 0
  return sorted.map((band, index) => {
    if (band.is_remaining_amount) {
      return {
        ...band,
        band_order: band.band_order || index + 1,
        threshold_amount: 0,
        is_remaining_amount: true,
      }
    }
    const ceiling = Number(band.threshold_amount || 0)
    // Sentinel "∞" saves from the settings UI
    if (ceiling >= 99999999) {
      return {
        ...band,
        band_order: band.band_order || index + 1,
        threshold_amount: 0,
        is_remaining_amount: true,
      }
    }
    const width = Math.round(Math.max(0, ceiling - previousCeiling) * 100) / 100
    previousCeiling = ceiling
    return {
      ...band,
      band_order: band.band_order || index + 1,
      threshold_amount: width,
      is_remaining_amount: false,
    }
  })
}

export function normalizePayeBands(bands: PAYEBand[] | null | undefined): {
  bands: PAYEBand[]
  isMonthly: boolean
} {
  if (!bands || bands.length === 0) {
    return { bands: GRA_MONTHLY_PAYE_BANDS, isMonthly: true }
  }

  let sorted = [...bands].sort((a, b) => a.band_order - b.band_order)
  const first = sorted.find((b) => !b.is_remaining_amount)

  if (first && OBSOLETE_FIRST_BAND_THRESHOLDS.has(Number(first.threshold_amount))) {
    return { bands: GRA_MONTHLY_PAYE_BANDS, isMonthly: true }
  }

  // Repair cumulative absolute ceilings accidentally saved as threshold_amount.
  if (looksLikeCumulativeAbsoluteCeilings(sorted)) {
    sorted = convertCumulativeCeilingsToWidths(sorted)
  }

  const repairedFirst = sorted.find((b) => !b.is_remaining_amount)
  const isMonthly = repairedFirst != null && Number(repairedFirst.threshold_amount) <= 1000
  return { bands: sorted, isMonthly }
}

/**
 * Validate/normalise pension rates before calculation.
 * Falls back to GRA Act 766 defaults only when values are clearly invalid
 * (zero or missing). User-configured rates from DB are respected as-is.
 */
export function normalizePensionRates(ssnit: SSNITRates, tier2: Tier2Rates): {
  ssnit: SSNITRates
  tier2: Tier2Rates
} {
  const ssnitEmp = Number(ssnit?.employee_rate)
  const ssnitEr  = Number(ssnit?.employer_rate)
  const t2Emp    = Number(tier2?.employee_rate)

  // If rates are missing/NaN/zero, fall back to Act 766 defaults
  if (!isFinite(ssnitEmp) || !isFinite(ssnitEr) || !isFinite(t2Emp)) {
    return { ssnit: { ...GRA_2025_SSNIT }, tier2: { ...GRA_2025_TIER2 } }
  }

  return { ssnit, tier2 }
}

export function calculateMonthlyPaye(
  monthlyTaxableIncome: number,
  bands: PAYEBand[] = GRA_MONTHLY_PAYE_BANDS,
): { monthlyTax: number; breakdown: PAYEBandBreakdown[] } {
  const { totalTax, breakdown } = applyPayeBands(monthlyTaxableIncome, bands)
  return { monthlyTax: totalTax, breakdown }
}

// ---------------------------------------------------------------------------
// Main calculation
// ---------------------------------------------------------------------------

export function calculateGhanaTax(
  input: EmployeePayInput,
  rates: TaxRates,
): TaxCalculationResult {
  const pension = normalizePensionRates(rates.ssnit, rates.tier2)
  const ssnitRates = pension.ssnit
  const tier2Rates = pension.tier2

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

  // Act 766: Tier 1 (SSNIT) on basic — deducted on payroll / payslip
  const monthlySsnitEmployee = round2(input.monthly_basic * (ssnitRates.employee_rate / 100))
  const monthlySsnitEmployer = round2(input.monthly_basic * (ssnitRates.employer_rate / 100))

  // Tier 2 on basic — computed for compliance REPORTS only.
  // It is NOT deducted on payroll / payslip and does NOT reduce chargeable income here.
  const tier2Applicable = input.tier2_applicable !== false
  const monthlyTier2Employee = tier2Applicable
    ? round2(input.monthly_basic * (tier2Rates.employee_rate / 100))
    : 0
  const monthlyTier2Employer = tier2Applicable
    ? round2(input.monthly_basic * (tier2Rates.employer_rate / 100))
    : 0

  // Payroll pension (cash) = SSNIT Tier 1 only
  const monthlyPensionEmployee = monthlySsnitEmployee
  const monthlyPensionEmployer = monthlySsnitEmployer

  // Tier 3 / Provident Fund voluntary — employee rate capped at 16.5%
  const tier3Applicable = input.tier3_applicable === true
  const tier3EmployeeRate = Math.min(
    16.5,
    Math.max(
      0,
      Number(
        input.tier3_employee_rate != null && input.tier3_employee_rate !== undefined
          ? input.tier3_employee_rate
          : rates.tier3.employee_rate,
      ),
    ),
  )
  const monthlyTier3Employee = tier3Applicable
    ? round2(input.monthly_basic * (tier3EmployeeRate / 100))
    : 0
  const monthlyTier3Employer = tier3Applicable
    ? round2(input.monthly_basic * (rates.tier3.employer_rate / 100))
    : 0

  const annualTaxReliefs = round2(
    (input.annual_tax_reliefs ?? []).reduce((sum, r) => sum + (r.annual_amount ?? 0), 0),
  )
  const monthlyTaxReliefs = round2(annualTaxReliefs / 12)

  // Chargeable income: cash emoluments − SSNIT Tier 1 − Tier 3 − reliefs
  // (Tier 2 excluded from payroll chargeable-income path — report-only)
  const monthlyTaxableIncome = round2(
    Math.max(
      0,
      monthlyGross - monthlyPensionEmployee - monthlyTier3Employee - monthlyTaxReliefs,
    ),
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

  // Overtime: taxed at marginal PAYE rate on the additional amount.
  // This IS income tax and is remitted to GRA together with PAYE
  // (shown separately on payslips for transparency).
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

  const monthlyTotalPayeWithheld = round2(monthlyPayeTax + overtimeTax + bonusTax)

  const monthlyLoan = round2(input.other_deductions?.loan ?? 0)
  const monthlyAdvance = round2(input.other_deductions?.advance ?? 0)
  const monthlyOther = round2(input.other_deductions?.other ?? 0)

  const monthlyStatutoryDeductions = round2(
    monthlyPensionEmployee + monthlyTier3Employee + monthlyTotalPayeWithheld,
  )

  const monthlyTotalEmployeeDeductions = round2(
    monthlyStatutoryDeductions + monthlyLoan + monthlyAdvance + monthlyOther,
  )

  const monthlyNetPay = round2(
    monthlyGross + monthlyOvertime + monthlyBonus - monthlyTotalEmployeeDeductions,
  )

  const monthlyTotalEmployerCost = round2(
    monthlyGross + monthlyOvertime + monthlyBonus + monthlyPensionEmployer + monthlyTier3Employer,
  )

  const effectiveTaxRate =
    monthlyGross + monthlyOvertime + monthlyBonus > 0
      ? round2(
          (monthlyTotalPayeWithheld / (monthlyGross + monthlyOvertime + monthlyBonus)) * 100,
        )
      : 0

  return {
    monthly_basic: input.monthly_basic,
    monthly_allowances_total: monthlyAllowancesTotal,
    monthly_gross: monthlyGross,
    annual_gross: annualGross,

    monthly_ssnit_employee: monthlySsnitEmployee,
    monthly_ssnit_employer: monthlySsnitEmployer,
    annual_ssnit_employee: round2(monthlySsnitEmployee * 12),
    annual_ssnit_employer: round2(monthlySsnitEmployer * 12),

    monthly_tier2_employee: monthlyTier2Employee,
    monthly_tier2_employer: monthlyTier2Employer,

    monthly_pension_employee: monthlyPensionEmployee,
    monthly_pension_employer: monthlyPensionEmployer,

    monthly_tier3_employee: monthlyTier3Employee,
    monthly_tier3_employer: monthlyTier3Employer,

    monthly_taxable_income: monthlyTaxableIncome,
    annual_taxable_income: annualTaxableIncome,
    annual_tax_reliefs: annualTaxReliefs,
    annual_paye_tax: annualPayeTax,
    monthly_paye_tax: monthlyPayeTax,
    monthly_total_paye_withheld: monthlyTotalPayeWithheld,
    effective_tax_rate: effectiveTaxRate,
    paye_band_breakdown: payeBandBreakdown,

    monthly_loan_deduction: monthlyLoan,
    monthly_advance_deduction: monthlyAdvance,
    monthly_other_deduction: monthlyOther,

    monthly_statutory_deductions: monthlyStatutoryDeductions,
    monthly_total_employee_deductions: monthlyTotalEmployeeDeductions,
    monthly_net_pay: monthlyNetPay,
    monthly_total_employer_cost: monthlyTotalEmployerCost,

    monthly_overtime: monthlyOvertime,
    monthly_overtime_tax: overtimeTax,
    monthly_bonus: monthlyBonus,
    monthly_bonus_tax: bonusTax,
  }
}
