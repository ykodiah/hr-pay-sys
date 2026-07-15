import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * POST /api/payroll/approve
 * Body: { payroll_run_id, action: "hr_review" | "finance_review" | "approve" | "reject", notes?, rejection_reason? }
 *
 * Workflow stages:
 *   pending → hr_review → finance_review → approved → locked
 *   any stage → rejected
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json()
    const { payroll_run_id, action, notes, rejection_reason } = body

    if (!payroll_run_id || !action) {
      return NextResponse.json({ error: "payroll_run_id and action required" }, { status: 400 })
    }

    const now = new Date().toISOString()

    let updatePayload: Record<string, any> = { updated_at: now }
    let auditAction = action

    switch (action) {
      case "hr_review":
        updatePayload = {
          ...updatePayload,
          approval_stage:   "hr_reviewed",
          hr_reviewed_by:   user.id,
          hr_reviewed_at:   now,
        }
        auditAction = "hr_reviewed"
        break

      case "finance_review":
        updatePayload = {
          ...updatePayload,
          approval_stage:      "finance_reviewed",
          finance_reviewed_by: user.id,
          finance_reviewed_at: now,
        }
        auditAction = "finance_reviewed"
        break

      case "approve":
        updatePayload = {
          ...updatePayload,
          status:          "approved",
          approval_stage:  "approved",
          approved_by:     user.id,
          approved_at:     now,
        }
        auditAction = "approved"
        break

      case "reject":
        updatePayload = {
          ...updatePayload,
          status:           "rejected",
          approval_stage:   "rejected",
          rejected_by:      user.id,
          rejected_at:      now,
          rejection_reason: rejection_reason ?? null,
        }
        auditAction = "rejected"
        break

      default:
        return NextResponse.json(
          { error: "Invalid action. Use: hr_review | finance_review | approve | reject" },
          { status: 400 },
        )
    }

    // Update the payroll run
    const { error: updateError } = await supabase
      .from("payroll_runs")
      .update(updatePayload)
      .eq("id", payroll_run_id)

    if (updateError) throw new Error(updateError.message)

    // Write audit record
    await supabase.from("payroll_approval_audit").insert({
      payroll_run_id,
      action:   auditAction,
      actor_id: user.id,
      notes:    notes ?? rejection_reason ?? null,
    })

    return NextResponse.json({ success: true, action: auditAction })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const payroll_run_id = searchParams.get("payroll_run_id")

    let query = supabase
      .from("payroll_approval_audit")
      .select("*")
      .order("created_at", { ascending: false })

    if (payroll_run_id) query = query.eq("payroll_run_id", payroll_run_id)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    return NextResponse.json({ audit: data ?? [] })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
