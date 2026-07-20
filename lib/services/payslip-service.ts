/**
 * Payslip Service
 *
 * Handles:
 *   - Fetching payslips for a specific employee (self-service)
 *   - Fetching all payslips for an admin/HR view
 *   - Creating payslips from a payroll run item (via tax engine)
 *   - Marking payslips as viewed/issued
 */

import { createClient } from "@/lib/supabase/server"
import type { TaxCalculationResult } from "@/lib/ghana-tax/engine"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PayslipRow {
  id: string
  payroll_item_id: string | null
  payroll_run_id: string | null
  employee_id: string
  company_id: string
  pay_period: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  // Snapshot employee data (point-in-time)
  snapshot_employee_name: string | null
  snapshot_employee_id_no: string | null
  snapshot_position: string | null
  snapshot_department: string | null
  snapshot_location: string | null
  snapshot_division: string | null
  snapshot_subsidiary: string | null
  snapshot_ssnit_number: string | null
  snapshot_bank_name: string | null
  snapshot_account_number: string | null
  snapshot_company_name: string | null
  // Earnings
  basic_salary: number
  transport_allowance: number
  housing_allowance: number
  medical_allowance: number
  meal_allowance: number
  communication_allowance: number
  other_allowances: number
  overtime_pay: number
  bonus_pay: number
  gross_pay: number
  // Deductions
  ssnit_employee: number
  ssnit_employer: number
  tier2_employee: number
  tier2_employer: number
  tier3_employee: number
  tier3_employer: number
  paye_taxable_income: number
  tax_relief_total: number
  paye_tax: number
  loan_deduction: number
  advance_deduction: number
  other_deductions: number
  total_deductions: number
  net_pay: number
  total_employer_cost: number
  loan_balance: number
  // Year-to-date accumulators
  ytd_gross: number
  ytd_net: number
  ytd_paye: number
  ytd_ssnit: number
  leave_balance: number
  // Template & notes
  template_id: string | null
  custom_notes: string | null
  // Calculated breakdown stored as JSONB
  calculation_breakdown: TaxCalculationResult | null
  // Status
  status: "draft" | "issued" | "viewed" | "archived"
  issued_at: string | null
  viewed_at: string | null
  created_at: string
  updated_at: string
}

export interface CreatePayslipInput {
  payroll_run_id: string
  payroll_item_id?: string
  employee_id: string
  company_id: string
  pay_period: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  loan_deduction?: number
  advance_deduction?: number
  other_deductions?: number
  loan_balance?: number
  tax_result: TaxCalculationResult
}

// ---------------------------------------------------------------------------
// Create a payslip from a tax calculation result
// ---------------------------------------------------------------------------

export async function createPayslip(
  input: CreatePayslipInput
): Promise<{ data: PayslipRow | null; error: string | null }> {
  const supabase = await createClient()

  const r = input.tax_result

  // Net must include loans/advances/other and OT/bonus tax (not just engine statutory net)
  const loan = input.loan_deduction ?? r.monthly_loan_deduction ?? 0
  const advance = input.advance_deduction ?? r.monthly_advance_deduction ?? 0
  const other = input.other_deductions ?? r.monthly_other_deduction ?? 0
  const totalPaye =
    r.monthly_total_paye_withheld ??
    r.monthly_paye_tax + (r.monthly_overtime_tax ?? 0) + (r.monthly_bonus_tax ?? 0)
  const pensionEmployee = r.monthly_ssnit_employee
  const totalDeductions =
    pensionEmployee +
    r.monthly_tier3_employee +
    totalPaye +
    loan +
    advance +
    other
  const grossPay = r.monthly_gross + (r.monthly_overtime ?? 0) + (r.monthly_bonus ?? 0)
  const netPay = Math.round((grossPay - totalDeductions + Number.EPSILON) * 100) / 100

  const row = {
    payroll_run_id: input.payroll_run_id,
    payroll_item_id: input.payroll_item_id ?? null,
    employee_id: input.employee_id,
    company_id: input.company_id,
    pay_period: input.pay_period,
    pay_period_start: input.pay_period_start,
    pay_period_end: input.pay_period_end,
    pay_date: input.pay_date,
    basic_salary: r.monthly_basic,
    transport_allowance: r.monthly_allowances_total > 0 ? r.monthly_gross - r.monthly_basic : 0,
    housing_allowance: 0,
    medical_allowance: 0,
    meal_allowance: 0,
    communication_allowance: 0,
    other_allowances: r.monthly_allowances_total,
    overtime_pay: r.monthly_overtime ?? 0,
    bonus_pay: r.monthly_bonus ?? 0,
    gross_pay: grossPay,
    ssnit_employee: r.monthly_ssnit_employee,
    ssnit_employer: r.monthly_ssnit_employer,
    // Tier 2 stored for reports only — not included in total_deductions / net_pay
    tier2_employee: r.monthly_tier2_employee,
    tier2_employer: r.monthly_tier2_employer,
    tier3_employee: r.monthly_tier3_employee,
    tier3_employer: r.monthly_tier3_employer,
    paye_taxable_income: r.annual_taxable_income / 12,
    tax_relief_total: r.annual_tax_reliefs / 12,
    // Total PAYE remittance includes OT tax + bonus WHT
    paye_tax: totalPaye,
    overtime_tax: r.monthly_overtime_tax ?? 0,
    bonus_tax: r.monthly_bonus_tax ?? 0,
    loan_deduction: loan,
    advance_deduction: advance,
    other_deductions: other,
    total_deductions: Math.round((totalDeductions + Number.EPSILON) * 100) / 100,
    net_pay: netPay,
    total_employer_cost: r.monthly_total_employer_cost,
    loan_balance: input.loan_balance ?? 0,
    calculation_breakdown: {
      ...r,
      monthly_loan_deduction: loan,
      monthly_advance_deduction: advance,
      monthly_other_deduction: other,
      monthly_total_paye_withheld: totalPaye,
      monthly_net_pay: netPay,
      tier2_excluded_from_payroll_deductions: true,
    } as unknown as object,
    status: "draft",
  }

  const { data, error } = await supabase
    .from("payslips")
    .insert([row])
    .select()
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as PayslipRow, error: null }
}

