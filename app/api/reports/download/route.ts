/**
 * POST /api/reports/download
 *
 * Generates a report and streams CSV or printable PDF (HTML) with company branding.
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUserOrGuest } from "@/lib/auth/api-user"
import { generateReport } from "@/lib/services/reports/engine"
import type { ReportType } from "@/lib/services/reports/types"
import { loadCompanyBrand, renderBrandedHtmlDocument } from "@/lib/exports/company-branding"

function money(n: number) {
  return Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUserOrGuest()

    const body = await req.json()
    const { company_id, report_type, pay_period, payroll_run_id, tax_year } = body
    const format = String(body.format || "csv").toLowerCase()

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

    const safePeriod = (pay_period ?? report.pay_period).replace(/[^0-9-]/g, "")
    const safeType = String(report_type).replace(/_/g, "-")

    // Audit (best-effort)
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
        .maybeSingle()

      if (saved?.id) {
        await client.rpc("log_report_action", {
          p_report_id: saved.id,
          p_action: "downloaded",
          p_actor_id: user.isDemo ? null : user.id,
          p_actor_name: user.isDemo ? "Demo User" : null,
          p_notes: `format=${format}`,
        })
      }
    } catch {
      // Non-fatal
    }

    if (format === "pdf" || format === "html") {
      const client = await createClient()
      const company = await loadCompanyBrand(client, company_id)
      const cols = report.columns || []
      const header = cols.map((c) => `<th>${c.label}</th>`).join("")
      const bodyRows = (report.rows || [])
        .map((r: any) => {
          const cells = cols
            .map((c) => {
              const val = r[c.key]
              if (c.type === "currency" || c.type === "number") {
                return `<td class="right">${money(Number(val || 0))}</td>`
              }
              return `<td>${String(val ?? "")}</td>`
            })
            .join("")
          return `<tr>${cells}</tr>`
        })
        .join("")

      const html = renderBrandedHtmlDocument({
        title: report.report_name || String(report_type),
        company,
        period: report.pay_period,
        subtitle: `${report.row_count} employee row(s)`,
        bodyHtml: `<table><thead><tr>${header}</tr></thead><tbody>${bodyRows}</tbody></table>`,
        autoPrint: true,
      })

      return new NextResponse(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="${safeType}-${safePeriod}.html"`,
          "Cache-Control": "no-store",
        },
      })
    }

    return new NextResponse(report.csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${safeType}-${safePeriod}.csv"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
