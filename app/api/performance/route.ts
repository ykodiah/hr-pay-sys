import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  generatePerformanceInsights,
  getPerformanceOverview,
  upsertCompetency,
  upsertPerformanceGoal,
  upsertPerformanceReview,
  upsertSuccession,
} from "@/lib/services/performance-ops-service"

/** GET /api/performance — full overview for dashboard */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const data = await getPerformanceOverview(ctx.companyId)
    return NextResponse.json({ success: true, ...data, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load performance data")
  }
}

/**
 * POST /api/performance
 * body.action: goal | review | competency | succession | generate_insights | delete
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
      const result = await generatePerformanceInsights(ctx.companyId)
      return NextResponse.json({ success: true, ...result })
    }

    if (action === "goal") {
      const goal = await upsertPerformanceGoal(ctx.companyId, body)
      return NextResponse.json({ success: true, goal }, { status: body.id ? 200 : 201 })
    }
    if (action === "review") {
      const review = await upsertPerformanceReview(ctx.companyId, body)
      return NextResponse.json({ success: true, review }, { status: body.id ? 200 : 201 })
    }
    if (action === "competency") {
      const competency = await upsertCompetency(ctx.companyId, body)
      return NextResponse.json({ success: true, competency }, { status: body.id ? 200 : 201 })
    }
    if (action === "succession") {
      const plan = await upsertSuccession(ctx.companyId, body)
      return NextResponse.json({ success: true, plan }, { status: body.id ? 200 : 201 })
    }

    if (action === "delete") {
      const table =
        body.entity === "goal"
          ? "performance_goals"
          : body.entity === "review"
            ? "performance_reviews"
            : body.entity === "competency"
              ? "performance_competency_assessments"
              : body.entity === "succession"
                ? "performance_succession"
                : null
      if (!table || !body.id) {
        return NextResponse.json({ error: "entity and id required" }, { status: 400 })
      }
      if (table === "performance_competency_assessments") {
        await ctx.service
          .from(table)
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq("id", body.id)
          .eq("company_id", ctx.companyId)
      } else if (table === "performance_reviews") {
        // Pre-migration rows may lack company_id
        await ctx.service.from(table).delete().eq("id", body.id)
      } else {
        await ctx.service.from(table).delete().eq("id", body.id).eq("company_id", ctx.companyId)
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Performance action failed")
  }
}
