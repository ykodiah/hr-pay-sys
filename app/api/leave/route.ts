import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

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
        leave_types!leave_requests_leave_type_id_fkey(name)
      `)
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (status) query = query.eq("status", status)
    if (from) query = query.gte("start_date", from)
    if (to) query = query.lte("end_date", to)

    const { data, error } = await query
    if (error) {
      // Fallback: filter via employee.company_id when leave_requests.company_id missing
      let fallback = service
        .from("leave_requests")
        .select(`
          *,
          employees!leave_requests_employee_id_fkey(
            first_name, last_name, employee_id, department, position, company_id
          ),
          leave_types!leave_requests_leave_type_id_fkey(name)
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

    return NextResponse.json({ requests: mapped, company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to load leave requests")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { employee_id, leave_type_id, leave_type_name, start_date, end_date, days_requested, reason } = body
    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: "employee_id, start_date, end_date required" }, { status: 400 })
    }

    // Ensure employee belongs to this tenant
    const { data: emp } = await service
      .from("employees")
      .select("id, company_id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!emp?.id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 403 })
    }

    const { data, error } = await service
      .from("leave_requests")
      .insert({
        employee_id,
        company_id: companyId,
        leave_type_id: leave_type_id ?? null,
        leave_type_name: leave_type_name ?? null,
        start_date,
        end_date,
        days_requested: days_requested ?? null,
        reason: reason ?? null,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create leave request")
  }
}
