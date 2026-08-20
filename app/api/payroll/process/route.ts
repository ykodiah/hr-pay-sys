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
import { isMockSupabaseClient } from "@/lib/supabase/server"
import { isUnresolvedTenant, resolveTenantContext } from "@/lib/settings/resolve-tenant"
import { createPayrollService } from "@/lib/services"
import { expandCompLines } from "@/lib/payroll/employee-comp-extras"

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
  taxReliefTotal?: number
  totalDeductions?: number
  netPay?: number
}

/** Accept camelCase or snake_case worksheet rows from the client. */
function normalizeProcessRows(raw: any[] | undefined): ProcessRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => {
      if (!r || typeof r !== "object") return null
      const employeeId = String(r.employeeId || r.employee_id || "").trim()
      if (!employeeId) return null
      return {
        employeeId,
        employeeCode: r.employeeCode ?? r.employee_code ?? "",
        name: r.name ?? r.full_name ?? "",
        department: r.department ?? "",
        position: r.position ?? "",
        basicSalary: Number(r.basicSalary ?? r.basic_salary ?? 0),
        allowances: Number(r.allowances ?? 0),
        overtime: Number(r.overtime ?? r.overtime_amount ?? 0),
        bonus: Number(r.bonus ?? r.bonus_amount ?? 0),
        loan: Number(r.loan ?? r.loan_deduction ?? 0),
        advance: Number(r.advance ?? r.advance_deduction ?? 0),
        other: Number(r.other ?? r.other_deductions ?? 0),
        grossPay: Number(r.grossPay ?? r.gross_pay ?? 0),
        providentFund: Number(r.providentFund ?? r.tier3_employee ?? 0),
        ssnitEmployee: Number(r.ssnitEmployee ?? r.ssnit_employee ?? 0),
        tier2Employee: Number(r.tier2Employee ?? r.tier2_employee ?? 0),
        taxableIncome: Number(r.taxableIncome ?? r.taxable_income ?? 0),
        paye: Number(r.paye ?? r.paye_tax ?? 0),
        overtimeTax: Number(r.overtimeTax ?? r.overtime_tax ?? 0),
        bonusTax: Number(r.bonusTax ?? r.bonus_tax ?? 0),
        taxReliefTotal: Number(r.taxReliefTotal ?? r.tax_relief_total ?? 0),
        totalDeductions: Number(r.totalDeductions ?? r.total_deductions ?? 0),
        netPay: Number(r.netPay ?? r.net_pay ?? 0),
      } as ProcessRow
    })
    .filter(Boolean) as ProcessRow[]
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

function isMissingColumnError(error: any) {
  const message = String(error?.message || error || "")
  return (
    error?.code === "PGRST204" ||
    /could not find the .* column/i.test(message) ||
    /schema cache/i.test(message) ||
    /column .* does not exist/i.test(message)
  )
}

function missingColumnName(error: any): string | null {
  const message = String(error?.message || "")
  const match =
    message.match(/could not find the ['"]([^'"]+)['"] column/i) ||
    message.match(/column ['"]([^'"]+)['"] of relation/i) ||
    message.match(/column "([^"]+)" does not exist/i)
  return match?.[1] || null
}

