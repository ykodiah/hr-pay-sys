import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import { finalizeApprovedOvertime } from "@/lib/services/overtime-payroll-service"

/**
 * PATCH /api/overtime/[id]
 * Approve → compute earned amount + queue for month-end payroll.
 * Reject → store reason. All writes company-scoped.
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
      .eq("company_id", companyId)
      .maybeSingle()

    if (fetchErr) throw new Error(fetchErr.message)
    if (!existing) {
      return NextResponse.json({ error: "Overtime request not found" }, { status: 404 })
    }

    if (action === "approve" || action === "approved") {
      const approvedHours =
        hours_approved != null && hours_approved !== ""
          ? Number(hours_approved)
          : Number(existing.hours_requested || 0)

      const result = await finalizeApprovedOvertime({
        companyId,
        requestId: id,
        hoursApproved: approvedHours,
        userId,
      })

      return NextResponse.json({
        success: true,
        message: "Overtime approved and queued for month-end payroll",
        request: result.request,
        earnings: result.earnings,
        warning: (result as any).warning,
        next_step:
          "At month-end, open Overtime → Monthly report and click Sync to Pay Inputs, then process payroll.",
      })
    }

    if (action === "reject" || action === "rejected") {
      const { data, error } = await service
        .from("overtime_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          payroll_status: "excluded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single()

      if (error && /column|does not exist/i.test(error.message)) {
        const retry = await service
          .from("overtime_requests")
          .update({
            status: "rejected",
            rejection_reason: rejection_reason ?? null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("company_id", companyId)
          .select()
          .single()
        if (retry.error) throw new Error(retry.error.message)
        return NextResponse.json({ success: true, message: "Overtime rejected", request: retry.data })
      }
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Overtime rejected", request: data })
    }

    return NextResponse.json({ error: "Invalid action. Use: approve | reject" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to update overtime request")
  }
}
