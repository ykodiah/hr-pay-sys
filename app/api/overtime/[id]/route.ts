import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"

/**
 * PATCH /api/overtime/[id]
 * Approve or reject overtime using service client (avoids RLS / auth.users FK failures).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { companyId, service, userId } = ctx
    const { hours_approved, rejection_reason } = body
    const action = String(body.action || "").toLowerCase()
    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 })
    }

    const { data: existing, error: fetchErr } = await service
      .from("overtime_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr) throw new Error(fetchErr.message)
    if (!existing) {
      return NextResponse.json({ error: "Overtime request not found" }, { status: 404 })
    }
    if (existing.company_id && existing.company_id !== companyId) {
      return NextResponse.json({ error: "Overtime request not found" }, { status: 404 })
    }

    if (action === "approve" || action === "approved") {
      const approvedHours =
        hours_approved != null && hours_approved !== ""
          ? Number(hours_approved)
          : Number(existing.hours_requested || 0)

      const update: Record<string, any> = {
        status: "approved",
        hours_approved: approvedHours,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      // Only set approved_by when we have a real user id (avoid brittle auth.users FK)
      if (userId && !String(userId).startsWith("demo-")) {
        update.approved_by = userId
      }

      const { data, error } = await service
        .from("overtime_requests")
        .update(update)
        .eq("id", id)
        .select()
        .single()

      if (error) {
        // Retry without approved_by if FK fails
        if (/foreign key|approved_by/i.test(error.message)) {
          delete update.approved_by
          const retry = await service
            .from("overtime_requests")
            .update(update)
            .eq("id", id)
            .select()
            .single()
          if (retry.error) throw new Error(retry.error.message)
          return NextResponse.json({ success: true, message: "Overtime approved", request: retry.data })
        }
        throw new Error(error.message)
      }
      return NextResponse.json({ success: true, message: "Overtime approved", request: data })
    }

    if (action === "reject" || action === "rejected") {
      const { data, error } = await service
        .from("overtime_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Overtime rejected", request: data })
    }

    return NextResponse.json({ error: "Invalid action. Use: approve | reject" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to update overtime request")
  }
}
