/**
 * GET  /api/reports  — list previously generated compliance reports from DB
 * POST /api/reports  — generate one or all compliance reports for a period
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import {
  generateReport,
  generateAllReports,
  listComplianceReports,
} from "@/lib/services/reports/engine"
import type { ReportType } from "@/lib/services/reports/types"

// ─── GET — list report history ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId } = ctx

    const { searchParams } = new URL(req.url)
    const reportType = searchParams.get("report_type") as ReportType | null
    const payPeriod = searchParams.get("pay_period")
    const limit = Number(searchParams.get("limit") ?? 50)

    const records = await listComplianceReports(companyId, {
      report_type: reportType ?? undefined,
      pay_period: payPeriod ?? undefined,
      limit,
    })

    return NextResponse.json({ success: true, data: records, company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to list reports")
  }
}

// ─── POST — generate reports ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId: company_id, userId, demo } = ctx
    const actorId = demo ? undefined : userId || undefined
    const {
      report_type,
      pay_period,
      payroll_run_id,
      tax_year,
      generate_all = false,
    } = body

    if (!company_id) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }
    if (!generate_all && !report_type) {
      return NextResponse.json({ error: "report_type is required unless generate_all=true" }, { status: 400 })
    }
    if (!pay_period && !payroll_run_id) {
      return NextResponse.json({ error: "pay_period or payroll_run_id is required" }, { status: 400 })
    }

    if (generate_all) {
      const reports = await generateAllReports(company_id, pay_period, payroll_run_id, actorId)
      return NextResponse.json({
        success: true,
        count: reports.length,
        data: reports.map((r) => ({
          report_type: r.report_type,
          report_name: r.report_name,
          pay_period: r.pay_period,
          row_count: r.row_count,
          generated_at: r.generated_at,
          summary: r.summary,
          // CSV omitted from bulk response — download individually
        })),
      })
    }

    const report = await generateReport(
      { company_id, report_type, pay_period, payroll_run_id, tax_year },
      actorId,
    )

    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