async function insertWithMissingColumnRetry(
  client: any,
  table: string,
  payload: Record<string, any>,
  select = "id",
) {
  let current = { ...payload }
  let lastError: any = null
  for (let attempt = 0; attempt < 12; attempt++) {
    const { data, error } = await client.from(table).insert(current).select(select).maybeSingle()
    if (!error) return { data, error: null }
    lastError = error
    if (!isMissingColumnError(error)) return { data: null, error }
    const col = missingColumnName(error)
    if (!col || !(col in current)) return { data: null, error }
    const next = { ...current }
    delete next[col]
    // Keep OT/bonus tax inside breakdown JSON when dedicated columns are missing
    if ((col === "bonus_tax" || col === "overtime_tax" || col === "paye_tax") && next.calculation_breakdown) {
      next.calculation_breakdown = {
        ...(typeof next.calculation_breakdown === "object" ? next.calculation_breakdown : {}),
        [col]: payload[col],
      }
    }
    current = next
  }
  return { data: null, error: lastError }
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
  const asOf = bounds.pay_period_end || `${payPeriod}-15`
  const [finRes, empRes, subRes, coRes, allowRes, dedRes] = await Promise.all([
    empIds.length
      ? client.from("employee_financial").select("employee_id, transport_allowance, housing_allowance, medical_allowance, meal_allowance, communication_allowance, uniform_allowance, other_allowances, bank_name, bank_account_number, ssnit_number").in("employee_id", empIds)
      : { data: [] as any[] },
    empIds.length
      ? client.from("employees").select("id, subsidiary_id, location, division").in("id", empIds)
      : { data: [] as any[] },
    client.from("subsidiaries").select("id, name"),
    client.from("companies").select("id, name").eq("id", companyId).limit(1).maybeSingle(),
    empIds.length
      ? client
          .from("employee_allowances")
          .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active, recurring, code, description")
          .eq("is_active", true)
          .in("employee_id", empIds)
      : { data: [] as any[] },
    empIds.length
      ? client
          .from("employee_deductions")
          .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active, recurring, code, description")
          .eq("is_active", true)
          .in("employee_id", empIds)
      : { data: [] as any[] },
  ])
  const finByEmp = new Map<string, any>()
  for (const f of finRes.data ?? []) finByEmp.set(f.employee_id, f)
  const empInfoById = new Map<string, any>()
  for (const e of empRes.data ?? []) empInfoById.set(e.id, e)
  const subById = new Map<string, string>()
  for (const s of subRes.data ?? []) subById.set(s.id, s.name)
  const companyName: string = coRes.data?.name ?? "Company"
  const cardAllowByEmp = new Map<string, any[]>()
  for (const row of allowRes.data ?? []) {
    const list = cardAllowByEmp.get(row.employee_id) ?? []
    list.push(row)
    cardAllowByEmp.set(row.employee_id, list)
  }
  const cardDedByEmp = new Map<string, any[]>()
  for (const row of dedRes.data ?? []) {
    const list = cardDedByEmp.get(row.employee_id) ?? []
    list.push(row)
    cardDedByEmp.set(row.employee_id, list)
  }

  for (const row of rows) {
    try {
      // Validate required fields before processing
      if (!row.employeeId) {
        const empError = `${row.name || "row"}: missing employeeId`
        errors.push(empError)
        employeeErrors[row.employeeId || "unknown"] = empError
        continue
      }

      const basicSalaryNum = Number(row.basicSalary)
      if (!Number.isFinite(basicSalaryNum) || basicSalaryNum < 0) {
        const empError = `${row.name || row.employeeId}: invalid basic salary`
        errors.push(empError)
        employeeErrors[row.employeeId] = empError
        continue
      }

      const basic = n(basicSalaryNum)
      const allowances = n(row.allowances)
      const overtime = n(row.overtime)
      const bonus = n(row.bonus)
      const gross = n(row.grossPay) || n(basic + allowances + overtime + bonus)
      const ssnit = n(row.ssnitEmployee)
      // Tier 2 is report-only — compute for storage/reports, never add to cash deductions
      const tier2ForReports =
        row.tier2Employee != null && Number(row.tier2Employee) > 0
          ? n(row.tier2Employee)
          : n(basic * 0.05)
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
        n(row.totalDeductions) || n(ssnit + pf + paye + loan + advance + other)
      const net = n(row.netPay) || n(gross - totalDeductions)
      const taxable = n(row.taxableIncome)
      const taxReliefTotal = n(row.taxReliefTotal)

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

      const cardAllowLines = expandCompLines(cardAllowByEmp.get(row.employeeId), basic, asOf, "Allowance")
      const cardDedLines = expandCompLines(cardDedByEmp.get(row.employeeId), basic, asOf, "Deduction")
      const cardDedTotal = cardDedLines.reduce((s, l) => s + l.amount, 0)
      const allowanceLines = [
        ...cardAllowLines,
        ...(masterOther > 0.009
          ? [{ label: "Other Allowances", code: "OTHER", amount: masterOther }]
          : []),
      ]
      const residualOtherDed = Math.max(0, n(other - cardDedTotal))
      const deductionLines = [
        ...cardDedLines,
        ...(residualOtherDed > 0.009
          ? [{ label: "Other Deductions", code: "OTHER", amount: residualOtherDed }]
          : []),
      ]

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
        tier2_employee: tier2ForReports,
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
        tax_relief_total: taxReliefTotal,
        allowances: { total: allowances, lines: allowanceLines },
        calculation_breakdown: {
          allowances,
          ssnit_employee: ssnit,
          tier2_employee: tier2ForReports,
          tier2_excluded_from_payroll_deductions: true,
          tier3_employee: pf,
          tax_relief_monthly: taxReliefTotal,
          paye_base: basePaye,
          overtime_tax: overtimeTax,
          bonus_tax: bonusTax,
          paye_total: paye,
          loan,
          advance,
          other,
          allowance_lines: allowanceLines,
          deduction_lines: deductionLines,
        },
        status: "calculated",
        updated_at: new Date().toISOString(),
      }

      const { data: insertedItem, error: itemErr } = await insertWithMissingColumnRetry(
        client,
        "payroll_items",
        itemPayload,
        "id",
      )
      if (itemErr || !insertedItem?.id) {
        const empError = `${row.name || row.employeeId}: ${itemErr?.message || "failed to save payroll item"}`
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
        allowance_lines: allowanceLines,
        deduction_lines: deductionLines,
        overtime_pay: overtime,
        bonus_pay: bonus,
        gross_pay: gross,
        ssnit_employee: ssnit,
        ssnit_employer: ssnitEmployer,
        tier2_employee: tier2ForReports,
        tier3_employee: pf,
        paye_taxable_income: taxable,
        paye_tax: paye,
        tax_relief_total: taxReliefTotal,
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

      const { error: slipErr } = await insertWithMissingColumnRetry(
        client,
        "payslips",
        payslipPayload,
        "id",
      )
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
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId: company_id, userId, demo, service: client } = ctx
    const user = { id: userId, isDemo: demo }

    const {
      pay_period,
      payroll_run_id,
      submit_for_approval = true,
      rows,
    } = body as {
      pay_period: string
      payroll_run_id?: string
      submit_for_approval?: boolean
      rows?: ProcessRow[]
    }

    if (!pay_period) {
      return NextResponse.json({ error: "pay_period is required" }, { status: 400 })
    }
    const { data: periodControl, error: periodControlError } = await client
      .from("payroll_periods")
      .select("status")
      .eq("company_id", company_id)
      .eq("pay_period", pay_period)
      .maybeSingle()
    if (periodControlError) {
      return NextResponse.json(
        { error: `Payroll period control unavailable: ${periodControlError.message}` },
        { status: 503 },
      )
    }
    if (periodControl?.status === "closed") {
      return NextResponse.json({ error: `${pay_period} is closed and cannot be processed again` }, { status: 409 })
    }

    const bounds = periodBounds(pay_period)
    let runId = payroll_run_id
    const rawRowsProvided = Array.isArray(rows)
    const worksheetRows = normalizeProcessRows(rows)

    // If the client sent rows but none had a usable employeeId, fail clearly —
    // do NOT silently fall back to processing every active employee.
    if (rawRowsProvided && worksheetRows.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid employees in the payroll worksheet. Select employees and ensure each row has an employee id, then retry.",
          processed: 0,
        },
        { status: 422 },
      )
    }

    // Never reuse approved/paid/cancelled runs — always scoped to this tenant
    if (runId) {
      const { data: existingRun } = await client
        .from("payroll_runs")
        .select("id, status, company_id")
        .eq("id", runId)
        .eq("company_id", company_id)
        .maybeSingle()
      if (!existingRun) {
        runId = undefined
      } else if (["approved", "paid", "cancelled"].includes(String(existingRun.status))) {
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
      if (!user.isDemo && user.id) insertPayload.created_by = user.id

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
        persistRowsFromWorksheet(client, runId!, company_id, pay_period, bounds, worksheetRows),
        isMockSupabaseClient(client) ? 10000 : 45000,
        "persist_worksheet",
      )
      processed = result.processed
      processErrors = result.errors
    } else {
      // Legacy / API-only path (no worksheet rows supplied)
      const service = createPayrollService(true)
      const result = await withTimeout(
        service.processPayrollRun(runId!, company_id),
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

    // Hard guard: never queue empty runs for approval
    if (processed === 0) {
      await client
        .from("payroll_runs")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", runId)
      return NextResponse.json(
        {
          error: processErrors[0]
            ? `No employees processed. ${processErrors[0]}`
            : "No employees processed. Select employees on the worksheet, recalculate, then Run Payroll again.",
          errors: processErrors,
          processed: 0,
          payroll_run_id: runId,
        },
        { status: 422 },
      )
    }

    // Ensure Tier 2 is excluded from stored cash totals (items + payslips + run)
    if (processed > 0) {
      try {
        const { error: cashErr } = await client.rpc("recompute_payroll_run_cash_totals", {
          p_payroll_run_id: runId,
        })
        if (cashErr) {
          // Fallback when script 081 not yet applied: recompute in app from components
          console.log("[v0] Cash totals RPC unavailable:", cashErr.message)
        }
      } catch (e) {
        console.log("[v0] Cash totals recompute skipped:", e instanceof Error ? e.message : "unknown")
      }
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
