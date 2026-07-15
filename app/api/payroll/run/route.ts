/**
 * POST /api/payroll/run
 *
 * Processes a payroll run: for each employee in the payload, calculates
 * their taxes via the Ghana Tax Engine, saves a draft payslip row,
 * then optionally issues all payslips if issue=true is set.
 *
 * Body shape:
 * {
 *   company_id: string
 *   payroll_run_id: string      // pre-created payroll_run row ID
 *   pay_period: string          // e.g. "June 2025"
 *   pay_period_start: string    // ISO date
 *   pay_period_end: string      // ISO date
 *   pay_date: string            // ISO date
 *   issue: boolean              // true to immediately issue all payslips
 *   employees: Array<{
 *     employee_id: string
 *     monthly_basic: number
 *     monthly_allowances: { transport?: number; housing?: number; medical?: number; other?: number }
 *     tier2_applicable?: boolean
 *     tier3_applicable?: boolean
 *     loan_deduction?: number
 *     advance_deduction?: number
 *     other_deductions?: number
 *     loan_balance?: number
 *   }>
 * }
 */

import { NextResponse } from "next/server"
import { calculateEmployeeTax } from "@/lib/ghana-tax/tax-config-service"
import { createPayslip, issuePayrollRunPayslips } from "@/lib/services/payslip-service"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      company_id,
      payroll_run_id,
      pay_period,
      pay_period_start,
      pay_period_end,
      pay_date,
      issue = false,
      employees,
    } = body as {
      company_id: string
      payroll_run_id: string
      pay_period: string
      pay_period_start: string
      pay_period_end: string
      pay_date: string
      issue: boolean
      employees: Array<{
        employee_id: string
        payroll_item_id?: string
        monthly_basic: number
        monthly_allowances: {
          transport?: number
          housing?: number
          medical?: number
          meal?: number
          communication?: number
          other?: number
        }
        monthly_overtime?: number
        monthly_bonus?: number
        tier2_applicable?: boolean
        tier3_applicable?: boolean
        loan_deduction?: number
        advance_deduction?: number
        other_deductions?: number
        loan_balance?: number
      }>
    }

    if (!company_id || !payroll_run_id || !employees?.length) {
      return NextResponse.json(
        { error: "Missing required fields: company_id, payroll_run_id, employees" },
        { status: 400 }
      )
    }

    const results: { employee_id: string; payslip_id: string | null; error: string | null }[] = []

    for (const emp of employees) {
      try {
        // Calculate tax for this employee
        const taxResult = await calculateEmployeeTax(
          {
            monthly_basic: emp.monthly_basic,
            monthly_allowances: emp.monthly_allowances ?? {},
            monthly_overtime: emp.monthly_overtime ?? 0,
            monthly_bonus: emp.monthly_bonus ?? 0,
            tier2_applicable: emp.tier2_applicable ?? true,
            tier3_applicable: emp.tier3_applicable ?? false,
          },
          company_id,
          emp.employee_id
        )

        // Save payslip row (draft)
        const { data: payslip, error: psError } = await createPayslip({
          payroll_run_id,
          payroll_item_id: emp.payroll_item_id,
          employee_id: emp.employee_id,
          company_id,
          pay_period,
          pay_period_start,
          pay_period_end,
          pay_date,
          loan_deduction: emp.loan_deduction ?? 0,
          advance_deduction: emp.advance_deduction ?? 0,
          other_deductions: emp.other_deductions ?? 0,
          loan_balance: emp.loan_balance ?? 0,
          tax_result: taxResult,
        })

        results.push({
          employee_id: emp.employee_id,
          payslip_id: payslip?.id ?? null,
          error: psError,
        })
      } catch (empError) {
        results.push({
          employee_id: emp.employee_id,
          payslip_id: null,
          error: empError instanceof Error ? empError.message : "Unknown error",
        })
      }
    }

    // Issue all draft payslips if requested
    let issueResult: { issued: number; alreadyIssued: number; error: string | null } | null = null
    if (issue) {
      issueResult = await issuePayrollRunPayslips(payroll_run_id)
    }

    const successful = results.filter((r) => r.payslip_id && !r.error).length
    const failed     = results.filter((r) => r.error).length

    return NextResponse.json({
      success: true,
      summary: {
        total: employees.length,
        successful,
        failed,
        issued: issueResult?.issued ?? 0,
      },
      results,
      ...(issueResult ? { issue: issueResult } : {}),
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Payroll run failed"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// GET /api/payroll/run?payroll_run_id=...
// Returns all payslips for a payroll run (admin view)
// ---------------------------------------------------------------------------

import { getPayrollRunPayslips } from "@/lib/services/payslip-service"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const payrollRunId = searchParams.get("payroll_run_id")

    if (!payrollRunId) {
      return NextResponse.json({ error: "payroll_run_id is required" }, { status: 400 })
    }

    const { data, error } = await getPayrollRunPayslips(payrollRunId)
    if (error) return NextResponse.json({ error }, { status: 500 })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Failed to fetch payroll run"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
