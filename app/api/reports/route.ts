/**
 * GET  /api/reports  — list previously generated compliance reports from DB
 * POST /api/reports  — generate one or all compliance reports for a period
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  generateReport,
  generateAllReports,
  listComplianceReports,
} from "@/lib/services/reports/engine"
import type { ReportType } from "@/lib/services/reports/types"

// ─── GET — list report history ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const client    = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const companyId   = searchParams.get("company_id")
    const reportType  = searchParams.get("report_type") as ReportType | null
    const payPeriod   = searchParams.get("pay_period")
    const limit       = Number(searchParams.get("limit") ?? 50)

    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const records = await listComplianceReports(companyId, {
      report_type: reportType ?? undefined,
      pay_period:  payPeriod ?? undefined,
      limit,
    })

    return NextResponse.json({ success: true, data: records })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── POST — generate reports ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const client = await createClient()
    const { data: { user } } = await client.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      company_id,
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
      const reports = await generateAllReports(company_id, pay_period, payroll_run_id, user.id)
      return NextResponse.json({
        success: true,
        count: reports.length,
        data: reports.map((r) => ({
          report_type:  r.report_type,
          report_name:  r.report_name,
          pay_period:   r.pay_period,
          row_count:    r.row_count,
          generated_at: r.generated_at,
          summary:      r.summary,
          // CSV omitted from bulk response — download individually
        })),
      })
    }

    const report = await generateReport(
      { company_id, report_type, pay_period, payroll_run_id, tax_year },
      user.id
    )

    return NextResponse.json({ success: true, data: report })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
