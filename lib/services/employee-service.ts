import { BaseService } from "./base-service"
import type { Employee, ServiceResponse, PaginatedResponse } from "./types"
import { ACTIVE_EMPLOYEE_STATUSES, normalizeEmployeeStatus } from "@/lib/employees/status"

export class EmployeeService extends BaseService {
  async getEmployeesByCompany(
    companyId: string,
    options?: { page?: number; pageSize?: number; status?: string; includeFinancial?: boolean }
  ): Promise<ServiceResponse<PaginatedResponse<Employee>>> {
    return this.handleRequest(async (client) => {
      const select = options?.includeFinancial
        ? "*, financial:employee_financial(*)"
        : "*"
      let query = client
        .from("employees")
        .select(select, { count: "exact" })
        .eq("company_id", companyId)
        .order("created_at", { ascending: false })

      if (options?.status && options.status !== "all") {
        if (options.status.toLowerCase() === "active") {
          query = query.in("status", [...ACTIVE_EMPLOYEE_STATUSES])
        } else {
          query = query.eq("status", normalizeEmployeeStatus(options.status))
        }
      }

      const page = options?.page ?? 1
      const pageSize = options?.pageSize ?? 50
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      const total = count ?? 0
      return {
        items: (data ?? []) as Employee[],
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      }
    }, "GET_EMPLOYEES_ERROR")
  }

  async getEmployeeById(employeeId: string): Promise<ServiceResponse<Employee>> {
    return this.handleRequest<Employee>(async (client) => {
      const { data, error } = await client.from("employees").select("*").eq("id", employeeId).single()

      if (error) throw error
      return data
    }, "GET_EMPLOYEE_ERROR")
  }

  async getEmployeeByUserId(userId: string): Promise<ServiceResponse<Employee>> {
    return this.handleRequest<Employee>(async (client) => {
      const { data: profile, error: profileError } = await client
        .from("employee_profiles")
        .select("employee_id")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      const { data, error } = await client
        .from("employees")
        .select("*")
        .eq("id", profile.employee_id)
        .single()

      if (error) throw error
      return data
    }, "GET_EMPLOYEE_ERROR")
  }

  async createEmployee(data: Partial<Employee>): Promise<ServiceResponse<Employee>> {
    return this.handleRequest<Employee>(async (client) => {
      const { data: created, error } = await client.from("employees").insert([data]).select().single()

      if (error) throw error
      return created
    }, "CREATE_EMPLOYEE_ERROR")
  }

  async updateEmployee(employeeId: string, data: Partial<Employee>): Promise<ServiceResponse<Employee>> {
    return this.handleRequest<Employee>(async (client) => {
      const { data: updated, error } = await client
        .from("employees")
        .update(data)
        .eq("id", employeeId)
        .select()
        .single()

      if (error) throw error
      return updated
    }, "UPDATE_EMPLOYEE_ERROR")
  }

  async deactivateEmployee(employeeId: string, reason?: string): Promise<ServiceResponse<Employee>> {
    const updateData: any = { status: "Inactive" }
    if (reason) updateData.inactive_reason = reason

    return this.updateEmployee(employeeId, updateData)
  }

  async getTeamMembers(supervisorId: string): Promise<ServiceResponse<Employee[]>> {
    return this.handleRequest<Employee[]>(async (client) => {
      const { data, error } = await client
        .from("employees")
        .select("*")
        .eq("direct_supervisor", supervisorId)
        .in("status", [...ACTIVE_EMPLOYEE_STATUSES])

      if (error) throw error
      return data || []
    }, "GET_TEAM_MEMBERS_ERROR")
  }

  async getDepartmentEmployees(companyId: string, department: string): Promise<ServiceResponse<Employee[]>> {
    return this.handleRequest<Employee[]>(async (client) => {
      const { data, error } = await client
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .eq("department", department)
        .in("status", [...ACTIVE_EMPLOYEE_STATUSES])

      if (error) throw error
      return data || []
    }, "GET_DEPARTMENT_EMPLOYEES_ERROR")
  }

  async searchEmployees(companyId: string, searchTerm: string): Promise<ServiceResponse<Employee[]>> {
    return this.handleRequest<Employee[]>(async (client) => {
      const { data, error } = await client
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,employee_id.ilike.%${searchTerm}%,corporate_email.ilike.%${searchTerm}%`)

      if (error) throw error
      return data || []
    }, "SEARCH_EMPLOYEES_ERROR")
  }
}
