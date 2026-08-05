import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  generateDisciplinaryInsights,
  getDisciplinaryOverview,
  upsertDisciplinaryAction,
  upsertDisciplinaryCase,
  upsertGrievance,
} from "@/lib/services/disciplinary-ops-service"

/** GET /api/disciplinary — cases, grievances, actions, AI insights */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const data = await getDisciplinaryOverview(ctx.companyId)
    return NextResponse.json({ success: true, ...data, company_id: ctx.companyId })
  } catch (err) {
    return jsonError(err, "Failed to load disciplinary data")
  }
}

/**
 * POST /api/disciplinary
 * action: case | action | grievance | generate_insights | update_status | delete
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
      const result = await generateDisciplinaryInsights(ctx.companyId)
      return NextResponse.json({ success: true, ...result })
    }

    if (action === "case") {
      const row = await upsertDisciplinaryCase(ctx.companyId, body)
      return NextResponse.json({ success: true, case: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "action") {
      const row = await upsertDisciplinaryAction(ctx.companyId, body)
      return NextResponse.json({ success: true, action: row }, { status: body.id ? 200 : 201 })
    }
    if (action === "grievance") {
      const row = await upsertGrievance(ctx.companyId, body)
      return NextResponse.json({ success: true, grievance: row }, { status: body.id ? 200 : 201 })
    }

    if (action === "update_status") {
      const entity = String(body.entity || "case")
      const table = entity === "grievance" ? "grievances" : "disciplinary_cases"
      if (!body.id || !body.status) {
        return NextResponse.json({ error: "id and status required" }, { status: 400 })
      }
      const patch: Record<string, any> = {
        status: body.status === "submitted" ? "filed" : body.status,
        updated_at: new Date().toISOString(),
      }
      if (["resolved", "closed"].includes(String(body.status))) {
        if (table === "grievances") patch.resolved_at = new Date().toISOString()
        if (table === "disciplinary_cases" && body.resolution) patch.resolution = body.resolution
      }
      const { data, error } = await ctx.service
        .from(table)
        .update(patch)
        .eq("id", body.id)
        .eq("company_id", ctx.companyId)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, data })
    }

    if (action === "delete") {
      const entity = String(body.entity || "case")
      const table =
        entity === "grievance"
          ? "grievances"
          : entity === "action"
            ? "disciplinary_actions"
            : "disciplinary_cases"
      if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 })
      await ctx.service.from(table).delete().eq("id", body.id).eq("company_id", ctx.companyId)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Disciplinary action failed")
  }
}
