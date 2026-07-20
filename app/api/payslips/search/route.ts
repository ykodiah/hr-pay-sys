/**
 * GET /api/payslips/search
 * Tenant-scoped payslip search for Payslips → Custom / Bulk tabs.
 *
 * Query:
 *   period_from=YYYY-MM (required)
 *   period_to=YYYY-MM (optional)
 *   employee_ids=uuid,uuid (optional)
 *   department= (optional)
 *   limit= (optional, default 500)
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { normalizePayrollCashRows } from "@/lib/payroll/cash-deductions"

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { searchParams } = new URL(req.url)
    const periodFrom = String(searchParams.get("period_from") || "").trim()
    const periodTo = String(searchParams.get("period_to") || periodFrom).trim()
    const department = String(searchParams.get("department") || "").trim()
    const employeeIdsRaw = String(searchParams.get("employee_ids") || "").trim()
    const limit = Math.min(Number(searchParams.get("limit") || 500), 1000)

    if (!/^\d{4}-\d{2}$/.test(periodFrom)) {
      return NextResponse.json(
        { error: "period_from is required as YYYY-MM" },
        { status: 400 },
      )
    }

    const employeeIds = employeeIdsRaw
      ? employeeIdsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : []

    let query = service
      .from("payslips")
      .select("*")
      .eq("company_id", companyId)
      .gte("pay_period", periodFrom)
      .lte("pay_period", /^\d{4}-\d{2}$/.test(periodTo) ? periodTo : periodFrom)
      .order("pay_period", { ascending: false })
      .limit(limit)

    if (employeeIds.length) {
      query = query.in("employee_id", employeeIds)
    }
    if (department && department !== "all") {
      query = query.eq("snapshot_department", department)
    }

    const { data, error } = await query
    if (error) {
      // Retry without optional order/filter columns if schema is lean
      if (/column|schema cache/i.test(String(error.message || ""))) {
        const retry = await service
          .from("payslips")
          .select("*")
          .eq("company_id", companyId)
          .gte("pay_period", periodFrom)
          .lte("pay_period", /^\d{4}-\d{2}$/.test(periodTo) ? periodTo : periodFrom)
          .limit(limit)
        if (retry.error) {
          return NextResponse.json({ error: retry.error.message }, { status: 500 })
        }
        let rows = retry.data || []
        if (employeeIds.length) {
          const set = new Set(employeeIds)
          rows = rows.filter((r: any) => set.has(r.employee_id))
        }
        if (department && department !== "all") {
          rows = rows.filter((r: any) => r.snapshot_department === department)
        }
        return NextResponse.json({
          success: true,
          payslips: normalizePayrollCashRows(rows),
          count: rows.length,
          company_id: companyId,
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      payslips: normalizePayrollCashRows(data || []),
      count: (data || []).length,
      company_id: companyId,
    })
  } catch (err) {
    return jsonError(err, "Failed to search payslips")
  }
}
