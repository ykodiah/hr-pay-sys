import { BaseService } from "./base-service"
import type { Employee, ServiceResponse, PaginatedResponse } from "./types"

export class EmployeeService extends BaseService {
  async getEmployeesByCompany(
    companyId: string,
    options?: { page?: number; pageSize?: number; status?: string }
  ): Promise<ServiceResponse<PaginatedResponse<Employee>>> {
    const filters = [{ column: "company_id", operator: "eq" as const, value: companyId }]

    if (options?.status && options.status !== "all") {
      filters.push({ column: "status", operator: "eq" as const, value: options.status })
    }

    return this.handleListRequest<Employee>(
      "employees",
      "*",
      filters,
      [{ column: "created_at", order: "desc" }],
      { page: options?.page, pageSize: options?.pageSize }
    )
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
    const updateData: any = { status: "inactive" }
    if (reason) updateData.inactive_reason = reason

    return this.updateEmployee(employeeId, updateData)
  }

  async getTeamMembers(supervisorId: string): Promise<ServiceResponse<Employee[]>> {
    return this.handleRequest<Employee[]>(async (client) => {
      const { data, error } = await client
        .from("employees")
        .select("*")
        .eq("direct_supervisor", supervisorId)
        .eq("status", "active")

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
        .eq("status", "active")

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
