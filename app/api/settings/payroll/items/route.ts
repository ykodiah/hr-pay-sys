// @ts-nocheck
/**
 * GET/POST /api/settings/payroll/items
 * Persist allowances, deductions, and tax reliefs for a tenant.
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

function resolveReliefCode(r: any, index: number) {
  const raw = String(
    r.graCode ||
      r.gra_code ||
      r.reliefCode ||
      r.relief_code ||
      r.code ||
      "",
  ).trim()
  if (raw) return raw.slice(0, 50)
  const fromName = String(r.name || "relief")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
  return (fromName || "CUSTOM") + `-${index + 1}`
}

function normalizeReliefPayload(reliefs: any[], companyId: string, now: string) {
  return reliefs
    .filter((r: any) => r?.name)
    .map((r: any, index: number) => {
      const amount = Number(r.amount ?? r.annualAmount ?? 0)
      const graCode = resolveReliefCode(r, index)
      const effective = r.effectiveDate || r.effective_date || null
      return {
        company_id: companyId,
        name: String(r.name).slice(0, 150),
        description: r.description ? String(r.description) : "",
        amount,
        annual_amount: amount,
        currency: r.currency || "GHS",
        category: r.category || "Personal",
        gra_code: graCode,
        relief_code: graCode,
        code: graCode,
        is_active: r.isActive !== false,
        effective_date: effective || undefined,
        last_updated: now,
        updated_at: now,
      }
    })
}

function toUiRelief(r: any) {
  return {
    id: r.id,
    name: r.name || r.description || r.gra_code || r.code || r.graCode || "Untitled relief",
    description: r.description || "",
    amount: Number(r.annual_amount ?? r.amount ?? 0),
    currency: r.currency || "GHS",
    isActive: r.isActive !== false && r.is_active !== false,
    category: r.category || "Personal",
    effectiveDate: r.effectiveDate || r.effective_date || null,
    lastUpdated: r.lastUpdated || r.last_updated || r.updated_at || null,
    graCode: r.graCode || r.gra_code || r.relief_code || r.code || "",
  }
}

/** Durable backup in company_settings.settings_data / companies.settings_data */
async function persistTaxReliefsJsonBackup(
  service: any,
  companyId: string,
  uiReliefs: any[],
  now: string,
): Promise<{ saved: boolean; warning?: string }> {
  const catalog = uiReliefs.map((r) => ({
    name: r.name,
    description: r.description || "",
    amount: Number(r.amount || 0),
    currency: r.currency || "GHS",
    category: r.category || "Personal",
    graCode: r.graCode || "",
    isActive: r.isActive !== false,
    effectiveDate: r.effectiveDate || null,
  }))

  // 1) company_settings by company_id
  {
    const { data: existing } = await service
      .from("company_settings")
      .select("id, settings_data")
      .eq("company_id", companyId)
      .maybeSingle()

    if (existing?.id) {
      const next = { ...(existing.settings_data || {}), tax_reliefs: catalog, tax_reliefs_updated_at: now }
      const { error } = await service
        .from("company_settings")
        .update({ settings_data: next, updated_at: now })
        .eq("id", existing.id)
      if (!error) return { saved: true }
    } else {
      const { error } = await service.from("company_settings").upsert(
        {
          company_id: companyId,
          settings_data: { tax_reliefs: catalog, tax_reliefs_updated_at: now },
          updated_at: now,
        },
        { onConflict: "company_id" },
      )
      if (!error) return { saved: true }

      // Legacy: id = companyId
      const { error: legacyErr } = await service.from("company_settings").upsert(
        {
          id: companyId,
          company_id: companyId,
          name: "Company",
          settings_data: { tax_reliefs: catalog, tax_reliefs_updated_at: now },
          updated_at: now,
        },
        { onConflict: "id" },
      )
      if (!legacyErr) return { saved: true, warning: "Saved tax reliefs via legacy company_settings.id" }
    }
  }

  // 2) companies.settings_data
  {
    const { data: company } = await service
      .from("companies")
      .select("id, settings_data")
      .eq("id", companyId)
      .maybeSingle()
    if (company?.id) {
      const next = { ...(company.settings_data || {}), tax_reliefs: catalog, tax_reliefs_updated_at: now }
      const { error } = await service
        .from("companies")
        .update({ settings_data: next, updated_at: now })
        .eq("id", companyId)
      if (!error) {
        return {
          saved: true,
          warning: "Saved tax reliefs to companies.settings_data backup.",
        }
      }
    }
  }

  return { saved: false, warning: "Could not persist tax reliefs JSON backup" }
}

