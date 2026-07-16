/**
 * POST /api/reports/download
 *
 * Generates a report on the fly and streams it back as a CSV download.
 * Used by the UI "Download CSV" button — no round-trip to fetch a saved report.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { generateReport } from "@/lib/services/reports/engine"
import type { ReportType } from "@/lib/services/reports/types"

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { company_id, report_type, pay_period, payroll_run_id, tax_year } = body

    if (!company_id || !report_type || (!pay_period && !payroll_run_id)) {
      return NextResponse.json(
        { error: "company_id, report_type, and pay_period or payroll_run_id are required" },
        { status: 400 },
      )
    }

    const report = await generateReport(
      {
        company_id,
        report_type: report_type as ReportType,
        pay_period,
        payroll_run_id,
        tax_year,
      },
      user.isDemo ? undefined : user.id,
    )

    // Build a safe filename
    const safePeriod = (pay_period ?? report.pay_period).replace(/[^0-9-]/g, "")
    const safeType = report_type.replace(/_/g, "-")
    const filename = `${safeType}-${safePeriod}.csv`

    // Log download in audit
    try {
      const client = await createClient()
      const { data: saved } = await client
        .from("compliance_reports")
        .select("id")
        .eq("company_id", company_id)
        .eq("report_type", report_type)
        .eq("pay_period", pay_period ?? report.pay_period)
        .order("generated_at", { ascending: false })
        .limit(1)
        .single()

      if (saved?.id) {
        await client.rpc("log_report_action", {
          p_report_id: saved.id,
          p_action: "downloaded",
          p_actor_id: user.isDemo ? null : user.id,
          p_actor_name: user.isDemo ? "Demo User" : null,
          p_notes: `format=csv`,
        })
      }
    } catch {
      // Non-fatal
    }

    return new NextResponse(report.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
