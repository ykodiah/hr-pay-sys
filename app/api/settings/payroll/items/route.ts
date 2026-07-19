// @ts-nocheck
/**
 * GET/POST /api/settings/payroll/items
 * Persist allowances, deductions, and tax reliefs for a tenant.
 * Soft-deletes removed codes so deleted UI rows do not reappear.
 */

import { NextRequest, NextResponse } from "next/server"
import { jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function isMissingRelation(error: any) {
  const message = String(error?.message || error || "").toLowerCase()
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table")
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

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const [allowanceRows, deductionRows, reliefRows] = await Promise.all([
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

    return NextResponse.json({
      allowances: (allowanceRows || []).map((a) => ({
        code: a.code,
        description: a.description,
        taxable: Boolean(a.taxable),
        recurring: a.recurring !== false,
        amount: Number(a.amount || 0),
        percentage: Number(a.percentage || 0),
        type: a.type || "FIXED",
      })),
      deductions: (deductionRows || []).map((d) => ({
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

      // Soft-deactivate codes removed from UI
      const keepAllowanceCodes = allowanceRows.map((r: any) => r.code)
      const keepDeductionCodes = deductionRows.map((r: any) => r.code)

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

      // Re-activate kept codes (upsert already sets is_active true)
      void keepAllowanceCodes
      void keepDeductionCodes

      return NextResponse.json({
        success: true,
        saved_allowances: allowanceRows.length,
        saved_deductions: deductionRows.length,
      })
    }

    if (action === "save_tax_reliefs") {
      const reliefs = Array.isArray(body.taxReliefs) ? body.taxReliefs : []
      await service.from("tax_reliefs").update({ is_active: false, updated_at: now }).eq("company_id", companyId)

      if (reliefs.length) {
        const isUuid = (v: unknown) =>
          typeof v === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v)

        // Always insert fresh rows after soft-deactivate. GRA sync uses numeric ids that
        // are not valid UUIDs — never pass those into upsert.
        const rows = reliefs
          .filter((r: any) => r?.name)
          .map((r: any) => {
            const amount = Number(r.amount ?? r.annualAmount ?? 0)
            const base: Record<string, any> = {
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
            }
            if (isUuid(r.id)) base.id = r.id
            return base
          })

        if (rows.length) {
          // Prefer insert without client ids so GRA numeric ids never corrupt UUID PK.
          const plain = rows.map(({ id: _id, ...rest }) => rest)
          const { error: insertErr } = await service.from("tax_reliefs").insert(plain)
          if (insertErr) throw insertErr
        }
      }

      return NextResponse.json({ success: true, saved: reliefs.length })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to save payroll items")
  }
}
