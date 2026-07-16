/**
 * GET  /api/payroll/input?company_id=&pay_period=
 * POST /api/payroll/input  — upsert pay inputs; optionally sync to employee_financial
 */

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("company_id")
    const payPeriod = searchParams.get("pay_period")

    if (!companyId || !payPeriod) {
      return NextResponse.json({ error: "company_id and pay_period are required" }, { status: 400 })
    }

    // Load master financial + any period inputs in parallel for fast sync
    const [employeesRes, inputsRes, loansRes] = await Promise.all([
      supabase
        .from("employees")
        .select(
          `id, first_name, last_name, employee_id, department, status,
           financial:employee_financial(
             monthly_salary, transport_allowance, housing_allowance, medical_allowance,
             meal_allowance, communication_allowance, uniform_allowance, other_allowances,
             tier2_employee_contribution, tier3_contribution
           )`,
        )
        .eq("company_id", companyId)
        .eq("status", "Active")
        .order("first_name"),
      supabase
        .from("payroll_pay_inputs")
        .select("*")
        .eq("company_id", companyId)
        .eq("pay_period", payPeriod),
      supabase
        .from("employee_loans")
        .select("employee_id, monthly_payment, status, remaining_balance")
        .eq("company_id", companyId)
        .in("status", ["active", "approved"]),
    ])

    if (employeesRes.error) {
      return NextResponse.json({ error: employeesRes.error.message }, { status: 500 })
    }

    const inputsByEmployee = new Map(
      (inputsRes.data ?? []).map((row) => [row.employee_id, row]),
    )
    const loansByEmployee = new Map<string, number>()
    for (const loan of loansRes.data ?? []) {
      const prev = loansByEmployee.get(loan.employee_id) ?? 0
      loansByEmployee.set(loan.employee_id, prev + Number(loan.monthly_payment ?? 0))
    }

    const rows = (employeesRes.data ?? []).map((emp) => {
      const fin = Array.isArray(emp.financial) ? emp.financial[0] : emp.financial
      const input = inputsByEmployee.get(emp.id)
      const loanDefault = loansByEmployee.get(emp.id) ?? 0

      return {
        employee_id: emp.id,
        employee_code: emp.employee_id,
        full_name: `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
        department: emp.department,
        master: {
          basic_salary: Number(fin?.monthly_salary ?? 0),
          transport_allowance: Number(fin?.transport_allowance ?? 0),
          housing_allowance: Number(fin?.housing_allowance ?? 0),
          medical_allowance: Number(fin?.medical_allowance ?? 0),
          meal_allowance: Number(fin?.meal_allowance ?? 0),
          communication_allowance: Number(fin?.communication_allowance ?? 0),
          uniform_allowance: Number(fin?.uniform_allowance ?? 0),
          other_allowances: Number(fin?.other_allowances ?? 0),
          tier2_applicable: Number(fin?.tier2_employee_contribution ?? 0) >= 0,
          tier3_applicable: Number(fin?.tier3_contribution ?? 0) > 0,
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
              loan_deduction: Number(input.loan_deduction ?? 0),
              advance_deduction: Number(input.advance_deduction ?? 0),
              other_deductions: Number(input.other_deductions ?? 0),
              tier2_applicable: input.tier2_applicable ?? true,
              tier3_applicable: input.tier3_applicable ?? false,
              tier3_employee_rate: Number(input.tier3_employee_rate ?? 0),
              apply_to_master: Boolean(input.apply_to_master),
              notes: input.notes,
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
              loan_deduction: loanDefault,
              advance_deduction: 0,
              other_deductions: 0,
              tier2_applicable: true,
              tier3_applicable: Number(fin?.tier3_contribution ?? 0) > 0,
              tier3_employee_rate: 0,
              apply_to_master: false,
              notes: "",
              status: "draft",
            },
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { company_id, pay_period, pay_period_start, pay_period_end, rows } = body as {
      company_id: string
      pay_period: string
      pay_period_start?: string
      pay_period_end?: string
      rows: Array<Record<string, unknown>>
    }

    if (!company_id || !pay_period || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "company_id, pay_period, and rows are required" },
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

    // Sync selected rows back to employee_financial master
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
