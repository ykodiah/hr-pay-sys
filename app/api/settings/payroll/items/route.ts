// @ts-nocheck
/**
 * GET/POST /api/settings/payroll/items
 * Persist allowances, deductions, and tax reliefs for a tenant.
 * Soft-deletes removed codes so deleted UI rows do not reappear.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

const SEED_ALLOWANCE_CODES = new Set(["TRANS", "HOUSE", "MED", "MEAL", "UNIFORM", "COMM"])
const SEED_DEDUCTION_CODES = new Set(["TAX", "SSNIT", "TIER3", "LOAN", "ADVANCE"])

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
  )
}

function isMissingColumn(error: any) {
  const message = String(error?.message || error || "")
  return (
    error?.code === "PGRST204" ||
    /could not find the .* column/i.test(message) ||
    /schema cache/i.test(message) ||
    /column .* does not exist/i.test(message)
  )
}

async function safeRows(query: PromiseLike<{ data: any; error: any }>, label: string) {
  const { data, error } = await query
  if (error) {
    if (isMissingRelation(error)) {
      console.warn(`[settings/payroll/items] ${label} missing:`, error.message)
      return []
    }
    throw error
  }
  return data || []
}

function looksLikeUntouchedSeed(rows: any[], seedCodes: Set<string>) {
  if (!rows?.length) return false
  if (rows.length > seedCodes.size) return false
  return rows.every((r) => {
    const code = String(r.code || "").toUpperCase()
    if (!seedCodes.has(code)) return false
    return Number(r.amount || 0) === 0
  })
}

async function purgeAccidentalSeedCatalog(
  service: any,
  companyId: string,
  allowanceRows: any[],
  deductionRows: any[],
) {
  const now = new Date().toISOString()
  let allowances = allowanceRows
  let deductions = deductionRows

  if (looksLikeUntouchedSeed(allowances, SEED_ALLOWANCE_CODES)) {
    await service
      .from("payroll_allowances")
      .update({ is_active: false, updated_at: now })
      .eq("company_id", companyId)
      .in("code", [...SEED_ALLOWANCE_CODES])
    allowances = []
  }

  if (looksLikeUntouchedSeed(deductions, SEED_DEDUCTION_CODES)) {
    await service
      .from("payroll_deductions")
      .update({ is_active: false, updated_at: now })
      .eq("company_id", companyId)
      .in("code", [...SEED_DEDUCTION_CODES])
    deductions = []
  }

  return { allowances, deductions }
}

async function insertTaxReliefsResilient(service: any, rows: Record<string, any>[]) {
  if (!rows.length) return { saved: 0 }

  // Full payload first
  {
    const { error } = await service.from("tax_reliefs").insert(rows)
    if (!error) return { saved: rows.length }
    if (!isMissingColumn(error) && !isMissingRelation(error)) {
      // Retry without optional columns that often break older schemas
      const stripped = rows.map((r) => {
        const {
          relief_code: _rc,
          code: _c,
          last_updated: _lu,
          annual_amount: _aa,
          currency: _cur,
          category: _cat,
          effective_date: _ed,
          description: _d,
          ...rest
        } = r
        return rest
      })
      const { error: err2 } = await service.from("tax_reliefs").insert(stripped)
      if (!err2) return { saved: stripped.length, warning: error.message }
      // Minimal core columns
      const minimal = rows.map((r) => ({
        company_id: r.company_id,
        name: r.name,
        amount: r.amount ?? r.annual_amount ?? 0,
        is_active: r.is_active !== false,
        gra_code: r.gra_code || null,
        updated_at: r.updated_at,
      }))
      const { error: err3 } = await service.from("tax_reliefs").insert(minimal)
      if (!err3) {
        return {
          saved: minimal.length,
          warning:
            "Saved with minimal tax_reliefs columns. Run scripts/069_employee_tax_reliefs.sql and scripts/073_company_settings_and_payroll_hardening.sql.",
        }
      }
      throw err3
    }
    if (isMissingRelation(error)) {
      throw new Error(
        "tax_reliefs table is missing. Run scripts/069_employee_tax_reliefs.sql (and 073) in Supabase.",
      )
    }
  }

  // Schema-cache column miss — try progressively smaller payloads
  const attempts = [
    rows.map(({ relief_code, code, last_updated, ...r }) => r),
    rows.map((r) => ({
      company_id: r.company_id,
      name: r.name,
      description: r.description || "",
      amount: r.amount ?? 0,
      annual_amount: r.annual_amount ?? r.amount ?? 0,
      is_active: r.is_active !== false,
      gra_code: r.gra_code || null,
      updated_at: r.updated_at,
    })),
    rows.map((r) => ({
      company_id: r.company_id,
      name: r.name,
      amount: r.amount ?? 0,
      is_active: true,
      gra_code: r.gra_code || null,
    })),
  ]

  let lastError: any = null
  for (const payload of attempts) {
    const { error } = await service.from("tax_reliefs").insert(payload)
    if (!error) {
      return {
        saved: payload.length,
        warning:
          "Saved tax reliefs. Run scripts/073_company_settings_and_payroll_hardening.sql to refresh PostgREST schema cache.",
      }
    }
    lastError = error
  }

  throw lastError || new Error("Failed to save tax reliefs")
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [allowanceRowsRaw, deductionRowsRaw, reliefRows] = await Promise.all([
      safeRows(
        service
          .from("payroll_allowances")
          .select("code, description, taxable, recurring, amount, percentage, type, is_active")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("code"),
        "payroll_allowances",
      ),
      safeRows(
        service
          .from("payroll_deductions")
          .select("code, description, taxable, recurring, amount, percentage, type, is_active")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("code"),
        "payroll_deductions",
      ),
      safeRows(
        service
          .from("tax_reliefs")
          .select("*")
          .eq("company_id", companyId)
          .eq("is_active", true)
          .order("created_at", { ascending: true }),
        "tax_reliefs",
      ),
    ])

    const purged = await purgeAccidentalSeedCatalog(
      service,
      companyId,
      allowanceRowsRaw,
      deductionRowsRaw,
    )

    return NextResponse.json({
      allowances: (purged.allowances || []).map((a) => ({
        code: a.code,
        description: a.description,
        taxable: Boolean(a.taxable),
        recurring: a.recurring !== false,
        amount: Number(a.amount || 0),
        percentage: Number(a.percentage || 0),
        type: a.type || "FIXED",
      })),
      deductions: (purged.deductions || []).map((d) => ({
        code: d.code,
        description: d.description,
        taxable: Boolean(d.taxable),
        recurring: d.recurring !== false,
        amount: Number(d.amount || 0),
        percentage: Number(d.percentage || 0),
        type: d.type || "FIXED",
      })),
      taxReliefs: (reliefRows || []).map((r) => ({
        id: r.id,
        name: r.name || r.description || r.gra_code || r.code || "Untitled relief",
        description: r.description || "",
        amount: Number(r.annual_amount ?? r.amount ?? 0),
        currency: r.currency || "GHS",
        isActive: r.is_active !== false,
        category: r.category || "Personal",
        effectiveDate: r.effective_date || null,
        lastUpdated: r.last_updated || r.updated_at || null,
        graCode: r.gra_code || r.relief_code || r.code || "",
      })),
    })
  } catch (err) {
    return jsonError(err, "Failed to load payroll items")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx
    const now = new Date().toISOString()
    const action = body.action || "save_all"

    if (action === "save_all" || action === "save_allowances_deductions") {
      const allowances = Array.isArray(body.allowances) ? body.allowances : []
      const deductions = Array.isArray(body.deductions) ? body.deductions : []

      const allowanceRows = allowances
        .filter((a: any) => a.code)
        .map((a: any) => ({
          company_id: companyId,
          code: a.code,
          description: a.description,
          taxable: Boolean(a.taxable),
          recurring: a.recurring !== false,
          amount: Number(a.amount || 0),
          percentage: Number(a.percentage || 0),
          type: a.type || "FIXED",
          is_active: true,
          updated_at: now,
        }))

      const deductionRows = deductions
        .filter((d: any) => d.code)
        .map((d: any) => ({
          company_id: companyId,
          code: d.code,
          description: d.description,
          taxable: Boolean(d.taxable),
          recurring: d.recurring !== false,
          amount: Number(d.amount || 0),
          percentage: Number(d.percentage || 0),
          type: d.type || "FIXED",
          is_active: true,
          updated_at: now,
        }))

      await service
        .from("payroll_allowances")
        .update({ is_active: false, updated_at: now })
        .eq("company_id", companyId)
      await service
        .from("payroll_deductions")
        .update({ is_active: false, updated_at: now })
        .eq("company_id", companyId)

      if (allowanceRows.length) {
        const { error } = await service
          .from("payroll_allowances")
          .upsert(allowanceRows, { onConflict: "company_id,code" })
        if (error) throw error
      }
      if (deductionRows.length) {
        const { error } = await service
          .from("payroll_deductions")
          .upsert(deductionRows, { onConflict: "company_id,code" })
        if (error) throw error
      }

      return NextResponse.json({
        success: true,
        saved_allowances: allowanceRows.length,
        saved_deductions: deductionRows.length,
      })
    }

    if (action === "save_tax_reliefs") {
      const reliefs = Array.isArray(body.taxReliefs) ? body.taxReliefs : []

      const rows = reliefs
        .filter((r: any) => r?.name)
        .map((r: any) => {
          const amount = Number(r.amount ?? r.annualAmount ?? 0)
          return {
            company_id: companyId,
            name: String(r.name),
            description: r.description || "",
            amount,
            annual_amount: amount,
            currency: r.currency || "GHS",
            category: r.category || "Personal",
            gra_code: r.graCode || r.gra_code || r.code || null,
            relief_code: r.graCode || r.relief_code || r.code || null,
            is_active: r.isActive !== false,
            effective_date: r.effectiveDate || r.effective_date || null,
            last_updated: now,
            updated_at: now,
            created_at: now,
          }
        })

      // Snapshot currently-active ids so we can retire them only after a successful insert.
      const { data: existingActive } = await service
        .from("tax_reliefs")
        .select("id")
        .eq("company_id", companyId)
        .eq("is_active", true)

      let insertResult = { saved: 0, warning: undefined as string | undefined }
      if (rows.length) {
        insertResult = await insertTaxReliefsResilient(service, rows)
      }

      const oldIds = (existingActive || []).map((r: any) => r.id).filter(Boolean)
      if (oldIds.length) {
        // Chunk in case of large catalogs
        for (let i = 0; i < oldIds.length; i += 100) {
          const chunk = oldIds.slice(i, i + 100)
          await service
            .from("tax_reliefs")
            .update({ is_active: false, updated_at: now })
            .in("id", chunk)
        }
      }

      return NextResponse.json({
        success: true,
        saved: insertResult.saved,
        warning: insertResult.warning,
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save payroll items")
  }
}
