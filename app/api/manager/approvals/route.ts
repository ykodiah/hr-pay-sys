import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError, isUnresolvedTenant } from "@/lib/settings/resolve-tenant"
import {
  getTeamEmployeeIds,
  resolveCurrentEmployee,
} from "@/lib/services/manager-team-service"
import {
  computeLeavePay,
  debitLeaveBalance,
  markAttendanceLeave,
  syncLeavePayToPayroll,
} from "@/lib/services/leave-ops-service"
import { finalizeApprovedOvertime } from "@/lib/services/overtime-payroll-service"

async function assertTeamMember(
  service: any,
  companyId: string,
  userId: string | null,
  employeeId: string,
  allowAdminBypass: boolean,
) {
  const me = await resolveCurrentEmployee(service, companyId, userId)
  if (!me?.id) {
    if (allowAdminBypass) return { ok: true, me: null, admin: true }
    return { ok: false, me: null, admin: false }
  }
  const ids = await getTeamEmployeeIds(service, companyId, me.id)
  if (!ids.includes(employeeId) && me.id !== employeeId) {
    return { ok: false, me, admin: false }
  }
  return { ok: true, me, admin: false }
}

/** GET /api/manager/approvals?type=leave|overtime */
export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const type = request.nextUrl.searchParams.get("type") || "leave"
    const status = request.nextUrl.searchParams.get("status") || "pending"
    const me = await resolveCurrentEmployee(ctx.service, ctx.companyId, ctx.userId)

    let teamIds: string[] = []
    if (me?.id) {
      teamIds = await getTeamEmployeeIds(ctx.service, ctx.companyId, me.id)
    }

    if (type === "overtime") {
      let query = ctx.service
        .from("overtime_requests")
        .select(
          `*, employees!overtime_requests_employee_id_fkey(id, first_name, last_name, employee_id, department)`,
        )
        .eq("company_id", ctx.companyId)
        .order("date", { ascending: false })
        .limit(100)
      if (status !== "all") query = query.eq("status", status)
      if (teamIds.length) query = query.in("employee_id", teamIds)

      const { data, error } = await query
      if (error) throw new Error(error.message)
      const requests = (data || []).map((r: any) => ({
        ...r,
        employee_name: r.employees
          ? `${r.employees.first_name || ""} ${r.employees.last_name || ""}`.trim()
          : null,
        hours: Number(r.hours_approved ?? r.hours_requested ?? 0),
      }))
      return NextResponse.json({
        type: "overtime",
        requests,
        manager: me,
        scoped: Boolean(teamIds.length),
      })
    }

    let query = ctx.service
      .from("leave_requests")
      .select(
        `*, employees!leave_requests_employee_id_fkey(id, first_name, last_name, employee_id, department), leave_types(name, code)`,
      )
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(100)
    if (status !== "all") query = query.eq("status", status)
    if (teamIds.length) query = query.in("employee_id", teamIds)

    const { data, error } = await query
    if (error) {
      // fallback without embeds
      let fb = ctx.service
        .from("leave_requests")
        .select("*")
        .eq("company_id", ctx.companyId)
        .order("created_at", { ascending: false })
        .limit(100)
      if (status !== "all") fb = fb.eq("status", status)
      if (teamIds.length) fb = fb.in("employee_id", teamIds)
      const res = await fb
      if (res.error) throw new Error(res.error.message)
      return NextResponse.json({ type: "leave", requests: res.data || [], manager: me, scoped: Boolean(teamIds.length) })
    }

    const requests = (data || []).map((r: any) => ({
      ...r,
      employee_name: r.employees
        ? `${r.employees.first_name || ""} ${r.employees.last_name || ""}`.trim()
        : null,
      leave_type_name: r.leave_types?.name || null,
    }))

    return NextResponse.json({
      type: "leave",
      requests,
      manager: me,
      scoped: Boolean(teamIds.length),
    })
  } catch (err) {
    return jsonError(err, "Failed to load manager approvals")
  }
}

