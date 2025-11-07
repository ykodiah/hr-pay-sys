import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const employeeId = searchParams.get("employeeId")
  const periodStart = searchParams.get("periodStart")
  const periodEnd = searchParams.get("periodEnd")

  let query = supabase
    .from("timesheet_snapshots")
    .select("*")
    .order("generated_at", { ascending: false })
    .limit(50)

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }
  if (periodStart) {
    query = query.gte("period_start", periodStart)
  }
  if (periodEnd) {
    query = query.lte("period_end", periodEnd)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { id, acknowledged, acknowledged_by } = body

  if (!id) {
    return NextResponse.json({ error: "Snapshot id required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("timesheet_snapshots")
    .update({
      acknowledged: acknowledged ?? true,
      acknowledged_by: acknowledged_by ?? (await supabase.auth.getUser()).data.user?.id ?? null,
      acknowledged_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