async function loadTaxReliefsJsonBackup(service: any, companyId: string): Promise<any[]> {
  try {
    const { data: settings } = await service
      .from("company_settings")
      .select("settings_data")
      .eq("company_id", companyId)
      .maybeSingle()
    const fromSettings = settings?.settings_data?.tax_reliefs
    if (Array.isArray(fromSettings) && fromSettings.length) return fromSettings
  } catch {
    // ignore
  }

  try {
    const { data: byId } = await service
      .from("company_settings")
      .select("settings_data")
      .eq("id", companyId)
      .maybeSingle()
    const fromId = byId?.settings_data?.tax_reliefs
    if (Array.isArray(fromId) && fromId.length) return fromId
  } catch {
    // ignore
  }

  try {
    const { data: company } = await service
      .from("companies")
      .select("settings_data")
      .eq("id", companyId)
      .maybeSingle()
    const fromCompany = company?.settings_data?.tax_reliefs
    if (Array.isArray(fromCompany) && fromCompany.length) return fromCompany
  } catch {
    // ignore
  }

  return []
}

function withRequiredReliefCodes(row: Record<string, any>, companyId: string, now: string) {
  const code = String(row.relief_code || row.gra_code || row.code || "CUSTOM").trim() || "CUSTOM"
  const out: Record<string, any> = {
    company_id: companyId,
    name: String(row.name || "Tax relief").slice(0, 150),
    amount: Number(row.amount ?? row.annual_amount ?? 0),
    gra_code: code,
    relief_code: code,
    code,
    is_active: true,
    updated_at: now,
  }
  if (row.description != null && row.description !== "") out.description = String(row.description)
  if (row.annual_amount != null) out.annual_amount = Number(row.annual_amount)
  else out.annual_amount = out.amount
  if (row.currency) out.currency = String(row.currency)
  if (row.category) out.category = String(row.category)
  if (row.effective_date) out.effective_date = row.effective_date
  if (row.last_updated) out.last_updated = row.last_updated
  else out.last_updated = now
  return out
}

async function upsertTaxReliefRow(
  service: any,
  companyId: string,
  row: Record<string, any>,
  existingId: string | undefined,
  now: string,
): Promise<{ ok: boolean; id?: string; error?: any }> {
  const full = withRequiredReliefCodes(row, companyId, now)

  // Progressive column strip — never drop relief_code / gra_code / code
  const attempts = [
    full,
    (({ effective_date, last_updated, annual_amount, currency, category, description, ...r }) => r)(full),
    {
      company_id: companyId,
      name: full.name,
      amount: full.amount,
      gra_code: full.gra_code,
      relief_code: full.relief_code,
      code: full.code,
      is_active: true,
      updated_at: now,
    },
    {
      company_id: companyId,
      name: full.name,
      amount: full.amount,
      relief_code: full.relief_code,
      is_active: true,
      updated_at: now,
    },
  ]

  let lastError: any = null
  for (const payload of attempts) {
    if (existingId) {
      const { error } = await service.from("tax_reliefs").update(payload).eq("id", existingId).eq("company_id", companyId)
      if (!error) return { ok: true, id: existingId }
      lastError = error
      if (isMissingRelation(error)) return { ok: false, error }
    } else {
      const { data, error } = await service
        .from("tax_reliefs")
        .insert({ ...payload, created_at: now })
        .select("id")
        .maybeSingle()
      if (!error) return { ok: true, id: data?.id }
      lastError = error
      if (isMissingRelation(error)) return { ok: false, error }
    }
  }

  // Final attempt with absolute minimum NOT NULL fields
  const minimal = {
    company_id: companyId,
    name: full.name,
    relief_code: full.relief_code,
    is_active: true,
    updated_at: now,
  }
  if (existingId) {
    const { error } = await service.from("tax_reliefs").update(minimal).eq("id", existingId).eq("company_id", companyId)
    return error ? { ok: false, error } : { ok: true, id: existingId }
  }
  const { data, error } = await service
    .from("tax_reliefs")
    .insert({ ...minimal, created_at: now })
    .select("id")
    .maybeSingle()
  return error ? { ok: false, error: error || lastError } : { ok: true, id: data?.id }
}

