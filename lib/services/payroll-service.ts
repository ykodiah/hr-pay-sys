import { BaseService } from "./base-service"
import type { PayrollRun, PayrollItem, CreatePayrollRunInput, UpdatePayrollRunInput, ServiceResponse } from "./types"
import { calculateEmployeeTax, getTaxRates } from "@/lib/ghana-tax/tax-config-service"
import type { EmployeePayInput, TaxCalculationResult } from "@/lib/ghana-tax/engine"
import { expandCompLines, sumCompLines } from "@/lib/payroll/employee-comp-extras"
import { isLoanInPayPeriod } from "@/lib/payroll/loan-summary"

const SYSTEM_DEDUCTION_CODES = new Set(["LOAN", "ADVANCE", "SAL_ADV", "STAFF_LOAN"])

function componentAssignmentValue(row: any, basic: number) {
  let value =
    row.calculation_type === "percentage"
      ? (basic * Number(row.percentage || 0)) / 100
      : row.calculation_type === "rate_x_quantity"
        ? Number(row.rate || 0) * Number(row.quantity || 0)
        : Number(row.amount || 0)
  if (row.min_amount != null) value = Math.max(value, Number(row.min_amount))
  if (row.max_amount != null) value = Math.min(value, Number(row.max_amount))
  return value
}

export class PayrollService extends BaseService {
  async getPayrollRuns(
    companyId: string,
    options?: { page?: number; pageSize?: number; status?: string }
  ): Promise<ServiceResponse<any>> {
    const filters = [{ column: "company_id", operator: "eq" as const, value: companyId }]

    if (options?.status && options.status !== "all") {
      filters.push({ column: "status", operator: "eq" as const, value: options.status })
    }

    return this.handleListRequest<PayrollRun>(
      "payroll_runs",
      "*",
      filters,
      [{ column: "pay_date", order: "desc" }],
      { page: options?.page, pageSize: options?.pageSize }
    )
  }

  async getPayrollRunById(payrollRunId: string): Promise<ServiceResponse<PayrollRun>> {
    return this.handleRequest<PayrollRun>(async (client) => {
      const { data, error } = await client.from("payroll_runs").select("*").eq("id", payrollRunId).single()

      if (error) throw error
      return data
    }, "GET_PAYROLL_RUN_ERROR")
  }

  async createPayrollRun(data: CreatePayrollRunInput & { company_id: string }): Promise<ServiceResponse<PayrollRun>> {
    return this.handleRequest<PayrollRun>(async (client) => {
      const { data: created, error } = await client
        .from("payroll_runs")
        .insert([{ ...data, status: "draft" }])
        .select()
        .single()

      if (error) throw error
      return created
    }, "CREATE_PAYROLL_RUN_ERROR")
  }

  async updatePayrollRun(payrollRunId: string, data: UpdatePayrollRunInput): Promise<ServiceResponse<PayrollRun>> {
    return this.handleRequest<PayrollRun>(async (client) => {
      const updateData: any = { ...data, updated_at: new Date().toISOString() }

      const { data: updated, error } = await client
        .from("payroll_runs")
        .update(updateData)
        .eq("id", payrollRunId)
        .select()
        .single()

      if (error) throw error
      return updated
    }, "UPDATE_PAYROLL_RUN_ERROR")
  }

  async approvePayrollRun(payrollRunId: string, approvedBy: string): Promise<ServiceResponse<PayrollRun>> {
    return this.updatePayrollRun(payrollRunId, {
      status: "approved",
      approved_by: approvedBy,
    })
  }

  async getPayrollItems(payrollRunId: string): Promise<ServiceResponse<PayrollItem[]>> {
    return this.handleRequest<PayrollItem[]>(async (client) => {
      const { data, error } = await client.from("payroll_items").select("*").eq("payroll_run_id", payrollRunId)

      if (error) throw error
      return data || []
    }, "GET_PAYROLL_ITEMS_ERROR")
  }

