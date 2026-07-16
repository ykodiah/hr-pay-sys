/**
 * POST /api/payroll/process
 *
 * Server-authoritative payroll processing from DB:
 * employees + employee_financial + payroll_pay_inputs + employee_loans
 *
 * Body: { company_id, pay_period, payroll_run_id?, submit_for_approval? }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"
import { createPayrollService } from "@/lib/services"

function periodBounds(payPeriod: string) {
  const [y, m] = payPeriod.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    pay_period_start: iso(start),
    pay_period_end: iso(end),
    pay_date: iso(end),
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const {
      company_id,
      pay_period,
      payroll_run_id,
      submit_for_approval = true,
    } = body as {
      company_id: string
      pay_period: string
      payroll_run_id?: string
      submit_for_approval?: boolean
    }

    if (!company_id || !pay_period) {
      return NextResponse.json({ error: "company_id and pay_period are required" }, { status: 400 })
    }

    const client = await createClient()
    const bounds = periodBounds(pay_period)
    let runId = payroll_run_id

    if (!runId) {
      const { data: existing } = await client
        .from("payroll_runs")
        .select("id")
        .eq("company_id", company_id)
        .eq("pay_period_start", bounds.pay_period_start)
        .in("status", ["draft", "processing", "pending", "completed", "partial"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      runId = existing?.id
    }

    if (!runId) {
      const { data: created, error } = await client
        .from("payroll_runs")
        .insert({
          company_id,
          ...bounds,
          status: "processing",
          approval_stage: "pending",
          created_by: user.isDemo ? null : user.id,
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single()

      if (error || !created) {
        return NextResponse.json(
          { error: error?.message ?? "Failed to create payroll run" },
          { status: 500 },
        )
      }
      runId = created.id
    } else {
      await client
        .from("payroll_runs")
        .update({
          status: "processing",
          ...bounds,
          updated_at: new Date().toISOString(),
        })
        .eq("id", runId)
    }

    const service = createPayrollService(true)
    const result = await service.processPayrollRun(runId, company_id)

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message ?? "Payroll processing failed" },
        { status: 500 },
      )
    }

    const nextStatus =
      result.data.errors.length === 0
        ? submit_for_approval
          ? "pending"
          : "completed"
        : result.data.processed > 0
          ? "partial"
          : "draft"

    const runUpdate: Record<string, unknown> = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    }
    if (nextStatus === "pending") runUpdate.approval_stage = "pending"

    await client.from("payroll_runs").update(runUpdate).eq("id", runId)

    // Mark period pay inputs as processed
    await client
      .from("payroll_pay_inputs")
      .update({ status: "processed", updated_at: new Date().toISOString() })
      .eq("company_id", company_id)
      .eq("pay_period", pay_period)

    const { data: run } = await client.from("payroll_runs").select("*").eq("id", runId).single()

    return NextResponse.json({
      success: true,
      payroll_run_id: runId,
      run,
      processed: result.data.processed,
      errors: result.data.errors,
      meta: { fetched_at: new Date().toISOString() },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payroll processing failed" },
      { status: 500 },
    )
  }
}
