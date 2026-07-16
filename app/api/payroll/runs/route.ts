/**
 * GET  /api/payroll/runs?company_id=&status=&limit=
 * POST /api/payroll/runs  — create a draft payroll run for a period
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { requireApiUser } from "@/lib/auth/api-user"

function periodBounds(payPeriod: string) {
  const [y, m] = payPeriod.split("-").map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1))
  const end = new Date(Date.UTC(y, m, 0))
  const payDate = end
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return {
    pay_period_start: iso(start),
    pay_period_end: iso(end),
    pay_date: iso(payDate),
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get("company_id")
    const status = searchParams.get("status")
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500)

    const client = await createClient()
    let query = client
      .from("payroll_runs")
      .select("*")
      .order("pay_date", { ascending: false })
      .limit(limit)

    if (companyId) query = query.eq("company_id", companyId)

    if (status && status !== "all") {
      if (status === "pending") {
        query = query.in("status", ["draft", "processing", "pending", "completed", "partial"])
      } else {
        query = query.eq("status", status)
      }
    }

    const { data: runs, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const runIds = (runs ?? []).map((r) => r.id)
    const counts = new Map<string, number>()

    if (runIds.length > 0) {
      const { data: items } = await client
        .from("payroll_items")
        .select("payroll_run_id")
        .in("payroll_run_id", runIds)

      for (const item of items ?? []) {
        counts.set(item.payroll_run_id, (counts.get(item.payroll_run_id) ?? 0) + 1)
      }

      // Fallback count from payslips when payroll_items empty
      const missing = runIds.filter((id) => !counts.has(id))
      if (missing.length > 0) {
        const { data: slips } = await client
          .from("payslips")
          .select("payroll_run_id")
          .in("payroll_run_id", missing)
        for (const slip of slips ?? []) {
          if (!slip.payroll_run_id) continue
          counts.set(slip.payroll_run_id, (counts.get(slip.payroll_run_id) ?? 0) + 1)
        }
      }
    }

    const enriched = (runs ?? []).map((run) => ({
      ...run,
      employee_count: counts.get(run.id) ?? 0,
    }))

    return NextResponse.json({
      success: true,
      runs: enriched,
      data: enriched,
      meta: { fetched_at: new Date().toISOString(), count: enriched.length },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to list payroll runs" },
      { status: 500 },
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { company_id, pay_period, subsidiary_id, notes } = body as {
      company_id: string
      pay_period: string
      subsidiary_id?: string
      notes?: string
    }

    if (!company_id || !pay_period) {
      return NextResponse.json({ error: "company_id and pay_period are required" }, { status: 400 })
    }

    const bounds = periodBounds(payPeriod)
    const client = await createClient()

    // Reuse existing draft/processing run for same company + period when present
    const { data: existing } = await client
      .from("payroll_runs")
      .select("*")
      .eq("company_id", company_id)
      .eq("pay_period_start", bounds.pay_period_start)
      .in("status", ["draft", "processing", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, run: existing, reused: true })
    }

    const payload = {
      company_id,
      subsidiary_id: subsidiary_id ?? null,
      ...bounds,
      status: "draft",
      approval_stage: "pending",
      total_gross_pay: 0,
      total_deductions: 0,
      total_net_pay: 0,
      notes: notes ?? null,
      created_by: user.isDemo ? null : user.id,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await client.from("payroll_runs").insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, run: data, reused: false })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create payroll run" },
      { status: 500 },
    )
  }
}
