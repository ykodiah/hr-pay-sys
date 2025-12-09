import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET - Fetch alerts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const status = searchParams.get("status")
    const employeeId = searchParams.get("employee_id")
    const severity = searchParams.get("severity")
    const alertType = searchParams.get("alert_type")
    const limit = Number.parseInt(searchParams.get("limit") || "100")

    let query = supabase
      .from("attendance_alerts")
      .select(`
        *,
        employee:employees(id, first_name, last_name, employee_id),
        rule:attendance_alert_rules(rule_name, severity, notification_channels)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status) query = query.eq("status", status)
    if (employeeId) query = query.eq("employee_id", employeeId)
    if (severity) query = query.eq("severity", severity)
    if (alertType) query = query.eq("alert_type", alertType)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts][GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create alert (manual or triggered)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("attendance_alerts")
      .insert({
        rule_id: body.rule_id,
        employee_id: body.employee_id,
        alert_type: body.alert_type,
        severity: body.severity,
        title: body.title,
        message: body.message,
        metadata: body.metadata,
        status: "pending",
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts][POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update alert status (acknowledge, resolve)
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { data: userData } = await supabase.auth.getUser()

    const updates: any = {}

    if (body.action === "acknowledge") {
      updates.status = "acknowledged"
      updates.acknowledged_at = new Date().toISOString()
      updates.acknowledged_by = userData?.user?.id
    } else if (body.action === "resolve") {
      updates.status = "resolved"
      updates.resolved_at = new Date().toISOString()
      updates.resolved_by = userData?.user?.id
    } else if (body.action === "escalate") {
      updates.status = "escalated"
      updates.escalated_at = new Date().toISOString()
      updates.escalation_level = (body.current_escalation_level || 0) + 1
    }

    const { data, error } = await supabase
      .from("attendance_alerts")
      .update(updates)
      .eq("id", body.alert_id)
      .select()
      .single()

    if (error) throw error

    // Record acknowledgment if applicable
    if (body.action === "acknowledge" && body.response_note) {
      await supabase.from("alert_acknowledgments").insert({
        alert_id: body.alert_id,
        employee_id: userData?.user?.id,
        response_note: body.response_note,
        action_taken: body.action_taken,
      })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts][PATCH]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
