import { BaseService } from "./base-service"
import type { PayrollRun, PayrollItem, CreatePayrollRunInput, UpdatePayrollRunInput, ServiceResponse } from "./types"

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
}
