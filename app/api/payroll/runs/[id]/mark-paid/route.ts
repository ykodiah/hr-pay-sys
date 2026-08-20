/**
 * POST /api/payroll/runs/[id]/mark-paid
 * After approval, mark the run as paid (funds disbursed).
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params
    const client = await createClient()
    const now = new Date().toISOString()

    const { data: run, error: runErr } = await client
      .from("payroll_runs")
      .select("id, status, company_id, pay_period_start")
      .eq("id", id)
      .single()
    if (runErr || !run) {
      return NextResponse.json({ error: runErr?.message || "Run not found" }, { status: 404 })
    }
    if (run.status !== "approved" && run.status !== "paid") {
      return NextResponse.json(
        { error: "Only approved payroll runs can be marked as paid" },
        { status: 400 },
      )
    }
    const controlledPeriod = run.pay_period_start ? String(run.pay_period_start).slice(0, 7) : null
    if (controlledPeriod) {
      const { data: periodControl, error: periodControlError } = await client
        .from("payroll_periods")
        .select("status")
        .eq("company_id", run.company_id)
        .eq("pay_period", controlledPeriod)
        .maybeSingle()
      if (periodControlError) {
        return NextResponse.json(
          { error: `Payroll period control unavailable: ${periodControlError.message}` },
          { status: 503 },
        )
      }
      if (periodControl?.status === "closed") {
        return NextResponse.json({ error: `${controlledPeriod} is closed and immutable` }, { status: 409 })
      }
    }

    const { data: updated, error } = await client
      .from("payroll_runs")
      .update({
        status: "paid",
        updated_at: now,
        notes: "Marked paid after approval / bank disbursement",
      })
      .eq("id", id)
      .select("*")
      .single()

    if (error) throw new Error(error.message)

    await client.from("payroll_approval_audit").insert({
      payroll_run_id: id,
      action: "paid",
      actor_id: user.isDemo ? null : user.id,
      notes: "Payroll marked as paid",
    })

    return NextResponse.json({ success: true, run: updated })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to mark paid" },
      { status: 500 },
    )
  }
}
