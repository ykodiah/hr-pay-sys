/**
 * GET  /api/settings/payroll  — load payroll config for a company
 * POST /api/settings/payroll  — save payroll config for a company
 *
 * Payroll config is stored as individual rows in system_settings with
 * setting_category = 'payroll_config'.
 */

import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

// Keys stored in system_settings for payroll config
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
  if (
    ["minimum_wage", "overtime_weekday_multiplier", "overtime_weekend_multiplier"].includes(key)
  ) {
    return parseFloat(raw)
  }
  if (key === "payroll_cutoff_day") return parseInt(raw, 10)
  return raw
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("company_id")
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from("system_settings")
      .select("setting_key, setting_value")
      .eq("company_id", companyId)
      .eq("setting_category", "payroll_config")
      .in("setting_key", PAYROLL_KEYS as unknown as string[])

    if (error) throw error

    const config: PayrollConfig = { ...DEFAULTS }
    for (const row of data ?? []) {
      const key = row.setting_key as PayrollConfigKey
      if (PAYROLL_KEYS.includes(key)) {
        // setting_value is jsonb — could be a string or a primitive wrapped in json
        const raw =
          typeof row.setting_value === "string"
            ? row.setting_value
            : JSON.stringify(row.setting_value ?? "")
        ;(config as any)[key] = parseValue(key, raw.replace(/^"|"$/g, ""))
      }
    }

    return NextResponse.json({ config })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load payroll config" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { company_id, config } = body as { company_id: string; config: Partial<PayrollConfig> }

    if (!company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const supabase = createServiceClient()
    const now = new Date().toISOString()

    const rows = (Object.keys(config) as PayrollConfigKey[])
      .filter((k) => PAYROLL_KEYS.includes(k))
      .map((k) => ({
        company_id,
        setting_category: "payroll_config",
        setting_key: k,
        // Store as jsonb — wrap primitive in json-safe value
        setting_value: JSON.parse(JSON.stringify((config as any)[k])),
        is_active: true,
        updated_at: now,
      }))

    if (!rows.length) {
      return NextResponse.json({ success: true, saved: 0 })
    }

    const { error } = await supabase
      .from("system_settings")
      .upsert(rows, { onConflict: "company_id,setting_category,setting_key" })

    if (error) throw error

    return NextResponse.json({ success: true, saved: rows.length })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save payroll config" },
      { status: 500 },
    )
  }
}
