/**
 * GET  /api/payroll/input?company_id=&pay_period=
 * POST /api/payroll/input  — upsert pay inputs; optionally sync to employee_financial
 *
 * Loads employees from `employees`, master pay from `employee_financial`,
 * period overrides from `payroll_pay_inputs`, and loan defaults from `employee_loans`.
 */

import { NextRequest, NextResponse } from "next/server"
import { resolveTenantContext, jsonError } from "@/lib/settings/resolve-tenant"
import { sumCompLines } from "@/lib/payroll/employee-comp-extras"

const ACTIVE_STATUSES = ["Active", "active", "ACTIVE"]

export async function GET(request: NextRequest) {
  try {
    const ctx = await resolveTenantContext(request)
    if (ctx instanceof NextResponse) return ctx
    const { companyId, service: supabase } = ctx

    const { searchParams } = new URL(request.url)
    const payPeriod = searchParams.get("pay_period")

    if (!payPeriod) {
      return NextResponse.json({ error: "pay_period is required" }, { status: 400 })
    }

    // Load employees first so allowance/deduction queries stay tenant-scoped
    const employeesRes = await supabase
      .from("employees")
      .select(
        `id, first_name, last_name, employee_id, department, position, status, subsidiary_id, date_of_joining,
           financial:employee_financial(
             monthly_salary, transport_allowance, housing_allowance, medical_allowance,
             meal_allowance, communication_allowance, uniform_allowance, other_allowances,
             tier2_employee_contribution, tier3_contribution,
             provident_fund_enrolled, provident_fund_rate,
             bank_name, bank_account_number, ssnit_number
           )`,
      )
      .eq("company_id", companyId)
      .in("status", ACTIVE_STATUSES)
      .order("first_name")

    let employees: any[] = employeesRes.data ?? []
    if (employeesRes.error) {
      const fallback = await supabase
        .from("employees")
        .select("id, first_name, last_name, employee_id, department, position, status, subsidiary_id, date_of_joining")
        .eq("company_id", companyId)
        .in("status", ACTIVE_STATUSES)
        .order("first_name")
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 })
      }
      const empIdsFb = (fallback.data ?? []).map((e) => e.id)
      const { data: financials } = empIdsFb.length
        ? await supabase.from("employee_financial").select("*").in("employee_id", empIdsFb)
        : { data: [] as any[] }
      const finByEmp = new Map((financials ?? []).map((f: any) => [f.employee_id, f]))
      employees = (fallback.data ?? []).map((e) => ({
        ...e,
        financial: finByEmp.get(e.id) ?? null,
      }))
    }

    const empIds = employees.map((e) => e.id)

    const [inputsRes, loansRes, allowRes, dedRes] = await Promise.all([
      supabase
        .from("payroll_pay_inputs")
        .select("*")
        .eq("company_id", companyId)
        .eq("pay_period", payPeriod),
      supabase
        .from("employee_loans")
        .select("employee_id, monthly_payment, monthly_installment, remaining_balance, status, auto_deduct, start_date, approved_at, disbursed_at, created_at, end_date")
        .eq("company_id", companyId)
        .in("status", ["active", "approved"]),
      empIds.length
        ? supabase
            .from("employee_allowances")
            .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active")
            .eq("is_active", true)
            .in("employee_id", empIds)
        : Promise.resolve({ data: [] as any[], error: null }),
      empIds.length
        ? supabase
            .from("employee_deductions")
            .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active")
            .eq("is_active", true)
            .in("employee_id", empIds)
        : Promise.resolve({ data: [] as any[], error: null }),
    ])

    const warnings: string[] = []
    if (inputsRes.error) warnings.push(`pay_inputs: ${inputsRes.error.message}`)
    if (loansRes.error) warnings.push(`loans: ${loansRes.error.message}`)

    const inputsByEmployee = new Map(
      (inputsRes.data ?? []).map((row) => [row.employee_id, row]),
    )
    const { isLoanInPayPeriod } = await import("@/lib/payroll/loan-summary")
    const loansByEmployee = new Map<string, { payment: number; balance: number }>()
    for (const loan of loansRes.data ?? []) {
      if (loan.auto_deduct === false) continue
      // Do not pull loans into payroll before their start / approval month
      if (!isLoanInPayPeriod(loan, payPeriod)) continue
      const prev = loansByEmployee.get(loan.employee_id) ?? { payment: 0, balance: 0 }
      const charge = Number(loan.monthly_payment ?? loan.monthly_installment ?? 0)
      loansByEmployee.set(loan.employee_id, {
        payment: prev.payment + charge,
        balance: prev.balance + Number(loan.remaining_balance ?? 0),
      })
    }

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

    // Mid-month of period for effective dating
    const asOf = `${payPeriod}-15`

    const rows = employees.map((emp: any) => {
      const fin = Array.isArray(emp.financial) ? emp.financial[0] : emp.financial
      const input = inputsByEmployee.get(emp.id)
      const loan = loansByEmployee.get(emp.id)
      const basic = Number(fin?.monthly_salary ?? 0)
      const cardAllow = sumCompLines(cardAllowByEmp.get(emp.id), basic, asOf)
      const cardDed = sumCompLines(cardDedByEmp.get(emp.id), basic, asOf)

      return {
        employee_id: emp.id,
        employee_code: emp.employee_id,
        full_name: `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
        department: emp.department ?? null,
        position: emp.position ?? null,
        status: emp.status ?? null,
        date_of_joining: emp.date_of_joining ?? null,
        subsidiary_id: emp.subsidiary_id ?? null,
        bank_name: fin?.bank_name ?? null,
        account_number: fin?.bank_account_number ?? null,
        ssnit_number: fin?.ssnit_number ?? null,
        master: {
          basic_salary: basic,
          transport_allowance: Number(fin?.transport_allowance ?? 0),
          housing_allowance: Number(fin?.housing_allowance ?? 0),
          medical_allowance: Number(fin?.medical_allowance ?? 0),
          meal_allowance: Number(fin?.meal_allowance ?? 0),
          communication_allowance: Number(fin?.communication_allowance ?? 0),
          uniform_allowance: Number(fin?.uniform_allowance ?? 0),
          other_allowances: Number(fin?.other_allowances ?? 0),
          // Employee-module card comps (added at process + worksheet preview; not stored in pay_inputs)
          card_allowances: cardAllow,
          card_deductions: cardDed,
          tier2_applicable: Number(fin?.tier2_employee_contribution ?? 0) >= 0,
          tier3_applicable:
            Boolean(fin?.provident_fund_enrolled) ||
            Number(fin?.provident_fund_rate ?? 0) > 0 ||
            Number(fin?.tier3_contribution ?? 0) > 0,
          provident_fund_rate: Number(fin?.provident_fund_rate ?? 0),
        },
        input: input
          ? {
              id: input.id,
              basic_salary: input.basic_salary,
              transport_allowance: input.transport_allowance,
              housing_allowance: input.housing_allowance,
              medical_allowance: input.medical_allowance,
              meal_allowance: input.meal_allowance,
              communication_allowance: input.communication_allowance,
              uniform_allowance: input.uniform_allowance,
              other_allowances: input.other_allowances,
              overtime_amount: Number(input.overtime_amount ?? 0),
              bonus_amount: Number(input.bonus_amount ?? 0),
              loan_deduction: Number(input.loan_deduction ?? loan?.payment ?? 0),
              advance_deduction: Number(input.advance_deduction ?? 0),
              other_deductions: Number(input.other_deductions ?? 0),
              tier2_applicable: input.tier2_applicable ?? true,
              tier3_applicable:
                input.tier3_applicable ??
                (Boolean(fin?.provident_fund_enrolled) || Number(fin?.provident_fund_rate ?? 0) > 0),
              tier3_employee_rate: Number(
                input.tier3_employee_rate ?? fin?.provident_fund_rate ?? 0,
              ),
              apply_to_master: Boolean(input.apply_to_master),
              notes: input.notes ?? "",
              status: input.status,
            }
          : {
              id: null,
              basic_salary: null,
              transport_allowance: null,
              housing_allowance: null,
              medical_allowance: null,
              meal_allowance: null,
              communication_allowance: null,
              uniform_allowance: null,
              other_allowances: null,
              overtime_amount: 0,
              bonus_amount: 0,
              loan_deduction: loan?.payment ?? 0,
              advance_deduction: 0,
              other_deductions: 0,
              tier2_applicable: true,
              tier3_applicable:
                Boolean(fin?.provident_fund_enrolled) ||
                Number(fin?.provident_fund_rate ?? 0) > 0 ||
                Number(fin?.tier3_contribution ?? 0) > 0,
              tier3_employee_rate: Number(fin?.provident_fund_rate ?? 0),
              apply_to_master: false,
              notes: "",
              status: "draft",
            },
        loan_balance: loan?.balance ?? 0,
      }
    })

    return NextResponse.json({
      success: true,
      pay_period: payPeriod,
      company_id: companyId,
      rows,
      meta: {
        employee_count: rows.length,
        inputs_saved: inputsRes.data?.length ?? 0,
        loans_linked: loansByEmployee.size,
        warnings,
        fetched_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load pay inputs" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveTenantContext(request, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    const { companyId: company_id, service: supabase } = ctx

    const { pay_period, pay_period_start, pay_period_end, rows } = body as {
      pay_period: string
      pay_period_start?: string
      pay_period_end?: string
      rows: Array<Record<string, unknown>>
    }

    if (!pay_period || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "pay_period and rows are required" },
        { status: 400 },
      )
    }

    const upserts = rows.map((row) => ({
      company_id,
      employee_id: row.employee_id,
      pay_period,
      pay_period_start: pay_period_start ?? null,
      pay_period_end: pay_period_end ?? null,
      basic_salary: row.basic_salary ?? null,
      transport_allowance: row.transport_allowance ?? null,
      housing_allowance: row.housing_allowance ?? null,
      medical_allowance: row.medical_allowance ?? null,
      meal_allowance: row.meal_allowance ?? null,
      communication_allowance: row.communication_allowance ?? null,
      uniform_allowance: row.uniform_allowance ?? null,
      other_allowances: row.other_allowances ?? null,
      overtime_amount: Number(row.overtime_amount ?? 0),
      bonus_amount: Number(row.bonus_amount ?? 0),
      loan_deduction: Number(row.loan_deduction ?? 0),
      advance_deduction: Number(row.advance_deduction ?? 0),
      other_deductions: Number(row.other_deductions ?? 0),
      tier2_applicable: row.tier2_applicable !== false,
      tier3_applicable: Boolean(row.tier3_applicable),
      tier3_employee_rate: Number(row.tier3_employee_rate ?? 0),
      apply_to_master: Boolean(row.apply_to_master),
      notes: row.notes ?? null,
      status: (row.status as string) || "approved",
      updated_at: new Date().toISOString(),
    }))

    const { data, error } = await supabase
      .from("payroll_pay_inputs")
      .upsert(upserts, { onConflict: "company_id,employee_id,pay_period" })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const masterSyncErrors: string[] = []
    for (const row of upserts) {
      if (!row.apply_to_master) continue
      const patch: Record<string, number> = {}
      if (row.basic_salary != null) patch.monthly_salary = Number(row.basic_salary)
      if (row.transport_allowance != null) patch.transport_allowance = Number(row.transport_allowance)
      if (row.housing_allowance != null) patch.housing_allowance = Number(row.housing_allowance)
      if (row.medical_allowance != null) patch.medical_allowance = Number(row.medical_allowance)
      if (row.meal_allowance != null) patch.meal_allowance = Number(row.meal_allowance)
      if (row.communication_allowance != null)
        patch.communication_allowance = Number(row.communication_allowance)
      if (row.uniform_allowance != null) patch.uniform_allowance = Number(row.uniform_allowance)
      if (row.other_allowances != null) patch.other_allowances = Number(row.other_allowances)

      if (Object.keys(patch).length === 0) continue

      const { error: finError } = await supabase
        .from("employee_financial")
        .upsert(
          { employee_id: row.employee_id as string, ...patch, updated_at: new Date().toISOString() },
          { onConflict: "employee_id" },
        )

      if (finError) {
        masterSyncErrors.push(`${row.employee_id}: ${finError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      saved: data?.length ?? 0,
      master_sync_errors: masterSyncErrors,
      fetched_at: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save pay inputs" },
      { status: 500 },
    )
  }
}
