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

    // Pre-validate that report data exists before attempting generation
    const client = await createClient()
    const validationPeriod = pay_period || (payroll_run_id ? null : new Date().toISOString().slice(0, 7))
    
    if (validationPeriod) {
      const { data: dataCheck, error: checkErr } = await client.rpc(
        "validate_report_data_exists",
        { p_company_id: company_id, p_report_type: report_type, p_pay_period: validationPeriod }
      )
      
      if (!checkErr && dataCheck && dataCheck[0]) {
        const validation = dataCheck[0]
        if (!validation.has_data) {
          // Log failed attempt
          try {
            await client.from("compliance_reports").insert({
              company_id,
              payroll_run_id: payroll_run_id || null,
              report_type,
              report_name: `${report_type} (Validation Failed)`,
              pay_period: validationPeriod,
              generated_by: user.isDemo ? null : user.id,
              row_count: 0,
              status: "failed",
              error_message: validation.error_message,
              validation_status: "failed",
            })
          } catch {
            // Non-fatal
          }
          
          return NextResponse.json(
            { 
              error: validation.error_message || "No payroll data available for this period",
              details: "Please process and approve payroll for this period first, then try again.",
            },
            { status: 404 },
          )
        }
      }
    }

    let report;
    try {
      report = await generateReport(
        {
          company_id,
          report_type: report_type as ReportType,
          pay_period,
          payroll_run_id,
          tax_year,
        },
        user.isDemo ? undefined : user.id,
      )
    } catch (err) {
      // Enhanced error capture: distinguish between data and processing issues
      const errorMsg = err instanceof Error ? err.message : "Report generation failed"
      
      try {
        await client.from("compliance_reports").insert({
          company_id,
          payroll_run_id: payroll_run_id || null,
          report_type,
          report_name: `${report_type} (Failed)`,
          pay_period: pay_period || validationPeriod,
          generated_by: user.isDemo ? null : user.id,
          row_count: 0,
          status: "failed",
          error_message: errorMsg,
          validation_status: "failed",
        })
      } catch {
        // Non-fatal
      }
      
      throw err
    }

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
    console.log("[v0] Report download error:", message)
    
    // Return appropriate error based on message
    if (message.includes("No payroll data") || message.includes("Process & approve payroll")) {
      return NextResponse.json(
        { 
          error: "No payroll data found for this period",
          details: "Please process and approve payroll for the requested period first.",
        }, 
        { status: 404 }
      )
    }
    
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
