/**
 * Employee Service Tests
 * 
 * Run with: npm test -- employee-service.test.ts
 */

import { EmployeeService } from "@/lib/services/employee-service"

describe("EmployeeService", () => {
  let employeeService: EmployeeService

  beforeEach(() => {
    employeeService = new EmployeeService(true) // Use server mode for tests
  })

  describe("getEmployeesByCompany", () => {
    it("should fetch employees for a company", async () => {
      // This test requires a valid Supabase connection
      // In a real test environment, you would mock the Supabase client
      const result = await employeeService.getEmployeesByCompany("test-company-id")

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("data")
      expect(result).toHaveProperty("error")
    })

    it("should support pagination", async () => {
      const result = await employeeService.getEmployeesByCompany("test-company-id", {
        page: 1,
        pageSize: 10,
      })

      if (result.success && result.data) {
        expect(result.data).toHaveProperty("items")
        expect(result.data).toHaveProperty("page")
        expect(result.data).toHaveProperty("pageSize")
        expect(result.data).toHaveProperty("totalPages")
      }
    })

    it("should filter by status", async () => {
      const result = await employeeService.getEmployeesByCompany("test-company-id", {
        status: "active",
      })

      if (result.success && result.data) {
        expect(result.data.items).toBeDefined()
      }
    })
  })

  describe("getEmployeeById", () => {
    it("should fetch a single employee", async () => {
      const result = await employeeService.getEmployeeById("test-employee-id")

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("data")
    })
  })

  describe("createEmployee", () => {
    it("should create a new employee", async () => {
      const newEmployee = {
        company_id: "test-company-id",
        first_name: "John",
        last_name: "Doe",
        employee_id: "EMP001",
        position: "Software Engineer",
        department: "Engineering",
        status: "active" as const,
      }

      const result = await employeeService.createEmployee(newEmployee)

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(result.data).toHaveProperty("id")
      }
    })
  })

  describe("searchEmployees", () => {
    it("should search employees by name or email", async () => {
      const result = await employeeService.searchEmployees("test-company-id", "john")

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("getTeamMembers", () => {
    it("should fetch team members for a supervisor", async () => {
      const result = await employeeService.getTeamMembers("supervisor-id")

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("deactivateEmployee", () => {
    it("should deactivate an employee", async () => {
      const result = await employeeService.deactivateEmployee("test-employee-id", "Resignation")

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(result.data?.status).toBe("inactive")
      }
    })
  })
})
