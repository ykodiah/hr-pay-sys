import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  GRA_LABOUR_RATES_CATALOG,
  getGraLabourRateForYear,
  graHourlyMinimum,
  graMonthlyMinimum,
} from "@/lib/gra-labour-rates"

/**
 * GET  /api/gra/labour-rates?year=2026
 * POST /api/gra/labour-rates  { action: "sync", year? }
 *
 * Syncs GRA National Daily Minimum Wage + OT multipliers into:
 * - gra_labour_rates (yearly history)
 * - payroll_configuration.minimum_wage / OT multipliers (company)
 * - overtime_rates weekday/weekend multipliers (company)
 */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const year = Number(request.nextUrl.searchParams.get("year") || new Date().getFullYear())
    const catalog = getGraLabourRateForYear(year)

    const { data: stored } = await ctx.service
      .from("gra_labour_rates")
      .select("*")
      .eq("year", year)
      .maybeSingle()

    const { data: history } = await ctx.service
      .from("gra_labour_rates")
      .select("*")
      .order("year", { ascending: false })

    return NextResponse.json({
      success: true,
      year,
      catalog,
      stored: stored || null,
      history: history || [],
      derived: {
        hourly_minimum: graHourlyMinimum(catalog),
        monthly_minimum: graMonthlyMinimum(catalog),
      },
      company_id: ctx.companyId,
      catalog_all: GRA_LABOUR_RATES_CATALOG,
    })
  } catch (err) {
    return jsonError(err, "Failed to load GRA labour rates")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const action = String(body.action || "sync").toLowerCase()
    const year = Number(body.year || new Date().getFullYear())
    // Allow override when GRA announces mid-year
    const catalog = {
      ...getGraLabourRateForYear(year),
      ...(body.daily_minimum_wage != null ? { daily_minimum_wage: Number(body.daily_minimum_wage) } : {}),
      ...(body.overtime_weekday_multiplier != null
        ? { overtime_weekday_multiplier: Number(body.overtime_weekday_multiplier) }
        : {}),
      ...(body.overtime_weekend_multiplier != null
        ? { overtime_weekend_multiplier: Number(body.overtime_weekend_multiplier) }
        : {}),
    }

    if (action !== "sync") {
      return NextResponse.json({ error: "Invalid action. Use sync" }, { status: 400 })
    }

    const row = {
      year: catalog.year,
      daily_minimum_wage: catalog.daily_minimum_wage,
      hours_per_day: catalog.hours_per_day,
      working_days_per_month: catalog.working_days_per_month,
      standard_monthly_hours: catalog.standard_monthly_hours,
      overtime_weekday_multiplier: catalog.overtime_weekday_multiplier,
      overtime_weekend_multiplier: catalog.overtime_weekend_multiplier,
      overtime_holiday_multiplier: catalog.overtime_holiday_multiplier,
      currency: catalog.currency,
      effective_from: catalog.effective_from,
      effective_to: catalog.effective_to,
      source: catalog.source,
      notes: catalog.notes || null,
      synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data: savedRate, error: rateErr } = await ctx.service
      .from("gra_labour_rates")
      .upsert(row, { onConflict: "year" })
      .select()
      .single()

    if (rateErr && !/does not exist|relation/i.test(rateErr.message)) {
      throw new Error(rateErr.message)
    }

    // Mirror into company payroll_configuration
    const { data: existingCfg } = await ctx.service
      .from("payroll_configuration")
      .select("id")
      .eq("company_id", ctx.companyId)
      .maybeSingle()

    const cfgPayload = {
      company_id: ctx.companyId,
      minimum_wage: catalog.daily_minimum_wage,
      overtime_weekday_multiplier: catalog.overtime_weekday_multiplier,
      overtime_weekend_multiplier: catalog.overtime_weekend_multiplier,
      currency: "ghs",
      updated_at: new Date().toISOString(),
    }

    if (existingCfg?.id) {
      await ctx.service.from("payroll_configuration").update(cfgPayload).eq("id", existingCfg.id)
    } else {
      await ctx.service.from("payroll_configuration").insert({
        ...cfgPayload,
        pay_frequency: "monthly",
        payroll_cutoff_day: 25,
        auto_calculate_paye: true,
        auto_calculate_ssnit: true,
      })
    }

    // Update company overtime_rates multipliers
    for (const [rateType, mult] of [
      ["weekday", catalog.overtime_weekday_multiplier],
      ["weekend", catalog.overtime_weekend_multiplier],
    ] as const) {
      const { data: ot } = await ctx.service
        .from("overtime_rates")
        .select("id")
        .eq("company_id", ctx.companyId)
        .eq("rate_type", rateType)
        .maybeSingle()
      if (ot?.id) {
        await ctx.service
          .from("overtime_rates")
          .update({
            multiplier: mult,
            description: `GRA-synced ${rateType} OT (${mult}x) · NDMW ${catalog.year}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", ot.id)
      } else {
        await ctx.service.from("overtime_rates").insert({
          company_id: ctx.companyId,
          rate_type: rateType,
          multiplier: mult,
          description: `GRA-synced ${rateType} OT (${mult}x)`,
          is_active: true,
        })
      }
    }

    const hourly = graHourlyMinimum(catalog)
    return NextResponse.json({
      success: true,
      message: `GRA labour rates synced for ${catalog.year}`,
      rate: savedRate || row,
      derived: {
        hourly_minimum: hourly,
        monthly_minimum: graMonthlyMinimum(catalog),
      },
      applied_to: {
        payroll_configuration: true,
        overtime_rates: ["weekday", "weekend"],
        company_id: ctx.companyId,
      },
      next_step: "Recalculate approved overtime so earnings use the new hourly floor / multipliers.",
    })
  } catch (err) {
    return jsonError(err, "Failed to sync GRA labour rates")
  }
}
