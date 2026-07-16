/**
 * POST /api/payroll/process
 *
 * Prefer worksheet `rows` from the client (already calculated) so Process & Submit
 * never hangs on a second full DB tax pass. Falls back to server processPayrollRun
 * when rows are omitted.
 *
 * Body: {
 *   company_id, pay_period, payroll_run_id?, submit_for_approval?,
 *   rows?: WorksheetRow[]
 * }
 */

import { NextRequest, NextResponse } from "next/server"
import { createClient, isMockSupabaseClient } from "@/lib/supabase/server"
import { requireApiUserOrGuest } from "@/lib/auth/api-user"
import { createPayrollService } from "@/lib/services"
import { uid } from "@/lib/demo/memory-db"

type ProcessRow = {
  employeeId: string
  employeeCode?: string
  name?: string
  department?: string
  position?: string
  basicSalary?: number
  allowances?: number
  overtime?: number
  bonus?: number
  loan?: number
  advance?: number
  other?: number
  grossPay?: number
  providentFund?: number
  ssnitEmployee?: number
  taxableIncome?: number
  paye?: number
  totalDeductions?: number
  netPay?: number
}

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

function n(v: unknown) {
  return Math.round(Number(v || 0) * 100) / 100
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    promise.then(
      (v) => {
        clearTimeout(timer)
        resolve(v)
      },
      (e) => {
        clearTimeout(timer)
        reject(e)
      },
    )
  })
}

