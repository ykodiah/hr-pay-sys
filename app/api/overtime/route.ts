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
      .from("overtime_requests")
      .select(`
        *,
        employees!overtime_requests_employee_id_fkey(first_name, last_name, employee_id, department, position, company_id),
        overtime_rates!overtime_requests_rate_type_id_fkey(rate_type, multiplier, description)
      `)
      .eq("company_id", companyId)
      .order("date", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (status) query = query.eq("status", status)
    if (from) query = query.gte("date", from)
    if (to) query = query.lte("date", to)

    const { data, error } = await query
    if (error) {
      // Fallback filter via employee.company_id
      let fallback = service
        .from("overtime_requests")
        .select(`
          *,
          employees!overtime_requests_employee_id_fkey(first_name, last_name, employee_id, department, position, company_id),
          overtime_rates!overtime_requests_rate_type_id_fkey(rate_type, multiplier, description)
        `)
        .order("date", { ascending: false })
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
        rate_type: r.overtime_rates?.rate_type ?? null,
        multiplier: r.overtime_rates?.multiplier ?? 1.5,
      }))
      return NextResponse.json({ requests: mapped, company_id: companyId })
    }

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
      employee_id_no: r.employees?.employee_id ?? null,
      department: r.employees?.department ?? null,
      position: r.employees?.position ?? null,
      rate_type: r.overtime_rates?.rate_type ?? null,
      multiplier: r.overtime_rates?.multiplier ?? 1.5,
    }))

    return NextResponse.json({ requests: mapped, company_id: companyId })
  } catch (err) {
    return jsonError(err, "Failed to load overtime requests")
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { employee_id, date, hours_requested, reason } = body
    if (!employee_id || !date || !hours_requested) {
      return NextResponse.json(
        { error: "employee_id, date, hours_requested required" },
        { status: 400 },
      )
    }

    const { data: emp } = await service
      .from("employees")
      .select("id")
      .eq("id", employee_id)
      .eq("company_id", companyId)
      .maybeSingle()
    if (!emp?.id) {
      return NextResponse.json({ error: "Employee not found in your company" }, { status: 403 })
    }

    const { data, error } = await service
      .from("overtime_requests")
      .insert({
        employee_id,
        company_id: companyId,
        date,
        hours_requested: Number(hours_requested),
        reason: reason ?? null,
        status: "pending",
        requested_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (err) {
    return jsonError(err, "Failed to create overtime request")
  }
}
