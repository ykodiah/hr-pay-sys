/**
 * GRA / Ghana labour rates catalog (National Daily Minimum Wage + OT multipliers).
 * Source of truth for yearly updates when the government/GRA revises rates.
 * Official announcements: Ministry of Employment / National Tripartite Committee;
 * payroll floors also align with GRA PAYE practice.
 */

export type GraLabourRate = {
  year: number
  daily_minimum_wage: number
  hours_per_day: number
  working_days_per_month: number
  standard_monthly_hours: number
  overtime_weekday_multiplier: number
  overtime_weekend_multiplier: number
  overtime_holiday_multiplier: number
  currency: string
  effective_from: string
  effective_to: string | null
  source: string
  notes?: string
}

/** Curated yearly rates — extend when GRA / NTC announces a new year. */
export const GRA_LABOUR_RATES_CATALOG: GraLabourRate[] = [
  {
    year: 2024,
    daily_minimum_wage: 18.15,
    hours_per_day: 8,
    working_days_per_month: 27,
    standard_monthly_hours: 173.33,
    overtime_weekday_multiplier: 1.5,
    overtime_weekend_multiplier: 2.0,
    overtime_holiday_multiplier: 2.0,
    currency: "GHS",
    effective_from: "2024-01-01",
    effective_to: "2024-12-31",
    source: "https://gra.gov.gh / National Tripartite Committee 2024",
    notes: "National Daily Minimum Wage GH¢18.15",
  },
  {
    year: 2025,
    daily_minimum_wage: 19.97,
    hours_per_day: 8,
    working_days_per_month: 27,
    standard_monthly_hours: 173.33,
    overtime_weekday_multiplier: 1.5,
    overtime_weekend_multiplier: 2.0,
    overtime_holiday_multiplier: 2.0,
    currency: "GHS",
    effective_from: "2025-01-01",
    effective_to: "2025-12-31",
    source: "https://gra.gov.gh / National Tripartite Committee 2025",
    notes: "National Daily Minimum Wage GH¢19.97",
  },
  {
    year: 2026,
    daily_minimum_wage: 19.97,
    hours_per_day: 8,
    working_days_per_month: 27,
    standard_monthly_hours: 173.33,
    overtime_weekday_multiplier: 1.5,
    overtime_weekend_multiplier: 2.0,
    overtime_holiday_multiplier: 2.0,
    currency: "GHS",
    effective_from: "2026-01-01",
    effective_to: null,
    source: "https://gra.gov.gh / carried forward pending 2026 NTC announcement",
    notes: "Uses 2025 NDMW until the 2026 rate is announced — re-sync to update.",
  },
]

export function getGraLabourRateForYear(year = new Date().getFullYear()): GraLabourRate {
  const exact = GRA_LABOUR_RATES_CATALOG.find((r) => r.year === year)
  if (exact) return exact
  // Fall back to latest catalog entry
  return GRA_LABOUR_RATES_CATALOG[GRA_LABOUR_RATES_CATALOG.length - 1]
}

export function graHourlyMinimum(rate: GraLabourRate = getGraLabourRateForYear()): number {
  const hours = rate.hours_per_day || 8
  return Math.round((rate.daily_minimum_wage / hours) * 10000) / 10000
}

export function graMonthlyMinimum(rate: GraLabourRate = getGraLabourRateForYear()): number {
  return Math.round(rate.daily_minimum_wage * rate.working_days_per_month * 100) / 100
}
