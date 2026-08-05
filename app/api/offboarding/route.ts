import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  generateOffboardingInsights,
  getOffboardingOverview,
  processSettlement,
  upsertChecklistItem,
  upsertExitInterview,
  upsertOffboardingAsset,
  upsertOffboardingCase,
} from "@/lib/services/offboarding-ops-service"

/** GET /api/offboarding */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const data = await getOffboardingOverview(ctx.companyId)
    return NextResponse.json({ success: true, ...data, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load offboarding data")
  }
}

/**
 * POST /api/offboarding
 * action: case | asset | checklist | interview | settlement | generate_insights | delete
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
      const result = await generateOffboardingInsights(ctx.companyId)
      return NextResponse.json({ success: true, ...result })
    }
    if (action === "case") {
      const row = await upsertOffboardingCase(ctx.companyId, body)
      return NextResponse.json({ success: true, case: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "asset") {
      const row = await upsertOffboardingAsset(ctx.companyId, body)
      return NextResponse.json({ success: true, asset: row })
    }
    if (action === "checklist") {
      const row = await upsertChecklistItem(ctx.companyId, body)
      return NextResponse.json({ success: true, item: row })
    }
    if (action === "interview") {
      const row = await upsertExitInterview(ctx.companyId, body)
      return NextResponse.json({ success: true, interview: row })
    }
    if (action === "settlement") {
      const row = await processSettlement(ctx.companyId, body)
      return NextResponse.json({ success: true, case: row })
    }
    if (action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })
      const table =
        body.entity === "asset"
          ? "offboarding_assets"
          : body.entity === "interview"
            ? "offboarding_exit_interviews"
            : "offboarding_cases"
      await ctx.service.from(table).delete().eq("id", body.id).eq("company_id", ctx.companyId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Offboarding action failed")
  }
}
