import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

// GET - Fetch alert rules
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const ruleType = searchParams.get("rule_type")

    let query = supabase
      .from("attendance_alert_rules")
      .select("*")
      .order("rule_type", { ascending: true })
      .order("severity", { ascending: false })

    if (ruleType) query = query.eq("rule_type", ruleType)

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts/rules][GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create alert rule
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("attendance_alert_rules")
      .insert({
        rule_name: body.rule_name,
        rule_type: body.rule_type,
        alert_category: body.alert_category,
        trigger_condition: body.trigger_condition,
        severity: body.severity,
        notification_channels: body.notification_channels,
        recipient_roles: body.recipient_roles,
        is_auto_escalate: body.is_auto_escalate,
        escalation_delay_hours: body.escalation_delay_hours,
        escalation_recipients: body.escalation_recipients,
        is_active: body.is_active,
        template_key: body.template_key,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts/rules][POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update alert rule
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("attendance_alert_rules")
      .update({
        rule_name: body.rule_name,
        trigger_condition: body.trigger_condition,
        severity: body.severity,
        notification_channels: body.notification_channels,
        recipient_roles: body.recipient_roles,
        is_auto_escalate: body.is_auto_escalate,
        escalation_delay_hours: body.escalation_delay_hours,
        escalation_recipients: body.escalation_recipients,
        is_active: body.is_active,
        template_key: body.template_key,
      })
      .eq("id", body.rule_id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("[attendance/alerts/rules][PATCH]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