  async getEmployeePayrollItems(employeeId: string): Promise<ServiceResponse<PayrollItem[]>> {
    return this.handleRequest<PayrollItem[]>(async (client) => {
      const { data, error } = await client
        .from("payroll_items")
        .select(
          `
        *,
        payroll_run:payroll_runs(*)
      `
        )
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return data || []
    }, "GET_EMPLOYEE_PAYROLL_ERROR")
  }

  async createPayrollItem(data: Partial<PayrollItem>): Promise<ServiceResponse<PayrollItem>> {
    return this.handleRequest<PayrollItem>(async (client) => {
      const { data: created, error } = await client.from("payroll_items").insert([data]).select().single()

      if (error) throw error
      return created
    }, "CREATE_PAYROLL_ITEM_ERROR")
  }

  async updatePayrollItem(payrollItemId: string, data: Partial<PayrollItem>): Promise<ServiceResponse<PayrollItem>> {
    return this.handleRequest<PayrollItem>(async (client) => {
      const { data: updated, error } = await client
        .from("payroll_items")
        .update(data)
        .eq("id", payrollItemId)
        .select()
        .single()

      if (error) throw error
      return updated
    }, "UPDATE_PAYROLL_ITEM_ERROR")
  }

  async calculatePayrollSummary(payrollRunId: string): Promise<ServiceResponse<any>> {
    return this.handleRequest<any>(async (client) => {
      const { data: items, error } = await client
        .from("payroll_items")
        .select("*")
        .eq("payroll_run_id", payrollRunId)

      if (error) throw error

      const summary = {
        count: items?.length || 0,
        totalGrossPay: items?.reduce((sum: number, item: any) => sum + (item.gross_pay || 0), 0) || 0,
        totalDeductions: items?.reduce((sum: number, item: any) => sum + (item.total_deductions || 0), 0) || 0,
        totalNetPay: items?.reduce((sum: number, item: any) => sum + (item.net_pay || 0), 0) || 0,
        totalTax: items?.reduce((sum: number, item: any) => sum + (item.tax_deduction || 0), 0) || 0,
      }

      return summary
    }, "CALCULATE_SUMMARY_ERROR")
  }

