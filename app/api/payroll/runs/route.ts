/**
 * GET  /api/payroll/runs?company_id=&status=&limit=
 * POST /api/payroll/runs  — create a draft payroll run for a period
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"

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
    const ctx = await resolveTenantContext(req)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service } = ctx

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const limit = Math.min(Number(searchParams.get("limit") ?? 100), 500)

    let query = service
      .from("payroll_runs")
      .select("*")
      .eq("company_id", companyId)
      .order("pay_date", { ascending: false })
      .limit(limit)

    if (status && status !== "all") {
      if (status === "pending") {
        // Only runs actually waiting for approval (exclude empty drafts)
        query = query.in("status", ["pending", "partial"])
      } else {
        query = query.eq("status", status)
      }
    }

    const { data: runs, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const runIds = (runs ?? []).map((r) => r.id)
    const counts = new Map<string, number>()

    if (runIds.length > 0) {
      const { data: items } = await service
        .from("payroll_items")
        .select("payroll_run_id")
        .in("payroll_run_id", runIds)

      for (const item of items ?? []) {
        counts.set(item.payroll_run_id, (counts.get(item.payroll_run_id) ?? 0) + 1)
      }

      const missing = runIds.filter((id) => !counts.has(id))
      if (missing.length > 0) {
        const { data: slips } = await service
          .from("payslips")
          .select("payroll_run_id")
          .in("payroll_run_id", missing)
        for (const slip of slips ?? []) {
          if (!slip.payroll_run_id) continue
          counts.set(slip.payroll_run_id, (counts.get(slip.payroll_run_id) ?? 0) + 1)
        }
      }
    }

    const enriched = (runs ?? [])
      .map((run) => ({
        ...run,
        employee_count: counts.get(run.id) ?? 0,
      }))
      .filter((run) => {
        // Approvals "pending" should not surface empty / draft shells
        if (status === "pending") return Number(run.employee_count) > 0
        return true
      })

    return NextResponse.json({
      success: true,
      runs: enriched,
      data: enriched,
      company_id: companyId,
      meta: { fetched_at: new Date().toISOString(), count: enriched.length },
    })
  } catch (err) {
    return jsonError(err, "Failed to list payroll runs")
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, userId, service } = ctx

    const { pay_period, subsidiary_id, notes } = body as {
      pay_period: string
      subsidiary_id?: string
      notes?: string
    }

    if (!pay_period) {
      return NextResponse.json({ error: "pay_period is required" }, { status: 400 })
    }
    const { data: periodControl } = await service
      .from("payroll_periods")
      .select("status")
      .eq("company_id", companyId)
      .eq("pay_period", pay_period)
      .maybeSingle()
    if (periodControl?.status === "closed") {
      return NextResponse.json({ error: `${pay_period} is closed and cannot accept a new payroll run` }, { status: 409 })
    }

    const bounds = periodBounds(pay_period)

    const { data: existing } = await service
      .from("payroll_runs")
      .select("*")
      .eq("company_id", companyId)
      .eq("pay_period_start", bounds.pay_period_start)
      .in("status", ["draft", "processing", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ success: true, run: existing, reused: true })
    }

    const payload = {
      company_id: companyId,
      subsidiary_id: subsidiary_id ?? null,
      ...bounds,
      status: "draft",
      approval_stage: "pending",
      total_gross_pay: 0,
      total_deductions: 0,
      total_net_pay: 0,
      notes: notes ?? null,
      created_by: userId,
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await service.from("payroll_runs").insert(payload).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, run: data, reused: false })
  } catch (err) {
    return jsonError(err, "Failed to create payroll run")
  }
}
