import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { resolveCompanyId } from "@/lib/employees/resolve-company"

export async function GET(request: Request) {
  try {
    const apiUser = await requireApiUser()
    if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get("employee_id")
    let company_id = searchParams.get("company_id")
    const status = searchParams.get("status")
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    if (!company_id) {
      const resolved = await resolveCompanyId(supabase, apiUser.isDemo ? null : apiUser.id)
      company_id = resolved?.companyId ?? null
    }

    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        employees!leave_requests_employee_id_fkey(
          first_name, last_name, employee_id, department, position, company_id
        ),
        leave_types!leave_requests_leave_type_id_fkey(name)
      `)
      .order("created_at", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (status) query = query.eq("status", status)
    if (from) query = query.gte("start_date", from)
    if (to) query = query.lte("end_date", to)
    if (company_id) query = query.eq("company_id", company_id)

    const { data, error } = await query
    if (error) {
      // Fallback without company column on leave_requests
      let fallback = supabase
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
      let rows = fb.data ?? []
      if (company_id) {
        rows = rows.filter((r: any) => r.employees?.company_id === company_id || r.company_id === company_id)
      }
      const mapped = rows.map((r: any) => ({
        ...r,
        employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
        employee_id_no: r.employees?.employee_id ?? null,
        department: r.employees?.department ?? null,
        position: r.employees?.position ?? null,
        leave_type_name: r.leave_types?.name ?? r.leave_type_name ?? null,
      }))
      return NextResponse.json({ requests: mapped })
    }

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
      employee_id_no: r.employees?.employee_id ?? null,
      department: r.employees?.department ?? null,
      position: r.employees?.position ?? null,
      leave_type_name: r.leave_types?.name ?? r.leave_type_name ?? null,
    }))

    return NextResponse.json({ requests: mapped })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const apiUser = await requireApiUser()
    if (!apiUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const supabase = await createClient()
    const body = await request.json()
    const { employee_id, leave_type_id, leave_type_name, start_date, end_date, days_requested, reason } = body

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: "employee_id, start_date, end_date required" }, { status: 400 })
    }

    let company_id = body.company_id as string | undefined
    if (!company_id) {
      const { data: emp } = await supabase
        .from("employees")
        .select("company_id")
        .eq("id", employee_id)
        .maybeSingle()
      company_id = emp?.company_id
    }
    if (!company_id) {
      const resolved = await resolveCompanyId(supabase, apiUser.isDemo ? null : apiUser.id)
      company_id = resolved?.companyId
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id,
        company_id: company_id ?? null,
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
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
