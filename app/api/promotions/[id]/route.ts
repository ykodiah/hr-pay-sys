import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { upsertPromotionCase } from "@/lib/services/promotions-ops-service"

/** PUT /api/promotions/:id — update case (approvals, status, letter) */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const params = await Promise.resolve(context.params)
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const row = await upsertPromotionCase(ctx.companyId, {
      ...body,
      id: body.id || params.id,
    })
    return NextResponse.json({ success: true, data: row })
  } catch (err) {
    return jsonError(err, "Failed to update promotion")
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } },
) {
  try {
    const params = await Promise.resolve(context.params)
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const { data } = await ctx.service
      .from("promotion_cases")
      .select("*")
      .eq("company_id", ctx.companyId)
      .or(`id.eq.${params.id},case_number.eq.${params.id}`)
      .maybeSingle()
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, data })
  } catch (err) {
    return jsonError(err, "Failed to load promotion")
  }
}
