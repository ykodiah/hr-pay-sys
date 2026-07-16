/**
 * Tax Configuration Service
 *
 * Fetches PAYE bands, SSNIT/Tier rates, and tax reliefs from the database
 * for a given company and tax year, then returns a TaxRates object the engine
 * can use.  Falls back to GRA 2025 defaults if no company-specific rows exist.
 */

import { createClient } from "@/lib/supabase/server"
import {
  GRA_MONTHLY_PAYE_BANDS,
  GRA_2025_SSNIT,
  GRA_2025_TIER2,
  GRA_2025_TIER3,
  normalizePayeBands,
  normalizePensionRates,
  type PAYEBand,
  type SSNITRates,
  type Tier2Rates,
  type Tier3Rates,
  type TaxRates,
  type TaxReliefItem,
  type EmployeePayInput,
  type TaxCalculationResult,
  calculateGhanaTax,
} from "./engine"

// ---------------------------------------------------------------------------
// Public types re-exported for consumers
// ---------------------------------------------------------------------------
export type {
  PAYEBand,
  SSNITRates,
  Tier2Rates,
  Tier3Rates,
  TaxRates,
  TaxReliefItem,
  EmployeePayInput,
  TaxCalculationResult,
}

// ---------------------------------------------------------------------------
// Fetching rates from DB
// ---------------------------------------------------------------------------

export async function getTaxRates(
  companyId: string,
  taxYear: number = new Date().getFullYear()
): Promise<TaxRates> {
  const supabase = await createClient()

  // Fetch PAYE bands
  const { data: bandRows, error: bandError } = await supabase
    .from("paye_tax_bands")
    .select("band_order, rate, threshold_amount, is_remaining_amount, description")
    .eq("company_id", companyId)
    .eq("tax_year", taxYear)
    .eq("is_active", true)
    .order("band_order", { ascending: true })

  const rawBands: PAYEBand[] =
    !bandError && bandRows && bandRows.length > 0
      ? bandRows.map((r) => ({
          band_order: r.band_order,
          rate: Number(r.rate),
          threshold_amount: Number(r.threshold_amount),
          is_remaining_amount: r.is_remaining_amount ?? false,
          description: r.description ?? "",
        }))
      : GRA_MONTHLY_PAYE_BANDS

  // Replace obsolete pre-2024 band tables and detect monthly vs annual widths
  const { bands: payeBands, isMonthly } = normalizePayeBands(rawBands)

  // Fetch SSNIT / Tier 2 / Tier 3 rates
  const { data: rateRows, error: rateError } = await supabase
    .from("tax_rates")
    .select("rate_type, employee_rate, employer_rate")
    .eq("company_id", companyId)
    .eq("is_active", true)

  let ssnit: SSNITRates = { ...GRA_2025_SSNIT }
  let tier2: Tier2Rates = { ...GRA_2025_TIER2 }
  let tier3: Tier3Rates = { ...GRA_2025_TIER3 }

  if (!rateError && rateRows) {
    for (const row of rateRows) {
      if (row.rate_type === "ssnit") {
        ssnit = { employee_rate: Number(row.employee_rate), employer_rate: Number(row.employer_rate) }
      } else if (row.rate_type === "tier2") {
        tier2 = { employee_rate: Number(row.employee_rate), employer_rate: Number(row.employer_rate) }
      } else if (row.rate_type === "tier3") {
        tier3 = { employee_rate: Number(row.employee_rate), employer_rate: Number(row.employer_rate) }
      }
    }
  }

  // Collapse legacy double-count configs (5.5% SSNIT + 5% Tier2) to Act 766 split
  const pension = normalizePensionRates(ssnit, tier2)

  return {
    paye_bands: payeBands,
    ssnit: pension.ssnit,
    tier2: pension.tier2,
    tier3,
    paye_bands_are_monthly: isMonthly,
  }
}

// ---------------------------------------------------------------------------
// Fetch employee tax reliefs
// ---------------------------------------------------------------------------

export async function getEmployeeTaxReliefs(
  employeeId: string,
  taxYear: number = new Date().getFullYear()
): Promise<TaxReliefItem[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("employee_tax_reliefs")
    .select(
      `
      override_amount,
      tax_relief:tax_reliefs (
        relief_code,
        relief_name,
        annual_amount
      )
    `
    )
    .eq("employee_id", employeeId)
    .eq("tax_year", taxYear)
    .eq("is_active", true)

  if (error || !data) return []

  return data.map((row: any) => ({
    relief_code: row.tax_relief?.relief_code ?? "",
    relief_name: row.tax_relief?.relief_name ?? "",
    annual_amount: Number(row.override_amount ?? row.tax_relief?.annual_amount ?? 0),
  }))
}

// ---------------------------------------------------------------------------
// High-level: calculate tax for a single employee (DB-connected)
// ---------------------------------------------------------------------------

export async function calculateEmployeeTax(
  input: EmployeePayInput,
  companyId: string,
  employeeId: string,
  taxYear?: number
): Promise<TaxCalculationResult> {
  const year = taxYear ?? new Date().getFullYear()

  const [rates, reliefs] = await Promise.all([
    getTaxRates(companyId, year),
    getEmployeeTaxReliefs(employeeId, year),
  ])

  return calculateGhanaTax(
    { ...input, annual_tax_reliefs: reliefs },
    rates
  )
}

// ---------------------------------------------------------------------------
// Save / update PAYE bands for a company
// ---------------------------------------------------------------------------

export async function upsertPayeBands(
  companyId: string,
  taxYear: number,
  bands: Omit<PAYEBand, "description">[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const rows = bands.map((b, i) => ({
    company_id: companyId,
    band_order: b.band_order ?? i + 1,
    rate: b.rate,
    threshold_amount: b.threshold_amount,
    is_remaining_amount: b.is_remaining_amount ?? false,
    tax_year: taxYear,
    effective_date: `${taxYear}-01-01`,
    currency_code: "GHS",
    is_active: true,
    description: `${b.rate}% band`,
  }))

  const { error } = await supabase
    .from("paye_tax_bands")
    .upsert(rows, { onConflict: "company_id,tax_year,band_order" })

  return error ? { success: false, error: error.message } : { success: true }
}

// ---------------------------------------------------------------------------
// Save / update SSNIT / Tier rates
// ---------------------------------------------------------------------------

export async function upsertTaxRate(
  companyId: string,
  rateType: "ssnit" | "tier2" | "tier3",
  employeeRate: number,
  employerRate: number,
  taxYear: number = new Date().getFullYear()
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase.from("tax_rates").upsert(
    {
      company_id: companyId,
      rate_type: rateType,
      employee_rate: employeeRate,
      employer_rate: employerRate,
      tax_year: taxYear,
      effective_date: `${taxYear}-01-01`,
      is_active: true,
    },
    { onConflict: "company_id,rate_type" }
  )

  return error ? { success: false, error: error.message } : { success: true }
}

// ---------------------------------------------------------------------------
// Get standard tax reliefs for a company / year
// ---------------------------------------------------------------------------

export async function getStandardTaxReliefs(
  companyId: string,
  taxYear: number = new Date().getFullYear()
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tax_reliefs")
    .select("*")
    .eq("company_id", companyId)
    .eq("tax_year", taxYear)
    .eq("is_active", true)
    .order("relief_code", { ascending: true })

  return { data: data ?? [], error }
}
