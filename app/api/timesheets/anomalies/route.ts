import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const employeeId = searchParams.get("employeeId")
  const severity = searchParams.get("severity")
  const status = searchParams.get("status")

  let query = supabase
    .from("timesheet_anomalies")
    .select("*")
    .order("detected_at", { ascending: false })
    .limit(100)

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
  }
  if (severity) {
    query = query.eq("severity", severity)
  }
  if (status === "open") {
    query = query.eq("resolved", false)
  } else if (status === "resolved") {
    query = query.eq("resolved", true)
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

  const { id, resolved } = body

  if (!id) {
    return NextResponse.json({ error: "Anomaly id required" }, { status: 400 })
  }

  const authUser = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from("timesheet_anomalies")
    .update({
      resolved: resolved ?? true,
      resolved_by: authUser.data.user?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
