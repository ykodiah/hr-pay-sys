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
      .from("overtime_requests")
      .select(`
        *,
        employees!overtime_requests_employee_id_fkey(first_name, last_name, employee_id, department, position),
        overtime_rates!overtime_requests_rate_type_id_fkey(rate_type, multiplier, description)
      `)
      .order("date", { ascending: false })

    if (employee_id) query = query.eq("employee_id", employee_id)
    if (company_id)  query = query.eq("company_id", company_id)
    if (status)      query = query.eq("status", status)
    if (from)        query = query.gte("date", from)
    if (to)          query = query.lte("date", to)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    const mapped = (data ?? []).map((r: any) => ({
      ...r,
      employee_name: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : null,
      employee_id_no: r.employees?.employee_id ?? null,
      department:     r.employees?.department  ?? null,
      position:       r.employees?.position    ?? null,
      rate_type:      r.overtime_rates?.rate_type    ?? null,
      multiplier:     r.overtime_rates?.multiplier   ?? 1.5,
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
    const { employee_id, company_id, date, hours_requested, reason } = body

    if (!employee_id || !company_id || !date || !hours_requested) {
      return NextResponse.json({ error: "employee_id, company_id, date, hours_requested required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("overtime_requests")
      .insert({
        employee_id, company_id, date,
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
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
