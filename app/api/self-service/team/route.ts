import { NextRequest, NextResponse } from "next/server"
import {
  isPortalError,
  logPortalActivity,
  portalJsonError,
  requirePortalSession,
} from "@/lib/self-service/portal-session"
import {
  computeLeavePay,
  debitLeaveBalance,
  markAttendanceLeave,
  syncLeavePayToPayroll,
} from "@/lib/services/leave-ops-service"
import { finalizeApprovedOvertime } from "@/lib/services/overtime-payroll-service"

export const dynamic = "force-dynamic"

async function managedEmployeeIds(session: any) {
  const ids = new Set<string>()
  const { data: direct } = await session.db
    .from("employees")
    .select("id")
    .eq("company_id", session.companyId)
    .or(`direct_supervisor.eq.${session.employeeId},head_of_department.eq.${session.employeeId}`)
  for (const row of direct || []) ids.add(row.id)

  const { data: lines } = await session.db
    .from("approval_authority_lines")
    .select("employee_id")
    .eq("company_id", session.companyId)
    .eq("approver_employee_id", session.employeeId)
    .eq("is_active", true)
  for (const row of lines || []) ids.add(row.employee_id)
  return [...ids]
}

export async function GET() {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const ids = await managedEmployeeIds(session)
    if (!ids.length) return NextResponse.json({ team: [], leave: [], overtime: [], loans: [], documents: [] })

    const [teamRes, leaveRes, overtimeRes, loansRes, documentsRes] = await Promise.all([
      session.db
        .from("employees")
        .select("id, employee_id, first_name, last_name, full_name, position, department, status, corporate_email, phone")
        .eq("company_id", session.companyId)
        .in("id", ids)
        .order("first_name"),
      session.db
        .from("leave_requests")
        .select("*")
        .eq("company_id", session.companyId)
        .in("employee_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      session.db
        .from("overtime_requests")
        .select("*")
        .eq("company_id", session.companyId)
        .in("employee_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      session.db
        .from("employee_loans")
        .select("*")
        .eq("company_id", session.companyId)
        .in("employee_id", ids)
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      session.db
        .from("document_vault")
        .select("*")
        .eq("company_id", session.companyId)
        .in("employee_id", ids)
        .contains("submitted_to_roles", ["manager"])
        .order("upload_date", { ascending: false }),
    ])
    const team = teamRes.data || []
    const names = new Map(
      team.map((person: any) => [
        person.id,
        person.full_name || `${person.first_name || ""} ${person.last_name || ""}`.trim(),
      ]),
    )
    const label = (rows: any[] | null) =>
      (rows || []).map((row: any) => ({ ...row, employee_name: names.get(row.employee_id) || "Employee" }))
    return NextResponse.json({
      team,
      leave: label(leaveRes.data),
      overtime: label(overtimeRes.data),
      loans: label(loansRes.data),
      documents: label(documentsRes.data),
      permissions: session.account?.approval_permissions || [],
    })
  } catch (err) {
    return portalJsonError(err, "Failed to load team workspace")
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requirePortalSession()
  if (isPortalError(session)) return session

  try {
    const body = await req.json().catch(() => ({}))
    const type = String(body.type || "")
    const action = String(body.action || "")
    const id = String(body.id || "")
    if (!id || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Record and decision are required" }, { status: 400 })
    }

    const ids = await managedEmployeeIds(session)
    const table =
      type === "leave"
        ? "leave_requests"
        : type === "overtime"
          ? "overtime_requests"
          : type === "loan"
            ? "employee_loans"
            : ""
    if (!table) return NextResponse.json({ error: "Unsupported approval type" }, { status: 400 })
    const { data: existing } = await session.db
      .from(table)
      .select("*")
      .eq("id", id)
      .eq("company_id", session.companyId)
      .maybeSingle()
    if (!existing || !ids.includes(existing.employee_id)) {
      return NextResponse.json({ error: "This request is outside your authority line" }, { status: 403 })
    }

    if (action === "reject") {
      const { error } = await session.db
        .from(table)
        .update({
          status: "rejected",
          approval_status: type === "loan" ? "rejected" : undefined,
          rejection_reason: String(body.reason || "").trim() || null,
          rejected_by: session.employeeId,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", session.companyId)
      if (error) throw new Error(error.message)
    } else if (type === "overtime") {
      await finalizeApprovedOvertime({
        companyId: session.companyId,
        requestId: id,
        hoursApproved: Number(body.hours_approved ?? existing.hours_requested ?? 0),
        userId: session.user.id,
      })
    } else if (type === "leave") {
      const pay = await computeLeavePay({
        service: session.db,
        companyId: session.companyId,
        employeeId: existing.employee_id,
        leaveTypeId: existing.leave_type_id,
        startDate: existing.start_date,
        endDate: existing.end_date,
        daysRequested: existing.days_requested,
      })
      await session.db
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: session.employeeId,
          approved_at: new Date().toISOString(),
          is_paid_leave: pay.is_paid,
          pay_mode_applied: pay.pay_mode,
          paid_amount: pay.paid_amount,
          unpaid_deduction: pay.unpaid_deduction,
          leave_allowance_amount: pay.leave_allowance_amount,
          leave_pay_formula: pay.formula,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", session.companyId)
      await markAttendanceLeave(session.db, session.companyId, existing.employee_id, existing.start_date, existing.end_date)
      await debitLeaveBalance(session.db, session.companyId, existing.employee_id, existing.leave_type_id, pay.days)
      if (pay.unpaid_deduction > 0 || pay.leave_allowance_amount > 0) {
        await syncLeavePayToPayroll({
          service: session.db,
          companyId: session.companyId,
          employeeId: existing.employee_id,
          leaveRequestId: id,
          leaveTypeId: existing.leave_type_id,
          startDate: existing.start_date,
          unpaidDeduction: pay.unpaid_deduction,
          leaveAllowance: pay.leave_allowance_amount,
          leaveAllowanceType: pay.leave_allowance_type,
        })
      }
    } else {
      const expected = Number(existing.expected_total_payment || 0)
      const total = expected > 0 ? expected : Number(existing.principal || 0) + Number(existing.total_interest || 0)
      const { error } = await session.db
        .from("employee_loans")
        .update({
          status: "active",
          approval_status: "approved",
          approved_by: session.employeeId,
          approved_at: new Date().toISOString(),
          disbursed_at: new Date().toISOString(),
          remaining_balance: total,
          outstanding_balance: total,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", session.companyId)
      if (error) throw new Error(error.message)
    }

    await logPortalActivity(session, `${type}_${action}`, id, { reason: body.reason || null })
    return NextResponse.json({ success: true })
  } catch (err) {
    return portalJsonError(err, "Could not process approval")
  }
}
