import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  computeLeavePay,
  debitLeaveBalance,
  markAttendanceLeave,
  syncLeaveDeductionToPayroll,
} from "@/lib/services/leave-ops-service"

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }
    const { companyId, service, userId } = ctx
    const { action, rejection_reason } = body
    if (!action) return NextResponse.json({ error: "action required" }, { status: 400 })

    const { data: existing } = await service
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .maybeSingle()

    if (!existing) return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    if (existing.company_id && existing.company_id !== companyId) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 })
    }

    if (action === "approve") {
      const pay = await computeLeavePay({
        service,
        companyId,
        employeeId: existing.employee_id,
        leaveTypeId: existing.leave_type_id,
        startDate: existing.start_date,
        endDate: existing.end_date,
        daysRequested: existing.days_requested,
      })

      const update: Record<string, any> = {
        status: "approved",
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_paid_leave: pay.is_paid,
        payment_percentage_applied: pay.payment_percentage,
        daily_rate_used: pay.daily_rate,
        paid_amount: pay.paid_amount,
        unpaid_deduction: pay.unpaid_deduction,
        days_requested: pay.days,
      }
      if (userId && !String(userId).startsWith("demo-")) update.approved_by = userId

      let { error } = await service.from("leave_requests").update(update).eq("id", id).eq("company_id", companyId)
      if (error && /column|does not exist|foreign key|approved_by/i.test(error.message)) {
        const minimal: Record<string, any> = {
          status: "approved",
          approved_at: update.approved_at,
          updated_at: update.updated_at,
        }
        const retry = await service.from("leave_requests").update(minimal).eq("id", id)
        error = retry.error
      }
      if (error) throw new Error(error.message)

      try {
        await markAttendanceLeave(
          service,
          companyId,
          existing.employee_id,
          existing.start_date,
          existing.end_date,
        )
        await debitLeaveBalance(
          service,
          companyId,
          existing.employee_id,
          existing.leave_type_id,
          Number(pay.days || 0),
        )
        if (pay.unpaid_deduction > 0) {
          await syncLeaveDeductionToPayroll({
            service,
            companyId,
            employeeId: existing.employee_id,
            startDate: existing.start_date,
            unpaidDeduction: pay.unpaid_deduction,
          })
        }
      } catch (e) {
        console.warn("[leave] approve side effects:", e)
      }

      return NextResponse.json({
        success: true,
        message: "Leave request approved",
        leave_pay: pay,
      })
    }

    if (action === "reject") {
      const { error } = await service
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: rejection_reason ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Leave request rejected" })
    }

    if (action === "cancel") {
      const { error } = await service
        .from("leave_requests")
        .update({
          status: "cancelled",
          cancelled_by: userId,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .in("status", ["pending", "approved"])
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, message: "Leave request cancelled" })
    }

    return NextResponse.json({ error: "Invalid action. Use: approve | reject | cancel" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to update leave request")
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const { data, error } = await ctx.service
      .from("leave_requests")
      .select(
        `*, employees!leave_requests_employee_id_fkey(first_name,last_name,employee_id,department,position), leave_types!leave_requests_leave_type_id_fkey(name)`,
      )
      .eq("id", id)
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ request: data })
  } catch (err) {
    return jsonError(err, "Failed to load leave request")
  }
}