/** PATCH /api/manager/approvals — approve/reject leave or OT for team only */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) {
      return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    }

    const type = String(body.type || "leave").toLowerCase()
    const action = String(body.action || "").toLowerCase()
    const id = body.id
    if (!id || !action) {
      return NextResponse.json({ error: "id and action required" }, { status: 400 })
    }

    if (type === "overtime") {
      const { data: existing } = await ctx.service
        .from("overtime_requests")
        .select("*")
        .eq("id", id)
        .eq("company_id", ctx.companyId)
        .maybeSingle()
      if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

      const gate = await assertTeamMember(
        ctx.service,
        ctx.companyId,
        ctx.userId,
        existing.employee_id,
        true,
      )
      if (!gate.ok && !gate.admin) {
        return NextResponse.json({ error: "Not authorized for this team member" }, { status: 403 })
      }

      if (action === "approve" || action === "approved") {
        const result = await finalizeApprovedOvertime({
          companyId: ctx.companyId,
          requestId: id,
          hoursApproved: Number(body.hours_approved ?? existing.hours_requested ?? 0),
          userId: ctx.userId,
        })
        return NextResponse.json({ success: true, type: "overtime", ...result })
      }
      if (action === "reject" || action === "rejected") {
        const { data, error } = await ctx.service
          .from("overtime_requests")
          .update({
            status: "rejected",
            rejection_reason: body.rejection_reason || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .eq("company_id", ctx.companyId)
          .select()
          .single()
        if (error) throw new Error(error.message)
        return NextResponse.json({ success: true, type: "overtime", request: data })
      }
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // leave
    const { data: existing } = await ctx.service
      .from("leave_requests")
      .select("*")
      .eq("id", id)
      .eq("company_id", ctx.companyId)
      .maybeSingle()
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const gate = await assertTeamMember(
      ctx.service,
      ctx.companyId,
      ctx.userId,
      existing.employee_id,
      true,
    )
    if (!gate.ok && !gate.admin) {
      return NextResponse.json({ error: "Not authorized for this team member" }, { status: 403 })
    }

    if (action === "approve" || action === "approved") {
      const pay = await computeLeavePay({
        service: ctx.service,
        companyId: ctx.companyId,
        employeeId: existing.employee_id,
        leaveTypeId: existing.leave_type_id,
        startDate: existing.start_date,
        endDate: existing.end_date,
        daysRequested: existing.days_requested,
      })
      await ctx.service
        .from("leave_requests")
        .update({
          status: "approved",
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_paid_leave: pay.is_paid,
          pay_mode_applied: pay.pay_mode,
          paid_amount: pay.paid_amount,
          unpaid_deduction: pay.unpaid_deduction,
          leave_allowance_amount: pay.leave_allowance_amount,
          leave_pay_formula: pay.formula,
        })
        .eq("id", id)
        .eq("company_id", ctx.companyId)

      await markAttendanceLeave(
        ctx.service,
        ctx.companyId,
        existing.employee_id,
        existing.start_date,
        existing.end_date,
      )
      await debitLeaveBalance(
        ctx.service,
        ctx.companyId,
        existing.employee_id,
        existing.leave_type_id,
        pay.days,
      )
      if (pay.unpaid_deduction > 0 || pay.leave_allowance_amount > 0) {
        await syncLeavePayToPayroll({
          service: ctx.service,
          companyId: ctx.companyId,
          employeeId: existing.employee_id,
          leaveRequestId: id,
          leaveTypeId: existing.leave_type_id,
          startDate: existing.start_date,
          unpaidDeduction: pay.unpaid_deduction,
          leaveAllowance: pay.leave_allowance_amount,
          leaveAllowanceType: pay.leave_allowance_type,
        })
      }
      return NextResponse.json({ success: true, type: "leave", leave_pay: pay })
    }

    if (action === "reject" || action === "rejected") {
      const { error } = await ctx.service
        .from("leave_requests")
        .update({
          status: "rejected",
          rejection_reason: body.rejection_reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", ctx.companyId)
      if (error) throw new Error(error.message)
      return NextResponse.json({ success: true, type: "leave" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (err) {
    return jsonError(err, "Failed to process manager approval")
  }
}