// ---------------------------------------------------------------------------
// Fetch payslips for a specific employee (self-service)
// ---------------------------------------------------------------------------

export async function getEmployeePayslips(
  employeeId: string,
  year?: number
): Promise<{ data: PayslipRow[]; error: string | null }> {
  const supabase = await createClient()

  let query = supabase
    .from("payslips")
    .select("*")
    .eq("employee_id", employeeId)
    .in("status", ["issued", "viewed"])
    .order("pay_date", { ascending: false })

  if (year) {
    query = query
      .gte("pay_date", `${year}-01-01`)
      .lte("pay_date", `${year}-12-31`)
  }

  const { data, error } = await query

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as PayslipRow[], error: null }
}

// ---------------------------------------------------------------------------
// Fetch a single payslip by ID
// ---------------------------------------------------------------------------

export async function getPayslipById(
  payslipId: string
): Promise<{ data: PayslipRow | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payslips")
    .select("*")
    .eq("id", payslipId)
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as PayslipRow, error: null }
}

// ---------------------------------------------------------------------------
// Mark a payslip as viewed
// ---------------------------------------------------------------------------

export async function markPayslipViewed(
  payslipId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("payslips")
    .update({ status: "viewed", viewed_at: new Date().toISOString() })
    .eq("id", payslipId)
    .eq("status", "issued")       // only if currently issued (not already viewed)

  return { success: !error, error: error?.message ?? null }
}

// ---------------------------------------------------------------------------
// Fetch all payslips for a payroll run (admin view)
// ---------------------------------------------------------------------------

export async function getPayrollRunPayslips(
  payrollRunId: string
): Promise<{ data: PayslipRow[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payslips")
    .select("*")
    .eq("payroll_run_id", payrollRunId)
    .order("snapshot_employee_name", { ascending: true })

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as PayslipRow[], error: null }
}

// ---------------------------------------------------------------------------
// Issue all draft payslips for a payroll run (calls DB function)
// ---------------------------------------------------------------------------

export async function issuePayrollRunPayslips(
  payrollRunId: string
): Promise<{ issued: number; alreadyIssued: number; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("issue_payroll_run_payslips", {
    p_payroll_run_id: payrollRunId,
  })

  if (error) return { issued: 0, alreadyIssued: 0, error: error.message }

  const row = Array.isArray(data) ? data[0] : data
  const result = (row ?? {}) as { issued?: number; already_issued?: number }
  return {
    issued: Number(result.issued ?? 0),
    alreadyIssued: Number(result.already_issued ?? 0),
    error: null,
  }
}

// ---------------------------------------------------------------------------
// Fetch payslips summary stats for an employee (for self-service dashboard)
// ---------------------------------------------------------------------------

export async function getEmployeePayslipSummary(
  employeeId: string,
  year: number = new Date().getFullYear()
): Promise<{
  totalGross: number
  totalNet: number
  totalPaye: number
  totalSsnit: number
  payslipCount: number
  latestPayDate: string | null
  error: string | null
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("payslips")
    .select("gross_pay, net_pay, paye_tax, ssnit_employee, pay_date")
    .eq("employee_id", employeeId)
    .in("status", ["issued", "viewed"])
    .gte("pay_date", `${year}-01-01`)
    .lte("pay_date", `${year}-12-31`)

  if (error) {
    return { totalGross: 0, totalNet: 0, totalPaye: 0, totalSsnit: 0, payslipCount: 0, latestPayDate: null, error: error.message }
  }

  const rows = data ?? []
  return {
    totalGross: rows.reduce((s, r) => s + Number(r.gross_pay), 0),
    totalNet: rows.reduce((s, r) => s + Number(r.net_pay), 0),
    totalPaye: rows.reduce((s, r) => s + Number(r.paye_tax), 0),
    totalSsnit: rows.reduce((s, r) => s + Number(r.ssnit_employee), 0),
    payslipCount: rows.length,
    latestPayDate: rows[0]?.pay_date ?? null,
    error: null,
  }
}
