import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const employee_id = searchParams.get("employee_id")
    const company_id  = searchParams.get("company_id")
    const status      = searchParams.get("status")
    const from        = searchParams.get("from")
    const to          = searchParams.get("to")

    let query = supabase
      .from("leave_requests")
      .select(`
        *,
        employees!leave_requests_employee_id_fkey(
          first_name, last_name, employee_id, department, position
        ),
        leave_types!leave_requests_leave_type_id_fkey(name)
      `)
      .order("created_at", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (status)      query = query.eq("status", status)
    if (from)        query = query.gte("start_date", from)
    if (to)          query = query.lte("end_date", to)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      employee_name:  r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
      employee_id_no: r.employees?.employee_id ?? null,
      department:     r.employees?.department  ?? null,
      position:       r.employees?.position    ?? null,
      leave_type_name: r.leave_types?.name ?? r.leave_type_name ?? null,
    }))

    return NextResponse.json({ requests: mapped })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { employee_id, leave_type_id, leave_type_name, start_date, end_date, days_requested, reason } = body

    if (!employee_id || !start_date || !end_date) {
      return NextResponse.json({ error: "employee_id, start_date, end_date required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        employee_id,
        leave_type_id: leave_type_id ?? null,
        leave_type_name: leave_type_name ?? null,
        start_date,
        end_date,
        days_requested: days_requested ?? null,
        reason:         reason ?? null,
        status:         "pending",
      })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ request: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
