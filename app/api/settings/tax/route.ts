/**
 * GET  /api/settings/tax  — load SSNIT/Tier rates + PAYE bands for a company
 * POST /api/settings/tax  — save SSNIT/Tier rates + PAYE bands for a company
 *
 * Uses resolveTenantContext so company_id cannot be spoofed across tenants.
 */

import { NextRequest, NextResponse } from "next/server"
import { GRA_MONTHLY_PAYE_BANDS, GRA_2025_SSNIT, GRA_2025_TIER2, GRA_2025_TIER3 } from "@/lib/ghana-tax/engine"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const { searchParams } = new URL(req.url)
    const taxYear = parseInt(searchParams.get("tax_year") ?? String(new Date().getFullYear()), 10)

    // Load SSNIT / Tier rates
    const { data: rateRows, error: rateError } = await service
      .from("tax_rates")
      .select("rate_type, employee_rate, employer_rate, tax_year")
      .eq("company_id", companyId)
      .eq("is_active", true)

    // Load PAYE bands
    const { data: bandRows, error: bandError } = await service
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

    return NextResponse.json({
      ssnit,
      tier2,
      tier3,
      paye_bands: payeBands,
      tax_year: taxYear,
      company_id: companyId,
    })
  } catch (err) {
    return jsonError(err, "Failed to load tax config")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ssnit, tier2, tier3, paye_bands, tax_year } = body as {
      company_id?: string
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

    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const year = tax_year ?? new Date().getFullYear()
    const now = new Date().toISOString()
    const errors: string[] = []

    // Save SSNIT / Tier rates using upsert on (company_id, rate_type)
    const ratePayloads: Array<{
      company_id: string
      rate_type: string
      employee_rate: number
      employer_rate: number
      tax_year: number
      effective_date: string
      is_active: boolean
      updated_at: string
    }> = []

    if (ssnit) {
      ratePayloads.push({
        company_id: companyId,
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
        company_id: companyId,
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
        company_id: companyId,
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
      const { error } = await service
        .from("tax_rates")
        .upsert(ratePayloads, { onConflict: "company_id,rate_type" })
      if (error) errors.push(`Rates: ${error.message}`)
    }

    // Save PAYE bands if provided
    if (paye_bands && paye_bands.length > 0) {
      await service
        .from("paye_tax_bands")
        .update({ is_active: false, updated_at: now })
        .eq("company_id", companyId)
        .eq("tax_year", year)

      const bandRows = paye_bands.map((b, i) => ({
        company_id: companyId,
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

      const { error } = await service
        .from("paye_tax_bands")
        .upsert(bandRows, { onConflict: "company_id,tax_year,band_order" })
      if (error) errors.push(`PAYE bands: ${error.message}`)
    }

    if (errors.length) {
      return NextResponse.json({ success: false, errors }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      company_id: companyId,
      saved_rates: ratePayloads.length,
      saved_bands: paye_bands?.length ?? 0,
    })
  } catch (err) {
    return jsonError(err, "Failed to save tax config")
  }
}
