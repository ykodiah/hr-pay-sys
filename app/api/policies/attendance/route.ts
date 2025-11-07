import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const scopeType = searchParams.get("scopeType")
  const isActive = searchParams.get("isActive")

  let query = supabase.from("attendance_policies").select("*").order("created_at", { ascending: false })

  if (scopeType) {
    query = query.eq("scope_type", scopeType)
  }
  if (isActive === "true") {
    query = query.eq("is_active", true)
  } else if (isActive === "false") {
    query = query.eq("is_active", false)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const { data: userData } = await supabase.auth.getUser()

  const payload = {
    name: body.name,
    policy_type: body.policy_type ?? "grace",
    scope_type: body.scope_type ?? "company",
    scope_reference: body.scope_reference ?? null,
    grace_minutes: body.grace_minutes ?? 0,
    rounding_increment: body.rounding_increment ?? 0,
    rounding_mode: body.rounding_mode ?? "nearest",
    penalty_type: body.penalty_type ?? null,
    penalty_value: body.penalty_value ?? null,
    auto_escalate: body.auto_escalate ?? false,
    escalation_minutes: body.escalation_minutes ?? null,
    escalation_channel: body.escalation_channel ?? "email",
    payroll_action: body.payroll_action ?? null,
    effective_from: body.effective_from ?? new Date().toISOString().split("T")[0],
    effective_to: body.effective_to ?? null,
    is_active: body.is_active ?? true,
    created_by: userData.user?.id ?? null,
  }

  const { data, error } = await supabase.from("attendance_policies").insert(payload).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  if (!body.id) {
    return NextResponse.json({ error: "Policy id required" }, { status: 400 })
  }

  const { data, error } = await supabase.from("attendance_policies").update(body).eq("id", body.id).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

