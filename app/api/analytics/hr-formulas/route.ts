import { NextRequest, NextResponse } from "next/server"
import {
  resolveTenantContext,
  jsonError,
  isUnresolvedTenant,
} from "@/lib/settings/resolve-tenant"
import {
  categoryReportToCsv,
  computeHrFormulaReports,
  persistHrFormulaReport,
} from "@/lib/services/hr-formula-reports"

function defaultPeriod() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { searchParams } = request.nextUrl
    const defaults = defaultPeriod()
    const periodStart = searchParams.get("period_start") || defaults.periodStart
    const periodEnd = searchParams.get("period_end") || defaults.periodEnd
    const categoryId = searchParams.get("category") || undefined
    const format = searchParams.get("format")

    const bundle = await computeHrFormulaReports({
      companyId: ctx.companyId,
      periodStart,
      periodEnd,
      categoryId,
    })

    if (format === "csv" && categoryId) {
      const category = bundle.categories[0]
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      const csv = categoryReportToCsv(category, periodStart, periodEnd)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="hr-${categoryId}-${periodStart}.csv"`,
        },
      })
    }

    return NextResponse.json(bundle)
  } catch (error) {
    console.error("[hr-formulas] GET error:", error)
    return jsonError(error, "Failed to compute HR formula reports")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const defaults = defaultPeriod()
    const periodStart = body.period_start || defaults.periodStart
    const periodEnd = body.period_end || defaults.periodEnd
    const categoryId = body.category || undefined
    const persist = body.persist !== false

    const bundle = await computeHrFormulaReports({
      companyId: ctx.companyId,
      periodStart,
      periodEnd,
      categoryId,
    })

    let runId: string | null = null
    if (persist) {
      try {
        const saved = await persistHrFormulaReport(bundle, {
          categoryId,
          userId: ctx.userId,
        })
        runId = saved.runId
      } catch (err) {
        // Still return computed report if persist tables are missing
        console.warn("[hr-formulas] persist skipped:", err)
      }
    }

    return NextResponse.json({ ...bundle, runId })
  } catch (error) {
    console.error("[hr-formulas] POST error:", error)
    return jsonError(error, "Failed to generate HR formula report")
  }
}
