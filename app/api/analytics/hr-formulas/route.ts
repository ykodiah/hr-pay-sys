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
import { buildCategoryAiMlInsights } from "@/lib/services/hr-formula-ai-insights"
import { renderHrFormulaReportPdfHtml } from "@/lib/services/hr-formula-report-pdf"
import { loadCompanyBrand } from "@/lib/exports/company-branding"

function defaultPeriod() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: end.toISOString().slice(0, 10),
  }
}

async function persistInsights(input: {
  companyId: string
  runId?: string | null
  insights: Awaited<ReturnType<typeof buildCategoryAiMlInsights>>
  service: any
}) {
  try {
    if (input.runId) {
      await input.service
        .from("hr_formula_report_runs")
        .update({
          health_score: input.insights.healthScore,
          health_label: input.insights.healthLabel,
          executive_brief: input.insights.executiveBrief,
          ai_narrative: input.insights.narrative,
          ml_model: input.insights.mlModel,
          ai_model: input.insights.aiModel,
          insights_json: input.insights,
          export_formats: ["csv", "pdf"],
        })
        .eq("id", input.runId)
    }

    await input.service.from("hr_formula_ai_insights").insert({
      run_id: input.runId || null,
      company_id: input.companyId,
      category_id: input.insights.categoryId,
      period_start: input.insights.periodStart,
      period_end: input.insights.periodEnd,
      health_score: input.insights.healthScore,
      health_label: input.insights.healthLabel,
      executive_brief: input.insights.executiveBrief,
      narrative: input.insights.narrative,
      blocks: input.insights.blocks,
      ml_model: input.insights.mlModel,
      ai_model: input.insights.aiModel,
      source: input.insights.source,
      generated_at: input.insights.generatedAt,
    })
  } catch (err) {
    console.warn("[hr-formulas] insight persist skipped:", err)
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
    const includeAi = searchParams.get("include_ai") !== "0"
    const withInsights = searchParams.get("insights") === "1" || format === "pdf"

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

    if (format === "pdf") {
      const category = categoryId
        ? bundle.categories[0]
        : bundle.categories[0]
      if (!category) {
        return NextResponse.json({ error: "Category not found" }, { status: 404 })
      }
      const insights = await buildCategoryAiMlInsights({
        category,
        periodStart,
        periodEnd,
        includeAi,
      })
      const company = await loadCompanyBrand(ctx.service, ctx.companyId)
      const html = renderHrFormulaReportPdfHtml({
        category,
        insights,
        company,
        periodStart,
        periodEnd,
      })
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `inline; filename="hr-${category.id}-${periodStart}.pdf.html"`,
        },
      })
    }

    if (withInsights && categoryId && bundle.categories[0]) {
      const insights = await buildCategoryAiMlInsights({
        category: bundle.categories[0],
        periodStart,
        periodEnd,
        includeAi,
      })
      return NextResponse.json({ ...bundle, insights })
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
    const includeAi = body.include_ai !== false
    const wantInsights = body.insights !== false

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
        console.warn("[hr-formulas] persist skipped:", err)
      }
    }

    let insights = null
    if (wantInsights && bundle.categories[0]) {
      insights = await buildCategoryAiMlInsights({
        category: bundle.categories[0],
        periodStart,
        periodEnd,
        includeAi,
      })
      if (persist) {
        await persistInsights({
          companyId: ctx.companyId,
          runId,
          insights,
          service: ctx.service,
        })
      }
    }

    return NextResponse.json({ ...bundle, runId, insights })
  } catch (error) {
    console.error("[hr-formulas] POST error:", error)
    return jsonError(error, "Failed to generate HR formula report")
  }
}
