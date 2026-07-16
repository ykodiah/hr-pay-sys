/**
 * POST /api/payroll/process
 *
 * Server-authoritative payroll processing from DB:
 * employees + employee_financial + payroll_pay_inputs + employee_loans
 * + employee_allowances / employee_deductions
 *
 * Body: { company_id, pay_period, payroll_run_id?, submit_for_approval?, employee_ids? }
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
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Sign in or enable demo session (demo-session=active) before processing payroll.",
        },
        { status: 401 },
      )
    }

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

    // Never reuse approved/paid/cancelled runs
    if (runId) {
      const { data: existingRun } = await client
        .from("payroll_runs")
        .select("id, status")
        .eq("id", runId)
        .maybeSingle()
      if (existingRun && ["approved", "paid", "cancelled"].includes(String(existingRun.status))) {
        runId = undefined
      }
    }

    if (!runId) {
      const { data: existing } = await client
        .from("payroll_runs")
        .select("id, status")
        .eq("company_id", company_id)
        .eq("pay_period_start", bounds.pay_period_start)
        .in("status", ["draft", "processing", "pending", "completed", "partial", "rejected"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      runId = existing?.id
    }

    if (!runId) {
      // Omit created_by when demo / FK may reject auth user ids
      const insertPayload: Record<string, unknown> = {
        company_id,
        ...bounds,
        status: "processing",
        approval_stage: "pending",
        updated_at: new Date().toISOString(),
      }
      if (!user.isDemo) insertPayload.created_by = user.id

      let { data: created, error } = await client
        .from("payroll_runs")
        .insert(insertPayload)
        .select("id")
        .single()

      // Retry without created_by if FK fails
      if (error && String(error.message).toLowerCase().includes("created_by")) {
        delete insertPayload.created_by
        const retry = await client.from("payroll_runs").insert(insertPayload).select("id").single()
        created = retry.data
        error = retry.error
      }

      if (error || !created) {
        return NextResponse.json(
          {
            error:
              error?.message ??
              "Failed to create payroll run. Ensure scripts/049 and 055 are applied.",
          },
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
      await client
        .from("payroll_runs")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", runId)
      return NextResponse.json(
        { error: result.error?.message ?? "Payroll processing failed" },
        { status: 500 },
      )
    }

    if (result.data.processed === 0 && result.data.errors.length > 0) {
      await client
        .from("payroll_runs")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", runId)
      return NextResponse.json(
        {
          error: `No employees processed. ${result.data.errors[0]}`,
          errors: result.data.errors,
          payroll_run_id: runId,
        },
        { status: 422 },
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
      submitted_for_approval: nextStatus === "pending",
      meta: { fetched_at: new Date().toISOString() },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payroll processing failed" },
      { status: 500 },
    )
  }
}