  async getPayrollHistory(companyId: string, limit = 12): Promise<ServiceResponse<PayrollRun[]>> {
    return this.handleRequest<PayrollRun[]>(async (client) => {
      const { data, error } = await client
        .from("payroll_runs")
        .select("*")
        .eq("company_id", companyId)
        .order("pay_date", { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    }, "GET_PAYROLL_HISTORY_ERROR")
  }

  // ---------------------------------------------------------------------------
  // Ghana Tax Engine Integration
  // ---------------------------------------------------------------------------

  /**
   * Calculate Ghana tax for a single employee and persist the result into
   * the payroll_items row and generate a draft payslip.
   */
  async calculateAndSaveEmployeeTax(
    payrollRunId: string,
    employeeId: string,
    companyId: string,
    input: EmployeePayInput,
    lineItems?: {
      allowance_lines?: Array<{ label: string; code?: string | null; amount: number }>
      deduction_lines?: Array<{ label: string; code?: string | null; amount: number }>
    },
  ): Promise<ServiceResponse<{ payrollItem: PayrollItem; taxResult: TaxCalculationResult }>> {
    return this.handleRequest(async (client) => {
      const taxYear = new Date().getFullYear()
      const taxResult = await calculateEmployeeTax(input, companyId, employeeId, taxYear)

      const fullPayload: Record<string, unknown> = {
        employee_id: employeeId,
        payroll_run_id: payrollRunId,
        basic_salary: taxResult.monthly_basic,
        allowances: {
          ...input.monthly_allowances,
          lines: lineItems?.allowance_lines ?? [],
        },
        deductions_detail: {
          lines: lineItems?.deduction_lines ?? [],
        },
        gross_pay: taxResult.monthly_gross + taxResult.monthly_overtime + taxResult.monthly_bonus,
        ssnit_employee: taxResult.monthly_ssnit_employee,
        ssnit_employer: taxResult.monthly_ssnit_employer,
        tier2_employee: taxResult.monthly_tier2_employee,
        tier2_employer: taxResult.monthly_tier2_employer,
        tier3_employee: taxResult.monthly_tier3_employee,
        tier3_employer: taxResult.monthly_tier3_employer,
        paye_taxable_income: taxResult.monthly_taxable_income ?? taxResult.annual_taxable_income / 12,
        tax_relief_total: taxResult.annual_tax_reliefs / 12,
        tax_deduction: taxResult.monthly_total_paye_withheld,
        loan_deduction: taxResult.monthly_loan_deduction,
        advance_deduction: taxResult.monthly_advance_deduction,
        other_deductions: taxResult.monthly_other_deduction,
        overtime_pay: taxResult.monthly_overtime,
        bonus_pay: taxResult.monthly_bonus,
        total_deductions: taxResult.monthly_total_employee_deductions,
        net_pay: taxResult.monthly_net_pay,
        tax_year: taxYear,
        calculation_breakdown: {
          ...taxResult,
          allowance_lines: lineItems?.allowance_lines ?? [],
          deduction_lines: lineItems?.deduction_lines ?? [],
          calculated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }

      // Progressive fallbacks for older payroll_items schemas
      const payloads: Record<string, unknown>[] = [
        fullPayload,
        {
          employee_id: employeeId,
          payroll_run_id: payrollRunId,
          basic_salary: fullPayload.basic_salary,
          gross_pay: fullPayload.gross_pay,
          total_deductions: fullPayload.total_deductions,
          net_pay: fullPayload.net_pay,
          tax_deduction: fullPayload.tax_deduction,
          ssnit_employee: fullPayload.ssnit_employee,
          loan_deduction: fullPayload.loan_deduction,
          overtime_pay: fullPayload.overtime_pay,
          updated_at: fullPayload.updated_at,
        },
        {
          employee_id: employeeId,
          payroll_run_id: payrollRunId,
          basic_salary: fullPayload.basic_salary,
          gross_pay: fullPayload.gross_pay,
          total_deductions: fullPayload.total_deductions,
          net_pay: fullPayload.net_pay,
        },
      ]

      const { data: existingItem } = await client
        .from("payroll_items")
        .select("id")
        .eq("payroll_run_id", payrollRunId)
        .eq("employee_id", employeeId)
        .maybeSingle()

      let payrollItem: PayrollItem | null = null
      let lastError: string | null = null

      for (const itemPayload of payloads) {
        if (existingItem?.id) {
          const { data, error } = await client
            .from("payroll_items")
            .update(itemPayload)
            .eq("id", existingItem.id)
            .select()
            .single()
          if (!error && data) {
            payrollItem = data
            break
          }
          lastError = error?.message || lastError
        } else {
          const { data, error } = await client
            .from("payroll_items")
            .insert(itemPayload)
            .select()
            .single()
          if (!error && data) {
            payrollItem = data
            break
          }
          lastError = error?.message || lastError
        }
      }

      if (!payrollItem) {
        throw new Error(lastError || "Failed to save payroll item")
      }

      // Payslip is best-effort — do not fail the whole employee if vault/table drifts
      try {
        await this.upsertPayslip(client, payrollItem, taxResult, companyId, lineItems)
      } catch (slipErr) {
        console.warn(
          "[payroll] payslip upsert failed:",
          slipErr instanceof Error ? slipErr.message : slipErr,
        )
      }

      return { payrollItem, taxResult }
    }, "CALC_EMPLOYEE_TAX_ERROR")
  }

  /**
   * Process all employees in a payroll run — fetches each employee's financial
   * record, runs the Ghana tax engine, and saves results.
   */
  async processPayrollRun(
    payrollRunId: string,
    companyId: string
  ): Promise<ServiceResponse<{ processed: number; errors: string[] }>> {
    return this.handleRequest(async (client) => {
      // Resolve pay period for this run so we can merge Pay Inputs
      const { data: run } = await client
        .from("payroll_runs")
        .select("pay_period_start, pay_period_end")
        .eq("id", payrollRunId)
        .maybeSingle()

      const payPeriod = run?.pay_period_start
        ? String(run.pay_period_start).slice(0, 7)
        : new Date().toISOString().slice(0, 7)

      // Parallel fetch: employees + period pay inputs + loans + card allowances/deductions + pay components
      const [empRes, inputsRes, loansRes, allowRes, dedRes, componentRes] = await Promise.all([
        client
          .from("employees")
          .select(
            `id, first_name, last_name, preferred_name, employee_id, position, department,
             profile_picture, ssnit_number,
             financial:employee_financial(
               monthly_salary,
               transport_allowance, housing_allowance, medical_allowance,
               meal_allowance, communication_allowance, uniform_allowance, other_allowances,
               tier2_employee_contribution, tier2_employer_contribution, tier3_contribution,
               provident_fund_enrolled, provident_fund_rate,
               bank_name, bank_account_number
             )`,
          )
          .eq("company_id", companyId)
          .in("status", ["Active", "active", "ACTIVE"]),
        client
          .from("payroll_pay_inputs")
          .select("*")
          .eq("company_id", companyId)
          .eq("pay_period", payPeriod),
        client
          .from("employee_loans")
          .select("employee_id, monthly_payment, monthly_installment, remaining_balance, status, auto_deduct, start_date, approved_at, disbursed_at, created_at, end_date")
          .eq("company_id", companyId)
          .in("status", ["active", "approved", "disbursed"]),
        client
          .from("employee_allowances")
          .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active, recurring, code, description")
          .eq("is_active", true),
        client
          .from("employee_deductions")
          .select("employee_id, amount, percentage, calculation_type, effective_date, end_date, is_active, recurring, code, description")
          .eq("is_active", true),
        client
          .from("payroll_component_assignments")
          .select("employee_id, category, code, name, payslip_label, calculation_type, amount, percentage, rate, quantity, min_amount, max_amount, tax_treatment, backpay_treatment, payment_method, approval_status, status, employer_component")
          .eq("company_id", companyId)
          .eq("status", "active")
          .eq("approval_status", "approved")
          .lte("effective_period", payPeriod)
          .or(`end_period.is.null,end_period.gte.${payPeriod}`),
      ])

      if (empRes.error) throw empRes.error
      // loans / pay_inputs / card comps failures are non-fatal — continue with master financials

      const inputsByEmployee = new Map(
        (inputsRes.data ?? []).map((row: any) => [row.employee_id, row]),
      )
      const loansByEmployee = new Map<string, number>()
      for (const loan of loansRes.data ?? []) {
        if (loan.auto_deduct === false) continue
        if (!isLoanInPayPeriod(loan, payPeriod)) continue
        const prev = loansByEmployee.get(loan.employee_id) ?? 0
        const charge = Number(loan.monthly_payment ?? loan.monthly_installment ?? 0)
        loansByEmployee.set(loan.employee_id, prev + charge)
      }

      const cardAllowByEmp = new Map<string, any[]>()
      for (const row of allowRes.data ?? []) {
        const list = cardAllowByEmp.get(row.employee_id) ?? []
        list.push(row)
        cardAllowByEmp.set(row.employee_id, list)
      }
      const cardDedByEmp = new Map<string, any[]>()
      for (const row of dedRes.data ?? []) {
        if (SYSTEM_DEDUCTION_CODES.has(String(row.code || "").toUpperCase())) continue
        const list = cardDedByEmp.get(row.employee_id) ?? []
        list.push(row)
        cardDedByEmp.set(row.employee_id, list)
      }
      const componentsByEmp = new Map<string, any[]>()
      for (const row of componentRes.data ?? []) {
        const list = componentsByEmp.get(row.employee_id) ?? []
        list.push(row)
        componentsByEmp.set(row.employee_id, list)
      }

      const asOf = run?.pay_period_end
        ? String(run.pay_period_end).slice(0, 10)
        : new Date().toISOString().slice(0, 10)

      const errors: string[] = []
      let processed = 0

      for (const emp of empRes.data ?? []) {
        try {
          const fin = Array.isArray(emp.financial) ? emp.financial[0] : emp.financial
          if (!fin) {
            errors.push(`${emp.first_name} ${emp.last_name}: missing financial record`)
            continue
          }

          const period = inputsByEmployee.get(emp.id) as any
          const pick = (override: unknown, master: unknown) =>
            override != null && override !== "" ? Number(override) : Number(master ?? 0)

          const monthlyBasic = pick(period?.basic_salary, fin.monthly_salary)
          const componentRows = (componentsByEmp.get(emp.id) ?? []).filter((row: any) => {
            if (row.category === "backpay" && (row.payment_method === "separate_run" || row.backpay_treatment === "separate_run")) {
              return false
            }
            if (
              row.category === "deduction" &&
              SYSTEM_DEDUCTION_CODES.has(String(row.code || "").toUpperCase())
            ) {
              return false
            }
            return true
          })
          const componentAllowRows = componentRows.filter((row: any) => row.category === "allowance")
          const componentAllowTotal = componentAllowRows
            .reduce((sum: number, row: any) => sum + componentAssignmentValue(row, monthlyBasic), 0)
          const componentTaxableAllowTotal = componentAllowRows
            .filter((row: any) => row.tax_treatment === "taxable" || (row.tax_treatment == null && row.taxable !== false))
            .reduce((sum: number, row: any) => sum + componentAssignmentValue(row, monthlyBasic), 0)
          const componentDedTotal = componentRows
            .filter((row: any) => row.category === "deduction")
            .reduce((sum: number, row: any) => sum + componentAssignmentValue(row, monthlyBasic), 0)
          const componentBonus = componentRows
            .filter((row: any) => row.category === "bonus" || row.category === "backpay")
            .reduce((sum: number, row: any) => sum + componentAssignmentValue(row, monthlyBasic), 0)
          const componentPf = componentRows
            .filter((row: any) => row.category === "provident_fund" && !row.employer_component)
            .reduce((sum: number, row: any) => sum + componentAssignmentValue(row, monthlyBasic), 0)
          const componentPfRate = monthlyBasic > 0 ? (componentPf / monthlyBasic) * 100 : 0

          const cardAllowLines = expandCompLines(cardAllowByEmp.get(emp.id), monthlyBasic, asOf, "Allowance")
          const cardDedLines = expandCompLines(cardDedByEmp.get(emp.id), monthlyBasic, asOf, "Deduction")
          const cardAllowTotal = sumCompLines(cardAllowByEmp.get(emp.id), monthlyBasic, asOf) + componentAllowTotal
          const cardDedTotal = sumCompLines(cardDedByEmp.get(emp.id), monthlyBasic, asOf) + componentDedTotal

          // Period override for other_allowances replaces master; card/component allowances always add.
          // When allowance components exist they are SoT — do not also pull master other.
          const masterOther =
            componentAllowTotal > 0 ? 0 : pick(period?.other_allowances, fin.other_allowances)
          const periodOtherDed = Number(period?.other_deductions ?? 0)
          const leaveAllowance = Number(period?.leave_allowance ?? 0)
          const namedAllowLines = componentRows
            .filter((row: any) => row.category === "allowance")
            .map((row: any) => ({
              label: row.payslip_label || row.name || row.code || "Allowance",
              code: row.code || "ALLOW",
              amount: componentAssignmentValue(row, monthlyBasic),
              category: "allowance",
            }))
            .filter((row: any) => row.amount > 0)
          const namedBonusLines = componentRows
            .filter((row: any) => row.category === "bonus" || row.category === "backpay")
            .map((row: any) => ({
              label: row.payslip_label || row.name || row.code || "Bonus",
              code: row.code || "BONUS",
              amount: componentAssignmentValue(row, monthlyBasic),
              category: row.category,
            }))
            .filter((row: any) => row.amount > 0)
          const namedDedLines = componentRows
            .filter((row: any) => row.category === "deduction")
            .map((row: any) => ({
              label: row.payslip_label || row.name || row.code || "Deduction",
              code: row.code || "DED",
              amount: componentAssignmentValue(row, monthlyBasic),
              category: "deduction",
            }))
            .filter((row: any) => row.amount > 0)
          const namedPfLines = componentRows
            .filter((row: any) => row.category === "provident_fund" && !row.employer_component)
            .map((row: any) => ({
              label: row.payslip_label || row.name || row.code || "Provident Fund",
              code: row.code || "PF",
              amount: componentAssignmentValue(row, monthlyBasic),
              category: "provident_fund",
            }))
            .filter((row: any) => row.amount > 0)

          const allowanceLines = [
            ...cardAllowLines.map((line) => ({ ...line, category: "allowance" })),
            ...namedAllowLines,
            ...namedBonusLines,
            ...(masterOther > 0
              ? [{ label: "Other Allowances", code: "OTHER", amount: masterOther, category: "allowance" }]
              : []),
            ...(leaveAllowance > 0
              ? [{ label: "Leave Allowance", code: "LEAVE_ALLOW", amount: leaveAllowance, category: "allowance" }]
              : []),
          ]
          const deductionLines = [
            ...cardDedLines.map((line) => ({ ...line, category: "deduction" })),
            ...namedDedLines,
            ...namedPfLines,
            ...(periodOtherDed > 0
              ? [{ label: "Other Deductions", code: "OTHER", amount: periodOtherDed, category: "deduction" }]
              : []),
          ]

          const liveLoan = Number(loansByEmployee.get(emp.id) ?? 0)
          const savedLoan = period?.loan_deduction
          const resolvedLoan =
            savedLoan != null && savedLoan !== "" && Number(savedLoan) > 0
              ? Number(savedLoan)
              : liveLoan

          const input: EmployeePayInput = {
            monthly_basic: monthlyBasic,
            monthly_allowances: {
              transport: pick(period?.transport_allowance, fin.transport_allowance),
              housing: pick(period?.housing_allowance, fin.housing_allowance),
              medical: pick(period?.medical_allowance, fin.medical_allowance),
              meal: pick(period?.meal_allowance, fin.meal_allowance),
              communication: pick(period?.communication_allowance, fin.communication_allowance),
              uniform: pick(period?.uniform_allowance, fin.uniform_allowance),
              other: masterOther + cardAllowTotal,
            },
            monthly_taxable_allowances: Object.values({
              transport: pick(period?.transport_allowance, fin.transport_allowance),
              housing: pick(period?.housing_allowance, fin.housing_allowance),
              medical: pick(period?.medical_allowance, fin.medical_allowance),
              meal: pick(period?.meal_allowance, fin.meal_allowance),
              communication: pick(period?.communication_allowance, fin.communication_allowance),
              uniform: pick(period?.uniform_allowance, fin.uniform_allowance),
            }).reduce((sum: number, value) => sum + Number(value || 0), 0) + masterOther + cardAllowTotal - componentAllowTotal + componentTaxableAllowTotal,
            monthly_overtime: Number(period?.overtime_amount ?? 0),
            // Leave allowance (one-time) rides with bonus for PAYE; unpaid leave folds into other deductions
            monthly_bonus:
              Number(period?.bonus_amount ?? 0) + Number(period?.leave_allowance ?? 0) + componentBonus,
            tier2_applicable: period?.tier2_applicable ?? true,
            tier3_applicable:
              period?.tier3_applicable ??
              (componentPf > 0 ||
                Boolean(fin.provident_fund_enrolled) ||
                Number(fin.provident_fund_rate ?? 0) > 0 ||
                Number(fin.tier3_contribution ?? 0) > 0),
            tier3_employee_rate: Number(
              componentPfRate ||
                period?.tier3_employee_rate ||
                fin.provident_fund_rate ||
                0,
            ),
            other_deductions: {
              loan: resolvedLoan,
              advance: Number(period?.advance_deduction ?? 0),
              other: periodOtherDed + cardDedTotal,
            },
          }

          const saveResult = await this.calculateAndSaveEmployeeTax(
            payrollRunId,
            emp.id,
            companyId,
            input,
            { allowance_lines: allowanceLines, deduction_lines: deductionLines },
          )
          if (!saveResult.success) {
            errors.push(
              `${emp.first_name} ${emp.last_name}: ${saveResult.error?.message ?? "tax/save failed"}`,
            )
            continue
          }
          processed++
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error"
          errors.push(`Employee ${emp.id}: ${msg}`)
        }
      }

      // Update payroll run totals
      const { data: items } = await client
        .from("payroll_items")
        .select("gross_pay, total_deductions, net_pay")
        .eq("payroll_run_id", payrollRunId)

      if (items && items.length > 0) {
        const totals = items.reduce(
          (acc: { gross: number; deductions: number; net: number }, item: any) => ({
            gross: acc.gross + Number(item.gross_pay ?? 0),
            deductions: acc.deductions + Number(item.total_deductions ?? 0),
            net: acc.net + Number(item.net_pay ?? 0),
          }),
          { gross: 0, deductions: 0, net: 0 }
        )

        await client
          .from("payroll_runs")
          .update({
            total_gross_pay: totals.gross,
            total_deductions: totals.deductions,
            total_net_pay: totals.net,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payrollRunId)
      }

      return { processed, errors }
    }, "PROCESS_PAYROLL_RUN_ERROR")
  }

  /**
   * Get the Ghana tax rates currently active for a company.
   */
  async getCompanyTaxRates(companyId: string, taxYear?: number) {
    try {
      const rates = await getTaxRates(companyId, taxYear ?? new Date().getFullYear())
      return this.createSuccessResponse(rates)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch tax rates"
      return this.createErrorResponse(this.createError("GET_TAX_RATES_ERROR", message))
    }
  }

  // ---------------------------------------------------------------------------
  // Private: upsert payslip record
  // ---------------------------------------------------------------------------

  private async upsertPayslip(
    client: any,
    payrollItem: PayrollItem,
    tax: TaxCalculationResult,
    companyId: string,
    lineItems?: {
      allowance_lines?: Array<{ label: string; code?: string | null; amount: number }>
      deduction_lines?: Array<{ label: string; code?: string | null; amount: number }>
    },
  ) {
    // Get payroll run details for pay period fields
    const { data: run } = await client
      .from("payroll_runs")
      .select("pay_period_start, pay_period_end, pay_date")
      .eq("id", payrollItem.payroll_run_id)
      .single()

    if (!run) return

    const payPeriod = run.pay_period_start
      ? new Date(run.pay_period_start).toISOString().slice(0, 7)
      : new Date().toISOString().slice(0, 7)

    const [{ data: emp }, { data: company }] = await Promise.all([
      client
        .from("employees")
        .select(
          `first_name, last_name, preferred_name, employee_id, position, department, ssnit_number,
           financial:employee_financial(bank_name, bank_account_number, ssnit_number)`,
        )
        .eq("id", payrollItem.employee_id)
        .maybeSingle(),
      client.from("companies").select("name").eq("id", companyId).maybeSingle(),
    ])

    const fin = Array.isArray(emp?.financial) ? emp?.financial?.[0] : emp?.financial
    const empName =
      emp?.preferred_name ||
      `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() ||
      "Employee"

    const payslipPayload = {
      payroll_item_id: payrollItem.id,
      payroll_run_id: payrollItem.payroll_run_id,
      employee_id: payrollItem.employee_id,
      company_id: companyId,
      pay_period: payPeriod,
      pay_period_start: run.pay_period_start,
      pay_period_end: run.pay_period_end,
      pay_date: run.pay_date,
      snapshot_employee_name: empName,
      snapshot_employee_id_no: emp?.employee_id || null,
      snapshot_position: emp?.position || null,
      snapshot_department: emp?.department || null,
      snapshot_ssnit_number: fin?.ssnit_number || emp?.ssnit_number || null,
      snapshot_bank_name: fin?.bank_name || null,
      snapshot_account_number: fin?.bank_account_number || null,
      snapshot_company_name: company?.name || null,
      basic_salary: tax.monthly_basic,
      transport_allowance: (payrollItem.allowances as any)?.transport ?? 0,
      housing_allowance: (payrollItem.allowances as any)?.housing ?? 0,
      medical_allowance: (payrollItem.allowances as any)?.medical ?? 0,
      meal_allowance: (payrollItem.allowances as any)?.meal ?? 0,
      communication_allowance: (payrollItem.allowances as any)?.communication ?? 0,
      other_allowances: (payrollItem.allowances as any)?.other ?? 0,
      allowance_lines: lineItems?.allowance_lines ?? (payrollItem.allowances as any)?.lines ?? [],
      deduction_lines: lineItems?.deduction_lines ?? [],
      overtime_pay: tax.monthly_overtime,
      bonus_pay: tax.monthly_bonus,
      gross_pay: tax.monthly_gross + tax.monthly_overtime + tax.monthly_bonus,
      ssnit_employee: tax.monthly_ssnit_employee,
      ssnit_employer: tax.monthly_ssnit_employer,
      tier2_employee: tax.monthly_tier2_employee,
      tier2_employer: tax.monthly_tier2_employer,
      tier3_employee: tax.monthly_tier3_employee,
      tier3_employer: tax.monthly_tier3_employer,
      paye_taxable_income: tax.annual_taxable_income / 12,
      tax_relief_total: tax.annual_tax_reliefs / 12,
      paye_tax: tax.monthly_total_paye_withheld,
      overtime_tax: tax.monthly_overtime_tax,
      bonus_tax: tax.monthly_bonus_tax,
      loan_deduction: tax.monthly_loan_deduction,
      advance_deduction: tax.monthly_advance_deduction,
      other_deductions: tax.monthly_other_deduction,
      total_deductions: tax.monthly_total_employee_deductions,
      net_pay: tax.monthly_net_pay,
      total_employer_cost: tax.monthly_total_employer_cost,
      calculation_breakdown: {
        ...tax,
        allowance_lines: lineItems?.allowance_lines ?? [],
        deduction_lines: lineItems?.deduction_lines ?? [],
        calculated_at: new Date().toISOString(),
      },
      status: "draft",
      updated_at: new Date().toISOString(),
    }

    let { error } = await client
      .from("payslips")
      .upsert(payslipPayload, { onConflict: "payroll_item_id" })

    if (error) {
      // Fallback without snapshot / optional columns
      const minimal = {
        payroll_item_id: payslipPayload.payroll_item_id,
        payroll_run_id: payslipPayload.payroll_run_id,
        employee_id: payslipPayload.employee_id,
        company_id: payslipPayload.company_id,
        pay_period: payslipPayload.pay_period,
        pay_period_start: payslipPayload.pay_period_start,
        pay_period_end: payslipPayload.pay_period_end,
        pay_date: payslipPayload.pay_date,
        basic_salary: payslipPayload.basic_salary,
        gross_pay: payslipPayload.gross_pay,
        ssnit_employee: payslipPayload.ssnit_employee,
        tier3_employee: payslipPayload.tier3_employee,
        paye_tax: payslipPayload.paye_tax,
        loan_deduction: payslipPayload.loan_deduction,
        total_deductions: payslipPayload.total_deductions,
        net_pay: payslipPayload.net_pay,
        status: "draft",
        updated_at: payslipPayload.updated_at,
      }
      const retry = await client.from("payslips").upsert(minimal, { onConflict: "payroll_item_id" })
      error = retry.error
      if (error) {
        // Last resort: plain insert
        const ins = await client.from("payslips").insert(minimal)
        if (ins.error) throw ins.error
      }
    }
  }
}
