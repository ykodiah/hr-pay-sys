import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import {
  daysBetweenInclusive,
  debitLeaveBalance,
  markAttendanceLeave,
} from "@/lib/services/leave-ops-service"

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get("employee_id")
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    let query = service
      .from("leave_requests")
      .select(`
        *,
        employees!leave_requests_employee_id_fkey(
          first_name, last_name, employee_id, department, position, company_id
        ),
        leave_types!leave_requests_leave_type_id_fkey(name, code, entitlement_amount)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (status) query = query.eq("status", status)
    if (from) query = query.gte("start_date", from)
    if (to) query = query.lte("end_date", to)

    const { data, error } = await query
    if (error) {
      let fallback = service
        .from("leave_requests")
        .select(`
          *,
          employees!leave_requests_employee_id_fkey(
            first_name, last_name, employee_id, department, position, company_id
          ),
          leave_types!leave_requests_leave_type_id_fkey(name, code, entitlement_amount)
        `)
        .order("created_at", { ascending: false })
      if (employee_id) fallback = fallback.eq("employee_id", employee_id)
      if (status) fallback = fallback.eq("status", status)
      const fb = await fallback
      if (fb.error) throw new Error(fb.error.message)
      const rows = (fb.data ?? []).filter(
        (r: any) => r.employees?.company_id === companyId || r.company_id === companyId,
      )
      const mapped = rows.map((r: any) => ({
        ...r,
        employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
        employee_id_no: r.employees?.employee_id ?? null,
        department: r.employees?.department ?? null,
        position: r.employees?.position ?? null,
        leave_type_name: r.leave_types?.name ?? r.leave_type_name ?? null,
      }))
      return NextResponse.json({ requests: mapped, company_id: companyId })
    }

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
      employee_id_no: r.employees?.employee_id ?? null,
      department: r.employees?.department ?? null,
      position: r.employees?.position ?? null,
      leave_type_name: r.leave_types?.name ?? r.leave_type_name ?? null,
    }))

    const { data: types } = await service
      .from("leave_types")
      .select("id, name, code, entitlement_amount, is_active")
      .eq("company_id", companyId)
      .eq("is_active", true)
      .order("name")

    return NextResponse.json({ requests: mapped, leave_types: types ?? [], company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to load leave requests")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service, userId } = ctx

    const { employee_id, leave_type_id, leave_type_name, start_date, end_date, reason } = body
    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: "employee_id, start_date, end_date required" }, { status: 400 })
    }

    const { data: emp } = await service
      .from("employees")
      .select("id, company_id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!emp?.id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 403 })
    }

    const days =
      body.days_requested != null
        ? Number(body.days_requested)
        : daysBetweenInclusive(start_date, end_date)

    const autoApprove = body.auto_approve === true || body.status === "approved"
    const initiatedBy = body.initiated_by || "admin"

    let typeName = leave_type_name || null
    if (!typeName && leave_type_id) {
      const { data: lt } = await service.from("leave_types").select("name").eq("id", leave_type_id).maybeSingle()
      typeName = lt?.name || null
    }

    const insertRow: Record<string, any> = {
      employee_id,
      company_id: companyId,
      leave_type_id: leave_type_id ?? null,
      leave_type_name: typeName,
      start_date,
      end_date,
      days_requested: days,
      reason: reason ?? null,
      status: autoApprove ? "approved" : "pending",
      initiated_by: initiatedBy,
      initiated_by_user_id: userId,
      notes: body.notes ?? null,
    }

    if (autoApprove) {
      insertRow.approved_by = userId
      insertRow.approved_at = new Date().toISOString()
    }

    const { data, error } = await service.from("leave_requests").insert(insertRow).select().single()
    if (error) throw new Error(error.message)

    if (autoApprove) {
      try {
        await markAttendanceLeave(service, companyId, employee_id, start_date, end_date)
        await debitLeaveBalance(service, companyId, employee_id, leave_type_id, days)
      } catch (e) {
        console.warn("[leave] post-approve side effects:", e)
      }
    }

    return NextResponse.json({ request: data }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create leave request")
  }
}
