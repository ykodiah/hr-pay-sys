import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  generatePromotionInsights,
  getPromotionsOverview,
  listPromotionCases,
  loadPromotionEmployeeProfiles,
  loadSalaryGrades,
  upsertPromotionCase,
} from "@/lib/services/promotions-ops-service"

/** GET /api/promotions — cases (+ overview extras) */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const url = new URL(request.url)
    const mode = url.searchParams.get("view")
    if (mode === "overview") {
      const overview = await getPromotionsOverview(ctx.companyId)
      return NextResponse.json({ success: true, ...overview, company_id: ctx.companyId })
    }
    if (mode === "employees") {
      const employees = await loadPromotionEmployeeProfiles(ctx.companyId)
      return NextResponse.json({ success: true, data: employees, employees })
    }
    if (mode === "grades") {
      const grades = await loadSalaryGrades(ctx.companyId)
      return NextResponse.json({ success: true, data: grades, grades })
    }
    const data = await listPromotionCases(ctx.companyId)
    return NextResponse.json({ success: true, data, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load promotions")
  }
}

/**
 * POST /api/promotions
 * - body as PromotionCase → create/upsert
 * - body.action: generate_insights | case | delete
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const action = String(body.action || "").toLowerCase()

    if (action === "generate_insights" || action === "insights") {
      const result = await generatePromotionInsights(ctx.companyId)
      return NextResponse.json({ success: true, ...result })
    }
    if (action === "delete") {
      if (!body.id && !body._dbId) {
        return NextResponse.json({ error: "id required" }, { status: 400 })
      }
      if (body._dbId) {
        await ctx.service.from("promotion_cases").delete().eq("id", body._dbId).eq("company_id", ctx.companyId)
      } else {
        await ctx.service
          .from("promotion_cases")
          .delete()
          .eq("company_id", ctx.companyId)
          .or(`id.eq.${body.id},case_number.eq.${body.id}`)
      }
      return NextResponse.json({ success: true })
    }

    // Default: create/upsert case (supports existing client posting PromotionCase)
    const row = await upsertPromotionCase(ctx.companyId, body.action === "case" ? body : body)
    return NextResponse.json({ success: true, data: row }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Promotion action failed")
  }
}
