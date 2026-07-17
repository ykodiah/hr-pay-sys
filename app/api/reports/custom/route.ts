/**
 * GET  /api/reports/custom?company_id=  — list definitions + field catalog
 * POST /api/reports/custom             — save definition and/or run download
 *
 * Body actions:
 *   { action: "save", definition }
 *   { action: "run", company_id, pay_period, definition_id? | definition? }
 */

import { NextRequest, NextResponse } from "next/server"
import { requireApiUser } from "@/lib/auth/api-user"
import {
  CUSTOM_FIELD_CATALOG,
  listCustomDefinitions,
  runCustomReport,
  saveCustomDefinition,
  type CustomReportDefinition,
} from "@/lib/services/reports/custom-report-service"

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const companyId = new URL(req.url).searchParams.get("company_id")
    if (!companyId) {
      return NextResponse.json({ error: "company_id is required" }, { status: 400 })
    }

    const definitions = await listCustomDefinitions(companyId)
    return NextResponse.json({
      success: true,
      catalog: CUSTOM_FIELD_CATALOG,
      definitions,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load custom reports" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const action = body.action as "save" | "run"

    if (action === "save") {
      const definition = body.definition as CustomReportDefinition
      if (!definition?.company_id || !definition?.name || !definition?.columns?.length) {
        return NextResponse.json(
          { error: "definition.company_id, name, and columns are required" },
          { status: 400 },
        )
      }
      const saved = await saveCustomDefinition(definition, user.isDemo ? undefined : user.id)
      return NextResponse.json({ success: true, data: saved })
    }

    if (action === "run") {
      const { company_id, pay_period, definition_id, definition, download, format, filters } = body
      if (!company_id || !pay_period) {
        return NextResponse.json(
          { error: "company_id and pay_period are required" },
          { status: 400 },
        )
      }

      const report = await runCustomReport({
        companyId: company_id,
        payPeriod: pay_period,
        definitionId: definition_id,
        definition,
        filters: filters ?? {},
      })

      if (download) {
        const safeName = report.report_name.replace(/[^a-zA-Z0-9_-]+/g, "-").toLowerCase()
        const fmt = String(format || "csv").toLowerCase()

        if (fmt === "pdf" || fmt === "html") {
          const { loadCompanyBrand, renderBrandedHtmlDocument } = await import("@/lib/exports/company-branding")
          const { createClient } = await import("@/lib/supabase/server")
          const client = await createClient()
          const company = await loadCompanyBrand(client, company_id)
          const cols = report.columns || []

          const money = (n: number) =>
            Number(n || 0).toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

          const headerHtml = cols.map((c: any) => `<th>${c.label}</th>`).join("")
          const bodyHtml = (report.rows || [])
            .map((r: any) => {
              const cells = cols.map((c: any) => {
                const val = r[c.key]
                if (c.type === "currency" || c.type === "number") {
                  return `<td class="right">${typeof val === "number" ? money(val) : String(val ?? "")}</td>`
                }
                return `<td>${String(val ?? "")}</td>`
              }).join("")
              return `<tr>${cells}</tr>`
            })
            .join("")

          const html = renderBrandedHtmlDocument({
            title: report.report_name,
            company,
            period: pay_period,
            subtitle: `${report.row_count} employee row(s)`,
            bodyHtml: `<table><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table>`,
            autoPrint: true,
          })

          return new NextResponse(html, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Content-Disposition": `inline; filename="custom-${safeName}-${pay_period}.html"`,
              "Cache-Control": "no-store",
            },
          })
        }

        return new NextResponse(report.csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="custom-${safeName}-${pay_period}.csv"`,
            "Cache-Control": "no-store",
          },
        })
      }

      return NextResponse.json({ success: true, data: report })
    }

    return NextResponse.json({ error: "action must be save or run" }, { status: 400 })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Custom report failed" },
      { status: 500 },
    )
  }
}