async function persistRowsFromWorksheet(
  client: any,
  runId: string,
  companyId: string,
  payPeriod: string,
  bounds: ReturnType<typeof periodBounds>,
  rows: ProcessRow[],
) {
  const errors: string[] = []
  const employeeErrors: Record<string, string> = {}
  let processed = 0
  let totalGross = 0
  let totalDed = 0
  let totalNet = 0

  // Clear prior draft items for this run so re-process is idempotent
  await client.from("payroll_items").delete().eq("payroll_run_id", runId)
  await client.from("payslips").delete().eq("payroll_run_id", runId)

  for (const row of rows) {
    try {
      // Validate required fields before processing
      if (!row.employeeId) {
        const empError = `${row.name || "row"}: missing employeeId`
        errors.push(empError)
        employeeErrors[row.employeeId || "unknown"] = empError
        continue
      }

      if (typeof row.basicSalary !== "number" || row.basicSalary < 0) {
        const empError = `${row.name || row.employeeId}: invalid basic salary`
        errors.push(empError)
        employeeErrors[row.employeeId] = empError
        continue
      }

      const basic = n(row.basicSalary)
      const allowances = n(row.allowances)
      const overtime = n(row.overtime)
      const bonus = n(row.bonus)
      const gross = n(row.grossPay) || n(basic + allowances + overtime + bonus)
      const ssnit = n(row.ssnitEmployee)
      const pf = n(row.providentFund)
      const paye = n(row.paye)
      const loan = n(row.loan)
      const advance = n(row.advance)
      const other = n(row.other)
      const totalDeductions =
        n(row.totalDeductions) || n(ssnit + pf + paye + loan + advance + other)
      const net = n(row.netPay) || n(gross - totalDeductions)
      const taxable = n(row.taxableIncome)

      const itemId = uid("pi")
      const itemPayload = {
        id: itemId,
        payroll_run_id: runId,
        employee_id: row.employeeId,
        company_id: companyId,
        basic_salary: basic,
        allowances: { other: allowances },
        overtime_pay: overtime,
        bonus_pay: bonus,
        gross_pay: gross,
        ssnit_employee: ssnit,
        ssnit_employer: n(ssnit * (13 / 5.5)),
        tier2_employee: 0,
        tier2_employer: 0,
        tier3_employee: pf,
        tier3_employer: 0,
        paye_tax: paye,
        loan_deduction: loan,
        advance_deduction: advance,
        other_deductions: other,
        total_deductions: totalDeductions,
        net_pay: net,
        taxable_income: taxable,
        status: "calculated",
        updated_at: new Date().toISOString(),
      }

      const { error: itemErr } = await client.from("payroll_items").insert(itemPayload)
      if (itemErr) {
        const empError = `${row.name || row.employeeId}: ${itemErr.message}`
        errors.push(empError)
        employeeErrors[row.employeeId] = empError
        continue
      }

      const payslipPayload = {
        id: uid("ps"),
        payroll_item_id: itemId,
        payroll_run_id: runId,
        employee_id: row.employeeId,
        company_id: companyId,
        pay_period: payPeriod,
        pay_period_start: bounds.pay_period_start,
        pay_period_end: bounds.pay_period_end,
        pay_date: bounds.pay_date,
        snapshot_employee_name: row.name || "Employee",
        snapshot_employee_id_no: row.employeeCode || null,
        snapshot_position: row.position || null,
        snapshot_department: row.department || null,
        basic_salary: basic,
        other_allowances: allowances,
        overtime_pay: overtime,
        bonus_pay: bonus,
        gross_pay: gross,
        ssnit_employee: ssnit,
        ssnit_employer: itemPayload.ssnit_employer,
        tier3_employee: pf,
        paye_taxable_income: taxable,
        paye_tax: paye,
        loan_deduction: loan,
        advance_deduction: advance,
        other_deductions: other,
        total_deductions: totalDeductions,
        net_pay: net,
        status: "draft",
        updated_at: new Date().toISOString(),
      }

      const { error: slipErr } = await client.from("payslips").insert(payslipPayload)
      if (slipErr) {
        const empError = `${row.name || row.employeeId}: payslip ${slipErr.message}`
        errors.push(empError)
        employeeErrors[row.employeeId] = empError
        // item already saved — still count as processed
      }

      processed++
      totalGross += gross
      totalDed += totalDeductions
      totalNet += net
    } catch (err) {
      const empError = `${row.name || row.employeeId}: ${err instanceof Error ? err.message : "save failed"}`
      errors.push(empError)
      employeeErrors[row.employeeId] = empError
    }
  }

  await client
    .from("payroll_runs")
    .update({
      total_gross_pay: n(totalGross),
      total_deductions: n(totalDed),
      total_net_pay: n(totalNet),
      updated_at: new Date().toISOString(),
    })
    .eq("id", runId)

  return { processed, errors, employeeErrors }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireApiUserOrGuest()

    const body = await req.json()
    const {
      company_id,
      pay_period,
      payroll_run_id,
      submit_for_approval = true,
      rows,
    } = body as {
      company_id: string
      pay_period: string
      payroll_run_id?: string
      submit_for_approval?: boolean
      rows?: ProcessRow[]
    }

    if (!company_id || !pay_period) {
      return NextResponse.json({ error: "company_id and pay_period are required" }, { status: 400 })
    }

    const client = await createClient()
    const bounds = periodBounds(pay_period)
    let runId = payroll_run_id
    const worksheetRows = Array.isArray(rows) ? rows.filter((r) => r && r.employeeId) : []

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

    let processed = 0
    let processErrors: string[] = []
    let reconciliationStatus: any = null

    if (worksheetRows.length > 0) {
      // Fast path: persist the worksheet the user already calculated
      const result = await withTimeout(
        persistRowsFromWorksheet(client, runId, company_id, pay_period, bounds, worksheetRows),
        isMockSupabaseClient(client) ? 10000 : 45000,
        "persist_worksheet",
      )
      processed = result.processed
      processErrors = result.errors
    } else {
      // Legacy / API-only path
      const service = createPayrollService(true)
      const result = await withTimeout(
        service.processPayrollRun(runId, company_id),
        50000,
        "process_payroll_run",
      )

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
      processed = result.data.processed
      processErrors = result.data.errors
    }

    if (processed === 0 && processErrors.length > 0) {
      await client
        .from("payroll_runs")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", runId)
      return NextResponse.json(
        {
          error: `No employees processed. ${processErrors[0]}`,
          errors: processErrors,
          payroll_run_id: runId,
        },
        { status: 422 },
      )
    }

    // Post-save reconciliation: validate payroll_items and payslips sync
    if (processed > 0) {
      try {
        const { data: reconciled, error: reconErr } = await client.rpc(
          "reconcile_payroll_items_and_payslips",
          { p_payroll_run_id: runId }
        )
        if (!reconErr && reconciled) {
          reconciliationStatus = reconciled[0]
          // Add warning if mismatches detected
          if (reconciled[0].matched < reconciled[0].total_items) {
            processErrors.push(
              `⚠ Data sync warning: ${reconciled[0].total_items} items vs ${reconciled[0].total_slips} slips. Check details.`
            )
          }
        }
      } catch (e) {
        console.log("[v0] Reconciliation warning:", e instanceof Error ? e.message : "unknown error")
        // Don't fail processing on reconciliation warning
      }
    }

    const nextStatus =
      processErrors.length === 0
        ? submit_for_approval
          ? "pending"
          : "completed"
        : processed > 0
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
      processed,
      errors: processErrors,
      submitted_for_approval: nextStatus === "pending",
      source: worksheetRows.length > 0 ? "worksheet" : "server",
      reconciliation: reconciliationStatus,
      meta: { fetched_at: new Date().toISOString(), demo: isMockSupabaseClient(client) },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Payroll processing failed" },
      { status: 500 },
    )
  }
}
