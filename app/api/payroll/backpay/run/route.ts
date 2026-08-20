import { NextRequest, NextResponse } from "next/server"
import { calculateGhanaTax, DEFAULT_TAX_RATES, round2 } from "@/lib/ghana-tax/engine"
import { isUnresolvedTenant, jsonError, resolveTenantContext } from "@/lib/settings/resolve-tenant"

function bounds(period: string) {
  const [year, month] = period.split("-").map(Number)
  const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10)
  const end = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)
  return { start, end }
}

function componentAmount(row: any, basicSalary: number) {
  let value =
    row.calculation_type === "percentage"
      ? (basicSalary * Number(row.percentage || 0)) / 100
      : row.calculation_type === "rate_x_quantity"
        ? Number(row.rate || 0) * Number(row.quantity || 0)
        : Number(row.amount || 0)
  if (row.min_amount != null) value = Math.max(value, Number(row.min_amount))
  if (row.max_amount != null) value = Math.min(value, Number(row.max_amount))
  return round2(value)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const ctx = await resolveTenantContext(req, body.company_id)
    if (ctx instanceof NextResponse) return ctx
    if (isUnresolvedTenant(ctx)) return NextResponse.json({ error: "Company not resolved" }, { status: 400 })
    const { companyId, userId, service } = ctx
    const period = String(body.pay_period || "")
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      return NextResponse.json({ error: "pay_period must use YYYY-MM" }, { status: 400 })
    }

    const { data: periodControl, error: periodControlError } = await service
      .from("payroll_periods")
      .select("status")
      .eq("company_id", companyId)
      .eq("pay_period", period)
      .maybeSingle()
    if (periodControlError) {
      return NextResponse.json(
        { error: `Payroll period control unavailable: ${periodControlError.message}` },
        { status: 503 },
      )
    }
    if (periodControl?.status === "closed") {
      return NextResponse.json({ error: `${period} is closed and cannot accept an off-cycle run` }, { status: 409 })
    }

    const { data: assignments, error: assignmentError } = await service
      .from("payroll_component_assignments")
      .select("*, employee:employees(id, employee_id, first_name, last_name, department, position, employee_financial(monthly_salary, bank_name, bank_account_number, ssnit_number))")
      .eq("company_id", companyId)
      .eq("category", "backpay")
      .eq("status", "active")
      .eq("approval_status", "approved")
      .lte("effective_period", period)
      .or(`end_period.is.null,end_period.gte.${period}`)
    if (assignmentError) throw assignmentError
    const separate = (assignments || []).filter(
      (row: any) =>
        row.payment_method === "separate_run" ||
        row.backpay_treatment === "separate_run",
    )
    if (!separate.length) {
      return NextResponse.json({ error: "No approved separate-run backpay entries exist for this period" }, { status: 409 })
    }

    const grouped = new Map<string, { employee: any; assignments: any[]; basic: number; amount: number }>()
    for (const assignment of separate) {
      const employee = Array.isArray(assignment.employee) ? assignment.employee[0] : assignment.employee
      if (!employee?.id) continue
      const financial = Array.isArray(employee.employee_financial)
        ? employee.employee_financial[0]
        : employee.employee_financial
      const basic = Number(financial?.monthly_salary || 0)
      const existing = grouped.get(employee.id) || { employee, assignments: [], basic, amount: 0 }
      existing.assignments.push(assignment)
      existing.amount = round2(existing.amount + componentAmount(assignment, basic))
      grouped.set(employee.id, existing)
    }
    if (!grouped.size) return NextResponse.json({ error: "Backpay employees could not be resolved" }, { status: 422 })

    const { start, end } = bounds(period)
    const totals = { gross: 0, deductions: 0, net: 0 }
    const calculated = [...grouped.values()].map((entry) => {
      const tax = calculateGhanaTax(
        {
          monthly_basic: 0,
          monthly_allowances: { other: entry.amount },
          monthly_overtime: 0,
          monthly_bonus: 0,
          tier2_applicable: false,
          tier3_applicable: false,
          other_deductions: {},
        },
        DEFAULT_TAX_RATES,
      )
      totals.gross = round2(totals.gross + entry.amount)
      totals.deductions = round2(totals.deductions + tax.monthly_total_employee_deductions)
      totals.net = round2(totals.net + tax.monthly_net_pay)
      return { ...entry, tax }
    })

    const assignmentIds = separate.map((row: any) => row.id)
    const { data: run, error: runError } = await service
      .from("payroll_runs")
      .insert({
        company_id: companyId,
        pay_period_start: start,
        pay_period_end: end,
        pay_date: body.pay_date || end,
        status: "pending",
        approval_stage: "pending",
        run_type: "backpay",
        off_cycle_reason: body.reason || "Correction",
        skip_regular_deductions: body.skip_regular_deductions !== false,
        component_assignment_ids: assignmentIds,
        employee_count: calculated.length,
        total_gross_pay: totals.gross,
        total_deductions: totals.deductions,
        total_net_pay: totals.net,
        notes: body.notes || `Separate backpay run for ${period}`,
        created_by: userId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (runError) throw runError

    const items = calculated.map(({ employee, assignments: employeeAssignments, amount, tax }) => ({
      payroll_run_id: run.id,
      employee_id: employee.id,
      company_id: companyId,
      pay_period: period,
      basic_salary: 0,
      allowances: { backpay: amount },
      deductions: {},
      bonus_pay: 0,
      gross_pay: amount,
      ssnit_employee: 0,
      ssnit_employer: 0,
      tier2_employee: 0,
      tier3_employee: 0,
      paye_tax: tax.monthly_total_paye_withheld,
      tax_deduction: tax.monthly_total_paye_withheld,
      total_deductions: tax.monthly_total_employee_deductions,
      net_pay: tax.monthly_net_pay,
      taxable_income: tax.monthly_taxable_income,
      paye_taxable_income: tax.monthly_taxable_income,
      calculation_breakdown: {
        run_type: "backpay",
        component_assignment_ids: employeeAssignments.map((row: any) => row.id),
        source_periods: [...new Set(employeeAssignments.map((row: any) => row.source_period).filter(Boolean))],
      },
      status: "calculated",
    }))
    const { data: insertedItems, error: itemError } = await service.from("payroll_items").insert(items).select("id, employee_id")
    if (itemError) throw itemError
    const itemByEmployee = new Map((insertedItems || []).map((item: any) => [item.employee_id, item.id]))

    const payslips = calculated.map(({ employee, amount, tax }) => {
      const financial = Array.isArray(employee.employee_financial)
        ? employee.employee_financial[0]
        : employee.employee_financial
      return {
        payroll_item_id: itemByEmployee.get(employee.id),
        payroll_run_id: run.id,
        employee_id: employee.id,
        company_id: companyId,
        pay_period: period,
        pay_period_start: start,
        pay_period_end: end,
        pay_date: body.pay_date || end,
        snapshot_employee_name: `${employee.first_name || ""} ${employee.last_name || ""}`.trim(),
        snapshot_employee_id_no: employee.employee_id,
        snapshot_position: employee.position,
        snapshot_department: employee.department,
        snapshot_bank_name: financial?.bank_name,
        snapshot_account_number: financial?.bank_account_number,
        snapshot_ssnit_number: financial?.ssnit_number,
        basic_salary: 0,
        other_allowances: amount,
        gross_pay: amount,
        paye_tax: tax.monthly_total_paye_withheld,
        total_deductions: tax.monthly_total_employee_deductions,
        net_pay: tax.monthly_net_pay,
        status: "draft",
      }
    })
    const { error: payslipError } = await service.from("payslips").insert(payslips)
    if (payslipError) throw payslipError

    return NextResponse.json({
      success: true,
      run,
      employee_count: calculated.length,
      assignment_count: separate.length,
      totals,
      message: "Backpay run created and sent for approval",
    })
  } catch (error) {
    return jsonError(error, "Failed to create separate backpay run")
  }
}
