// @ts-nocheck
/**
 * GET  /api/settings/payroll  — load payroll config for a company
 * POST /api/settings/payroll  — save payroll config for a company
 *
 * Primary store: payroll_configuration
 * Also mirrors into system_settings (setting_category='payroll_config') for compatibility.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const PAYROLL_KEYS = [
  "pay_frequency",
  "minimum_wage",
  "overtime_weekday_multiplier",
  "overtime_weekend_multiplier",
  "payroll_cutoff_day",
  "auto_calculate_paye",
  "auto_calculate_ssnit",
  "auto_calculate_provident_fund",
  "currency",
] as const

type PayrollConfigKey = (typeof PAYROLL_KEYS)[number]

type PayrollConfig = {
  pay_frequency: string
  minimum_wage: number
  overtime_weekday_multiplier: number
  overtime_weekend_multiplier: number
  payroll_cutoff_day: number
  auto_calculate_paye: boolean
  auto_calculate_ssnit: boolean
  auto_calculate_provident_fund: boolean
  currency: string
}

const DEFAULTS: PayrollConfig = {
  pay_frequency: "monthly",
  minimum_wage: 18.15,
  overtime_weekday_multiplier: 1.5,
  overtime_weekend_multiplier: 2.0,
  payroll_cutoff_day: 25,
  auto_calculate_paye: true,
  auto_calculate_ssnit: true,
  auto_calculate_provident_fund: true,
  currency: "ghs",
}

function parseValue(key: PayrollConfigKey, raw: string): any {
  if (["auto_calculate_paye", "auto_calculate_ssnit", "auto_calculate_provident_fund"].includes(key)) {
    return raw === "true" || raw === "1"
  }
  if (["minimum_wage", "overtime_weekday_multiplier", "overtime_weekend_multiplier"].includes(key)) {
    return parseFloat(raw)
  }
  if (key === "payroll_cutoff_day") return parseInt(raw, 10)
  return raw
}

function rowToConfig(row: Record<string, any> | null): PayrollConfig | null {
  if (!row) return null
  return {
    pay_frequency: row.pay_frequency || DEFAULTS.pay_frequency,
    minimum_wage: Number(row.minimum_wage ?? DEFAULTS.minimum_wage),
    overtime_weekday_multiplier: Number(row.overtime_weekday_multiplier ?? DEFAULTS.overtime_weekday_multiplier),
    overtime_weekend_multiplier: Number(row.overtime_weekend_multiplier ?? DEFAULTS.overtime_weekend_multiplier),
    payroll_cutoff_day: Number(row.payroll_cutoff_day ?? DEFAULTS.payroll_cutoff_day),
    auto_calculate_paye: row.auto_calculate_paye !== false,
    auto_calculate_ssnit: row.auto_calculate_ssnit !== false,
    auto_calculate_provident_fund: row.auto_calculate_provident_fund !== false,
    currency: row.currency || DEFAULTS.currency,
  }
}

async function loadFromSystemSettings(service: any, companyId: string): Promise<PayrollConfig> {
  const config: PayrollConfig = { ...DEFAULTS }
  const { data, error } = await service
    .from("system_settings")
    .select("setting_key, setting_value")
    .eq("company_id", companyId)
    .eq("setting_category", "payroll_config")
    .in("setting_key", PAYROLL_KEYS as unknown as string[])

  if (error) {
    const msg = String(error.message || "").toLowerCase()
    if (msg.includes("does not exist") || error.code === "42P01" || error.code === "PGRST205") {
      return config
    }
    throw error
  }

  for (const row of data ?? []) {
    const key = row.setting_key as PayrollConfigKey
    if (!PAYROLL_KEYS.includes(key)) continue
    const raw =
      typeof row.setting_value === "string"
        ? row.setting_value
        : JSON.stringify(row.setting_value ?? "")
    ;(config as any)[key] = parseValue(key, raw.replace(/^"|"$/g, ""))
  }
  return config
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    // Prefer dedicated payroll_configuration table
    const { data: row, error } = await service
      .from("payroll_configuration")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle()

    if (!error && row) {
      return NextResponse.json({ config: rowToConfig(row), source: "payroll_configuration" })
    }

    if (error) {
      const msg = String(error.message || "").toLowerCase()
      if (!(msg.includes("does not exist") || error.code === "42P01" || error.code === "PGRST205")) {
        console.warn("[settings/payroll] payroll_configuration read:", error.message)
      }
    }

    const config = await loadFromSystemSettings(service, companyId)
    return NextResponse.json({ config, source: "system_settings" })
  } catch (err) {
    return jsonError(err, "Failed to load payroll config")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const now = new Date().toISOString()
    const incoming = (body.config || body) as Partial<PayrollConfig>

    const config: PayrollConfig = {
      pay_frequency: incoming.pay_frequency ?? DEFAULTS.pay_frequency,
      minimum_wage: Number(incoming.minimum_wage ?? DEFAULTS.minimum_wage),
      overtime_weekday_multiplier: Number(
        incoming.overtime_weekday_multiplier ?? DEFAULTS.overtime_weekday_multiplier,
      ),
      overtime_weekend_multiplier: Number(
        incoming.overtime_weekend_multiplier ?? DEFAULTS.overtime_weekend_multiplier,
      ),
      payroll_cutoff_day: Number(incoming.payroll_cutoff_day ?? DEFAULTS.payroll_cutoff_day),
      auto_calculate_paye: incoming.auto_calculate_paye !== false,
      auto_calculate_ssnit: incoming.auto_calculate_ssnit !== false,
      auto_calculate_provident_fund: incoming.auto_calculate_provident_fund !== false,
      currency: incoming.currency || DEFAULTS.currency,
    }

    const warnings: string[] = []

    // Primary: payroll_configuration
    const { error: tableError } = await service.from("payroll_configuration").upsert(
      {
        company_id: companyId,
        ...config,
        updated_at: now,
      },
      { onConflict: "company_id" },
    )
    if (tableError) {
      warnings.push(`payroll_configuration: ${tableError.message}`)
      console.warn("[settings/payroll] table upsert failed:", tableError.message)
    }

    // Mirror: system_settings (best-effort)
    const rows = PAYROLL_KEYS.map((k) => ({
      company_id: companyId,
      setting_category: "payroll_config",
      setting_key: k,
      setting_value: JSON.parse(JSON.stringify((config as any)[k])),
      is_active: true,
      updated_at: now,
    }))

    const { error: settingsError } = await service
      .from("system_settings")
      .upsert(rows, { onConflict: "company_id,setting_category,setting_key" })
    if (settingsError) {
      warnings.push(`system_settings: ${settingsError.message}`)
      console.warn("[settings/payroll] system_settings upsert failed:", settingsError.message)
    }

    if (tableError && settingsError) {
      return NextResponse.json(
        { success: false, error: warnings.join("; "), warnings },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      config,
      warnings: warnings.length ? warnings : undefined,
    })
  } catch (err) {
    return jsonError(err, "Failed to save payroll config")
  }
}
