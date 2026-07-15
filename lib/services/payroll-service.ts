import { BaseService } from "./base-service"
import type { PayrollRun, PayrollItem, CreatePayrollRunInput, UpdatePayrollRunInput, ServiceResponse } from "./types"
import { calculateEmployeeTax, getTaxRates } from "@/lib/ghana-tax/tax-config-service"
import type { EmployeePayInput, TaxCalculationResult } from "@/lib/ghana-tax/engine"

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
        totalGrossPay: items?.reduce((sum, item) => sum + (item.gross_pay || 0), 0) || 0,
        totalDeductions: items?.reduce((sum, item) => sum + (item.total_deductions || 0), 0) || 0,
        totalNetPay: items?.reduce((sum, item) => sum + (item.net_pay || 0), 0) || 0,
        totalTax: items?.reduce((sum, item) => sum + (item.tax_deduction || 0), 0) || 0,
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
    input: EmployeePayInput
  ): Promise<ServiceResponse<{ payrollItem: PayrollItem; taxResult: TaxCalculationResult }>> {
    return this.handleRequest(async (client) => {
      const taxYear = new Date().getFullYear()
      const taxResult = await calculateEmployeeTax(input, companyId, employeeId, taxYear)

      // Build the payroll_items update payload
      const itemPayload = {
        employee_id: employeeId,
        payroll_run_id: payrollRunId,
        basic_salary: taxResult.monthly_basic,
        allowances: input.monthly_allowances,
        gross_pay: taxResult.monthly_gross + taxResult.monthly_overtime + taxResult.monthly_bonus,
        ssnit_employee: taxResult.monthly_ssnit_employee,
        ssnit_employer: taxResult.monthly_ssnit_employer,
        tier2_employee: taxResult.monthly_tier2_employee,
        tier2_employer: taxResult.monthly_tier2_employer,
        tier3_employee: taxResult.monthly_tier3_employee,
        tier3_employer: taxResult.monthly_tier3_employer,
        paye_taxable_income: taxResult.annual_taxable_income / 12,
        tax_relief_total: taxResult.annual_tax_reliefs / 12,
        tax_deduction: taxResult.monthly_paye_tax + taxResult.monthly_overtime_tax + taxResult.monthly_bonus_tax,
        total_deductions: taxResult.monthly_total_employee_deductions,
        net_pay: taxResult.monthly_net_pay,
        tax_year: taxYear,
        calculation_breakdown: {
          ...taxResult,
          calculated_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }

      const { data: existingItem } = await client
        .from("payroll_items")
        .select("id")
        .eq("payroll_run_id", payrollRunId)
        .eq("employee_id", employeeId)
        .maybeSingle()

      let payrollItem: PayrollItem

      if (existingItem?.id) {
        const { data, error } = await client
          .from("payroll_items")
          .update(itemPayload)
          .eq("id", existingItem.id)
          .select()
          .single()
        if (error) throw error
        payrollItem = data
      } else {
        const { data, error } = await client
          .from("payroll_items")
          .insert(itemPayload)
          .select()
          .single()
        if (error) throw error
        payrollItem = data
      }

      // Create / update draft payslip
      await this.upsertPayslip(client, payrollItem, taxResult, companyId)

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
      // Fetch all active employees with financial data for this company
      const { data: employees, error: empError } = await client
        .from("employees")
        .select(
          `id, first_name, last_name, tier2_applicable:employee_financial(tier2_employee_contribution),
           financial:employee_financial(
             monthly_salary,
             transport_allowance, housing_allowance, medical_allowance,
             meal_allowance, communication_allowance, uniform_allowance, other_allowances,
             tier2_employee_contribution, tier2_employer_contribution, tier3_contribution
           )`
        )
        .eq("company_id", companyId)
        .eq("status", "Active")

      if (empError) throw empError

      const errors: string[] = []
      let processed = 0

      for (const emp of employees ?? []) {
        try {
          const fin = Array.isArray(emp.financial) ? emp.financial[0] : emp.financial
          if (!fin) {
            errors.push(`${emp.first_name} ${emp.last_name}: missing financial record`)
            continue
          }

          const input: EmployeePayInput = {
            monthly_basic: Number(fin.monthly_salary ?? 0),
            monthly_allowances: {
              transport: Number(fin.transport_allowance ?? 0),
              housing: Number(fin.housing_allowance ?? 0),
              medical: Number(fin.medical_allowance ?? 0),
              meal: Number(fin.meal_allowance ?? 0),
              communication: Number(fin.communication_allowance ?? 0),
              uniform: Number(fin.uniform_allowance ?? 0),
              other: Number(fin.other_allowances ?? 0),
            },
            tier2_applicable: Number(fin.tier2_employee_contribution ?? 0) > 0,
            tier3_applicable: Number(fin.tier3_contribution ?? 0) > 0,
          }

          await this.calculateAndSaveEmployeeTax(payrollRunId, emp.id, companyId, input)
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
          (acc, item) => ({
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
    companyId: string
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

    const payslipPayload = {
      payroll_item_id: payrollItem.id,
      payroll_run_id: payrollItem.payroll_run_id,
      employee_id: payrollItem.employee_id,
      company_id: companyId,
      pay_period: payPeriod,
      pay_period_start: run.pay_period_start,
      pay_period_end: run.pay_period_end,
      pay_date: run.pay_date,
      basic_salary: tax.monthly_basic,
      transport_allowance: (payrollItem.allowances as any)?.transport ?? 0,
      housing_allowance: (payrollItem.allowances as any)?.housing ?? 0,
      medical_allowance: (payrollItem.allowances as any)?.medical ?? 0,
      meal_allowance: (payrollItem.allowances as any)?.meal ?? 0,
      communication_allowance: (payrollItem.allowances as any)?.communication ?? 0,
      other_allowances: (payrollItem.allowances as any)?.other ?? 0,
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
      paye_tax: tax.monthly_paye_tax + tax.monthly_overtime_tax + tax.monthly_bonus_tax,
      total_deductions: tax.monthly_total_employee_deductions,
      net_pay: tax.monthly_net_pay,
      total_employer_cost: tax.monthly_total_employer_cost,
      calculation_breakdown: { ...tax, calculated_at: new Date().toISOString() },
      status: "draft",
      updated_at: new Date().toISOString(),
    }

    await client
      .from("payslips")
      .upsert(payslipPayload, { onConflict: "payroll_item_id" })
  }
}
