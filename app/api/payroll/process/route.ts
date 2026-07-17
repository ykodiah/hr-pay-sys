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
import { createServiceClient, isMockSupabaseClient } from "@/lib/supabase/server"
import { requireApiUserOrGuest } from "@/lib/auth/api-user"
import { createPayrollService } from "@/lib/services"

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
  tier2Employee?: number
  taxableIncome?: number
  paye?: number
  overtimeTax?: number
  bonusTax?: number
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

  // Pre-fetch employee financial data + employee info for snapshot enrichment
  const empIds = rows.map((r) => r.employeeId).filter(Boolean)
  const [finRes, empRes, subRes, coRes] = await Promise.all([
    empIds.length
      ? client.from("employee_financial").select("employee_id, transport_allowance, housing_allowance, medical_allowance, meal_allowance, communication_allowance, uniform_allowance, other_allowances, bank_name, bank_account_number, ssnit_number").in("employee_id", empIds)
      : { data: [] as any[] },
    empIds.length
      ? client.from("employees").select("id, subsidiary_id, location, division").in("id", empIds)
      : { data: [] as any[] },
    client.from("subsidiaries").select("id, name"),
    client.from("companies").select("id, name").eq("id", companyId).limit(1).maybeSingle(),
  ])
  const finByEmp = new Map<string, any>()
  for (const f of finRes.data ?? []) finByEmp.set(f.employee_id, f)
  const empInfoById = new Map<string, any>()
  for (const e of empRes.data ?? []) empInfoById.set(e.id, e)
  const subById = new Map<string, string>()
  for (const s of subRes.data ?? []) subById.set(s.id, s.name)
  const companyName: string = coRes.data?.name ?? "Company"

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
      // Tier 2: use the computed value from the worksheet; fall back to 5% of basic
      const tier2 = row.tier2Employee != null ? n(row.tier2Employee) : n(basic * 0.05)
      // SSNIT employer: 13% of basic (not a ratio of employee share)
      const ssnitEmployer = n(basic * 0.13)
      const pf = n(row.providentFund)
      const paye = n(row.paye)
      // OT and bonus tax are sub-components of paye already included in paye total
      const overtimeTax = row.overtimeTax != null ? n(row.overtimeTax) : 0
      const bonusTax = row.bonusTax != null ? n(row.bonusTax) : 0
      const basePaye = n(paye - overtimeTax - bonusTax)
      const loan = n(row.loan)
      const advance = n(row.advance)
      const other = n(row.other)
      const totalDeductions =
        n(row.totalDeductions) || n(ssnit + tier2 + pf + paye + loan + advance + other)
      const net = n(row.netPay) || n(gross - totalDeductions)
      const taxable = n(row.taxableIncome)

      // Get individual allowance breakdown from employee_financial
      const fin = finByEmp.get(row.employeeId)
      const empInfo = empInfoById.get(row.employeeId)
      const subName = empInfo?.subsidiary_id ? (subById.get(empInfo.subsidiary_id) ?? null) : null
      // Distribute the total allowances proportionally from master, falling back to lump-sum
      const masterTransport = n(fin?.transport_allowance)
      const masterHousing   = n(fin?.housing_allowance)
      const masterMedical   = n(fin?.medical_allowance)
      const masterMeal      = n(fin?.meal_allowance)
      const masterComm      = n(fin?.communication_allowance)
      const masterUniform   = n(fin?.uniform_allowance)
      const masterOther     = n(fin?.other_allowances)
      const masterAllowTotal = masterTransport + masterHousing + masterMedical + masterMeal + masterComm + masterUniform + masterOther
      // If financial record exists, use those proportions scaled to actual allowances total
      const scale = masterAllowTotal > 0 ? allowances / masterAllowTotal : 0
      const splitTransport  = masterAllowTotal > 0 ? n(masterTransport * scale) : 0
      const splitHousing    = masterAllowTotal > 0 ? n(masterHousing   * scale) : 0
      const splitMedical    = masterAllowTotal > 0 ? n(masterMedical   * scale) : 0
      const splitMeal       = masterAllowTotal > 0 ? n(masterMeal      * scale) : 0
      const splitComm       = masterAllowTotal > 0 ? n(masterComm      * scale) : 0
      const splitOther      = masterAllowTotal > 0 ? n(allowances - splitTransport - splitHousing - splitMedical - splitMeal - splitComm) : allowances

      // Build only the columns that actually exist in payroll_items table
      // Do NOT pass id — let Postgres gen_random_uuid() generate a valid UUID
      const itemPayload: Record<string, any> = {
        payroll_run_id: runId,
        employee_id: row.employeeId,
        company_id: companyId,
        pay_period: payPeriod,
        basic_salary: basic,
        overtime_pay: overtime,
        bonus_pay: bonus,
        gross_pay: gross,
        ssnit_employee: ssnit,
        ssnit_employer: ssnitEmployer,
        tier2_employee: tier2,
        tier2_employer: 0,
        tier3_employee: pf,
        tier3_employer: 0,
        tax_deduction: paye,       // original column (total PAYE withheld)
        paye_tax: paye,            // new column (same total)
        overtime_tax: overtimeTax,
        bonus_tax: bonusTax,
        loan_deduction: loan,
        advance_deduction: advance,
        other_deductions: other,
        total_deductions: totalDeductions,
        net_pay: net,
        taxable_income: taxable,
        paye_taxable_income: taxable,
        allowances: { total: allowances },
        calculation_breakdown: {
          allowances,
          ssnit_employee: ssnit,
          tier2_employee: tier2,
          tier3_employee: pf,
          paye_base: basePaye,
          overtime_tax: overtimeTax,
          bonus_tax: bonusTax,
          paye_total: paye,
          loan,
          advance,
          other,
        },
        status: "calculated",
        updated_at: new Date().toISOString(),
      }

      const { data: insertedItem, error: itemErr } = await client
        .from("payroll_items")
        .insert(itemPayload)
        .select("id")
        .single()
      if (itemErr) {
        const empError = `${row.name || row.employeeId}: ${itemErr.message}`
        errors.push(empError)
        employeeErrors[row.employeeId] = empError
        continue
      }

      const payslipPayload = {
        payroll_item_id: insertedItem.id,
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
        snapshot_location: empInfo?.location ?? null,
        snapshot_division: empInfo?.division ?? null,
        snapshot_subsidiary: subName,
        snapshot_company_name: subName ? companyName : companyName,
        snapshot_ssnit_number: fin?.ssnit_number ?? null,
        snapshot_bank_name: fin?.bank_name ?? null,
        snapshot_account_number: fin?.bank_account_number ?? null,
        basic_salary: basic,
        transport_allowance: splitTransport,
        housing_allowance: splitHousing,
        medical_allowance: splitMedical,
        meal_allowance: splitMeal,
        communication_allowance: splitComm,
        other_allowances: splitOther,
        overtime_pay: overtime,
        bonus_pay: bonus,
        gross_pay: gross,
        ssnit_employee: ssnit,
        ssnit_employer: ssnitEmployer,
        tier2_employee: tier2,
        tier3_employee: pf,
        paye_taxable_income: taxable,
        paye_tax: paye,
        overtime_tax: overtimeTax,
        bonus_tax: bonusTax,
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

    // Use service-role client so payroll writes bypass RLS
    const client = createServiceClient()
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
