/**
 * GET  /api/settings/tax  — load SSNIT/Tier rates + PAYE bands for a company
 * POST /api/settings/tax  — save SSNIT/Tier rates + PAYE bands for a company
 *
 * Delegates to the existing tax-config-service helpers which use the
 * tax_rates and paye_tax_bands tables.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { GRA_MONTHLY_PAYE_BANDS, GRA_2025_SSNIT, GRA_2025_TIER2, GRA_2025_TIER3 } from "@/lib/ghana-tax/engine"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("company_id")
    const taxYear = parseInt(searchParams.get("tax_year") ?? String(new Date().getFullYear()), 10)

    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Load SSNIT / Tier rates
    const { data: rateRows, error: rateError } = await supabase
      .from("tax_rates")
      .select("rate_type, employee_rate, employer_rate, tax_year")
      .eq("company_id", companyId)
      .eq("is_active", true)

    // Load PAYE bands
    const { data: bandRows, error: bandError } = await supabase
      .from("paye_tax_bands")
      .select("band_order, rate, threshold_amount, is_remaining_amount, description")
      .eq("company_id", companyId)
      .eq("tax_year", taxYear)
      .eq("is_active", true)
      .order("band_order", { ascending: true })

    let ssnit = { ...GRA_2025_SSNIT }
    let tier2 = { ...GRA_2025_TIER2 }
    let tier3 = { ...GRA_2025_TIER3 }

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

    const payeBands =
      !bandError && bandRows && bandRows.length > 0
        ? bandRows.map((r: any) => ({
            band_order: r.band_order,
            rate: Number(r.rate),
            threshold_amount: Number(r.threshold_amount),
            is_remaining_amount: r.is_remaining_amount ?? false,
            description: r.description ?? "",
          }))
        : GRA_MONTHLY_PAYE_BANDS

    return NextResponse.json({ ssnit, tier2, tier3, paye_bands: payeBands, tax_year: taxYear })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load tax config" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company_id, ssnit, tier2, tier3, paye_bands, tax_year } = body as {
      company_id: string
      ssnit?: { employee: number; employer: number }
      tier2?: { employee: number; employer: number }
      tier3?: { employee: number; employer: number }
      paye_bands?: Array<{
        rate: number
        threshold_amount: number
        is_remaining_amount?: boolean
        description?: string
        band_order?: number
      }>
      tax_year?: number
    }

    if (!company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const year = tax_year ?? new Date().getFullYear()
    const now = new Date().toISOString()
    const errors: string[] = []

    // Save SSNIT / Tier rates using upsert on (company_id, rate_type)
    const ratePayloads: Array<{ company_id: string; rate_type: string; employee_rate: number; employer_rate: number; tax_year: number; effective_date: string; is_active: boolean; updated_at: string }> = []

    if (ssnit) {
      ratePayloads.push({
        company_id,
        rate_type: "ssnit",
        employee_rate: Number(ssnit.employee),
        employer_rate: Number(ssnit.employer),
        tax_year: year,
        effective_date: `${year}-01-01`,
        is_active: true,
        updated_at: now,
      })
    }
    if (tier2) {
      ratePayloads.push({
        company_id,
        rate_type: "tier2",
        employee_rate: Number(tier2.employee),
        employer_rate: Number(tier2.employer),
        tax_year: year,
        effective_date: `${year}-01-01`,
        is_active: true,
        updated_at: now,
      })
    }
    if (tier3) {
      ratePayloads.push({
        company_id,
        rate_type: "tier3",
        employee_rate: Number(tier3.employee),
        employer_rate: Number(tier3.employer),
        tax_year: year,
        effective_date: `${year}-01-01`,
        is_active: true,
        updated_at: now,
      })
    }

    if (ratePayloads.length) {
      const { error } = await supabase
        .from("tax_rates")
        .upsert(ratePayloads, { onConflict: "company_id,rate_type" })
      if (error) errors.push(`Rates: ${error.message}`)
    }

    // Save PAYE bands if provided
    if (paye_bands && paye_bands.length > 0) {
      // Deactivate existing bands for this year first
      await supabase
        .from("paye_tax_bands")
        .update({ is_active: false, updated_at: now })
        .eq("company_id", company_id)
        .eq("tax_year", year)

      const bandRows = paye_bands.map((b, i) => ({
        company_id,
        band_order: b.band_order ?? i + 1,
        rate: b.rate,
        threshold_amount: b.threshold_amount,
        is_remaining_amount: b.is_remaining_amount ?? false,
        tax_year: year,
        effective_date: `${year}-01-01`,
        currency_code: "GHS",
        is_active: true,
        description: b.description ?? `${b.rate}% band`,
        updated_at: now,
      }))

      const { error } = await supabase
        .from("paye_tax_bands")
        .upsert(bandRows, { onConflict: "company_id,tax_year,band_order" })
      if (error) errors.push(`PAYE bands: ${error.message}`)
    }

    if (errors.length) {
      return NextResponse.json({ success: false, errors }, { status: 500 })
    }

    return NextResponse.json({ success: true, saved_rates: ratePayloads.length, saved_bands: paye_bands?.length ?? 0 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save tax config" },
      { status: 500 },
    )
  }
}