async function syncTaxReliefsTable(
  service: any,
  companyId: string,
  rows: Record<string, any>[],
  now: string,
): Promise<{ saved: number; warning?: string }> {
  if (!rows.length) {
    await service
      .from("tax_reliefs")
      .update({ is_active: false, updated_at: now })
      .eq("company_id", companyId)
    return { saved: 0 }
  }

  const { data: existingRows, error: loadErr } = await service
    .from("tax_reliefs")
    .select("id, gra_code, relief_code, code, name, is_active")
    .eq("company_id", companyId)

  if (loadErr) {
    if (isMissingRelation(loadErr)) {
      return {
        saved: 0,
        warning: "tax_reliefs table missing — catalog saved to company settings. Run scripts/069 and 074.",
      }
    }
    return {
      saved: 0,
      warning: `Table sync skipped: ${loadErr.message}. Catalog kept in company settings.`,
    }
  }

  const byCode = new Map<string, any>()
  for (const er of existingRows || []) {
    const key = String(er.gra_code || er.relief_code || er.code || "")
      .trim()
      .toUpperCase()
    if (key && !byCode.has(key)) byCode.set(key, er)
  }

  const keepIds = new Set<string>()
  let saved = 0
  let lastError: any = null

  for (const row of rows) {
    const code = String(row.relief_code || row.gra_code || row.code || "")
      .trim()
      .toUpperCase()
    const match = code ? byCode.get(code) : null
    const result = await upsertTaxReliefRow(service, companyId, row, match?.id, now)
    if (result.ok) {
      saved += 1
      if (result.id) keepIds.add(result.id)
      else if (match?.id) keepIds.add(match.id)
    } else {
      lastError = result.error
      if (isMissingRelation(result.error)) {
        return {
          saved: 0,
          warning: "tax_reliefs table missing — catalog saved to company settings. Run scripts/069 and 074.",
        }
      }
    }
  }

  // Soft-deactivate catalog rows not in this save
  if (saved > 0 && (existingRows || []).length) {
    const staleIds = (existingRows || [])
      .filter((er: any) => er.is_active !== false && er.id && !keepIds.has(er.id))
      .map((er: any) => er.id)
    if (staleIds.length) {
      await service
        .from("tax_reliefs")
        .update({ is_active: false, updated_at: now })
        .eq("company_id", companyId)
        .in("id", staleIds)
    }
  }

  if (saved === 0 && lastError) {
    return {
      saved: 0,
      warning: `Table sync skipped: ${lastError.message}. Catalog kept in company settings.`,
    }
  }

  if (saved < rows.length && lastError) {
    return {
      saved,
      warning: `Synced ${saved}/${rows.length} reliefs to tax_reliefs. Last error: ${lastError.message}`,
    }
  }

  return { saved }
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

    let taxReliefs = (reliefRows || []).map(toUiRelief)
    if (!taxReliefs.length) {
      const backup = await loadTaxReliefsJsonBackup(service, companyId)
      taxReliefs = backup.map(toUiRelief)
    }

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
      taxReliefs,
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
      const rows = normalizeReliefPayload(reliefs, companyId, now)
      const uiReliefs = rows.map(toUiRelief)

      // 1) Always persist JSON backup first — Save All must succeed for Settings UI
      const backup = await persistTaxReliefsJsonBackup(service, companyId, uiReliefs, now)
      if (!backup.saved) {
        return NextResponse.json(
          {
            success: false,
            error:
              backup.warning ||
              "Failed to save tax reliefs. Run scripts/073 and 074 in Supabase, then try again.",
          },
          { status: 500 },
        )
      }

      // 2) Sync into tax_reliefs table (required for payroll Assign / Bulk Assign)
      const tableSync = await syncTaxReliefsTable(service, companyId, rows, now)

      // Only surface warnings when table sync fails or partially fails.
      // JSON backup path is silent when the catalog table sync succeeded.
      const warning =
        tableSync.warning ||
        (tableSync.saved === 0 && backup.warning ? backup.warning : undefined)

      return NextResponse.json({
        success: true,
        saved: uiReliefs.length,
        table_saved: tableSync.saved,
        warning,
        taxReliefs: uiReliefs,
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save payroll items")
  }
}
