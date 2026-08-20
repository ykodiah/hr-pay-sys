/**
 * POST /api/payroll/recalculate-cash-totals
 *
 * Backfills payslip / payroll_item / payroll_run cash totals so Tier 2 is
 * excluded from total_deductions and net_pay.
 *
 * Body: { company_id?, payroll_run_id? }
 * - payroll_run_id: recompute one run
 * - company_id only: recompute all runs for the company
 */

import { NextRequest, NextResponse } from "next/server"
import { isUnresolvedTenant, resolveTenantContext } from "@/lib/settings/resolve-tenant"
import { payrollCashDeductions } from "@/lib/payroll/cash-deductions"

function n(v: unknown) {
  return Math.round(Number(v || 0) * 100) / 100
}

async function recomputeRows(
  client: any,
  table: "payslips" | "payroll_items",
  filter: { column: string; value: string },
) {
  const payeCol = table === "payslips" ? "paye_tax" : "tax_deduction"
  const selectCols =
    table === "payslips"
      ? "id, gross_pay, ssnit_employee, tier2_employee, tier3_employee, paye_tax, loan_deduction, advance_deduction, other_deductions, total_deductions, net_pay, paye_taxable_income"
      : "id, gross_pay, ssnit_employee, tier2_employee, tier3_employee, tax_deduction, paye_tax, loan_deduction, advance_deduction, other_deductions, total_deductions, net_pay, paye_taxable_income"

  const { data: rows, error } = await client
    .from(table)
    .select(selectCols)
    .eq(filter.column, filter.value)

  if (error) return { updated: 0, error: error.message }

  let updated = 0
  for (const row of rows ?? []) {
    const components = {
      ssnit_employee: row.ssnit_employee,
      tier2_employee: row.tier2_employee,
      tier3_employee: row.tier3_employee,
      paye_tax: table === "payslips" ? row.paye_tax : row.tax_deduction ?? row.paye_tax,
      loan_deduction: row.loan_deduction,
      advance_deduction: row.advance_deduction,
      other_deductions: row.other_deductions,
      gross_pay: row.gross_pay,
      total_deductions: row.total_deductions,
      paye_taxable_income: row.paye_taxable_income,
    }
    const cashDed = payrollCashDeductions(components)
    const net = n(n(row.gross_pay) - cashDed)
    const tier2 = n(row.tier2_employee)
    const storedDed = n(row.total_deductions)
    const includesTier2 =
      tier2 > 0 && Math.abs(storedDed - n(cashDed + tier2)) < 0.05 && Math.abs(storedDed - cashDed) >= 0.05
    const taxable = includesTier2 ? n(n(row.paye_taxable_income) + tier2) : n(row.paye_taxable_income)

    const patch: Record<string, unknown> = {
      total_deductions: cashDed,
      net_pay: net,
      updated_at: new Date().toISOString(),
    }
    // Best-effort; column may not exist until script 081
    patch.tier2_report_only = true
    if (includesTier2) patch.paye_taxable_income = taxable

    const { error: updErr } = await client.from(table).update(patch).eq("id", row.id)
    if (!updErr) updated++
    else if (String(updErr.message || "").includes("tier2_report_only")) {
      delete patch.tier2_report_only
      const { error: retryErr } = await client.from(table).update(patch).eq("id", row.id)
      if (!retryErr) updated++
    }
  }

  return { updated, error: null as string | null }
}

async function recomputeRun(client: any, runId: string) {
  // Prefer DB RPC when script 081 has been applied
  const { data: rpcData, error: rpcError } = await client.rpc("recompute_payroll_run_cash_totals", {
    p_payroll_run_id: runId,
  })
  if (!rpcError) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData
    return {
      payroll_run_id: runId,
      via: "rpc" as const,
      items_updated: Number(row?.items_updated ?? 0),
      payslips_updated: Number(row?.payslips_updated ?? 0),
      total_deductions: Number(row?.total_deductions ?? 0),
      total_net_pay: Number(row?.total_net_pay ?? 0),
    }
  }

  const items = await recomputeRows(client, "payroll_items", { column: "payroll_run_id", value: runId })
  const slips = await recomputeRows(client, "payslips", { column: "payroll_run_id", value: runId })

  const { data: slipAgg } = await client
    .from("payslips")
    .select("gross_pay, total_deductions, net_pay")
    .eq("payroll_run_id", runId)

  let gross = 0
  let ded = 0
  let net = 0
  let count = 0
  const source = (slipAgg ?? []).length > 0 ? slipAgg! : null
  if (source) {
    for (const s of source) {
      gross += n(s.gross_pay)
      ded += n(s.total_deductions)
      net += n(s.net_pay)
      count++
    }
  } else {
    const { data: itemAgg } = await client
      .from("payroll_items")
      .select("gross_pay, total_deductions, net_pay")
      .eq("payroll_run_id", runId)
    for (const s of itemAgg ?? []) {
      gross += n(s.gross_pay)
      ded += n(s.total_deductions)
      net += n(s.net_pay)
      count++
    }
  }

  await client
    .from("payroll_runs")
    .update({
      total_gross_pay: n(gross),
      total_deductions: n(ded),
      total_net_pay: n(net),
      employee_count: count,
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)

  return {
    payroll_run_id: runId,
    via: "app" as const,
    items_updated: items.updated,
    payslips_updated: slips.updated,
    total_deductions: n(ded),
    total_net_pay: n(net),
    warnings: [items.error, slips.error, rpcError?.message].filter(Boolean),
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, service: client } = ctx

    const runId = String(body.payroll_run_id || "").trim()
    if (runId) {
      const { data: run } = await client
        .from("payroll_runs")
        .select("pay_period_start")
        .eq("id", runId)
        .eq("company_id", companyId)
        .maybeSingle()
      const period = run?.pay_period_start ? String(run.pay_period_start).slice(0, 7) : null
      if (period) {
        const { data: control, error: controlError } = await client
          .from("payroll_periods")
          .select("status")
          .eq("company_id", companyId)
          .eq("pay_period", period)
          .maybeSingle()
        if (controlError) return NextResponse.json({ error: `Payroll period control unavailable: ${controlError.message}` }, { status: 503 })
        if (control?.status === "closed") return NextResponse.json({ error: `${period} is closed and immutable` }, { status: 409 })
      }
      const result = await recomputeRun(client, runId)
      return NextResponse.json({ ok: true, company_id: companyId, results: [result] })
    }

    const { data: runs, error } = await client
      .from("payroll_runs")
      .select("id, pay_period_start")
      .eq("company_id", companyId)
      .order("created_at", { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: closedPeriods, error: controlsError } = await client
      .from("payroll_periods")
      .select("pay_period")
      .eq("company_id", companyId)
      .eq("status", "closed")
    if (controlsError) return NextResponse.json({ error: `Payroll period control unavailable: ${controlsError.message}` }, { status: 503 })
    const closed = new Set((closedPeriods || []).map((row: any) => row.pay_period))
    const results = []
    for (const run of runs ?? []) {
      if (run.pay_period_start && closed.has(String(run.pay_period_start).slice(0, 7))) continue
      results.push(await recomputeRun(client, run.id))
    }

    return NextResponse.json({
      ok: true,
      company_id: companyId,
      runs: results.length,
      results,
      note: "Also run scripts/081_tier2_report_only_cash_totals.sql for schema + view updates.",
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Recalculate failed" },
      { status: 500 },
    )
  }
}
