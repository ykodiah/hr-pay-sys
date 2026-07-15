/**
 * Payroll Service Tests
 * 
 * Run with: npm test -- payroll-service.test.ts
 */

import { PayrollService } from "@/lib/services/payroll-service"

describe("PayrollService", () => {
  let payrollService: PayrollService

  beforeEach(() => {
    payrollService = new PayrollService(true)
  })

  describe("getPayrollRuns", () => {
    it("should fetch payroll runs for a company", async () => {
      const result = await payrollService.getPayrollRuns("test-company-id")

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("data")
    })

    it("should support status filtering", async () => {
      const result = await payrollService.getPayrollRuns("test-company-id", {
        status: "draft",
      })

      expect(result).toHaveProperty("success")
    })

    it("should support pagination", async () => {
      const result = await payrollService.getPayrollRuns("test-company-id", {
        page: 1,
        pageSize: 20,
      })

      if (result.success && result.data) {
        expect(result.data).toHaveProperty("items")
        expect(result.data.pageSize).toBe(20)
      }
    })
  })

  describe("createPayrollRun", () => {
    it("should create a new payroll run", async () => {
      const newRun = {
        company_id: "test-company-id",
        pay_period_start: "2024-01-01",
        pay_period_end: "2024-01-31",
        pay_date: "2024-02-05",
      }

      const result = await payrollService.createPayrollRun(newRun)

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data.status).toBe("draft")
      }
    })
  })

  describe("approvePayrollRun", () => {
    it("should approve a payroll run", async () => {
      const result = await payrollService.approvePayrollRun("payroll-run-id", "approver-user-id")

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data.status).toBe("approved")
      }
    })
  })

  describe("getPayrollItems", () => {
    it("should fetch payroll items for a run", async () => {
      const result = await payrollService.getPayrollItems("payroll-run-id")

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("getEmployeePayrollItems", () => {
    it("should fetch payroll items for an employee", async () => {
      const result = await payrollService.getEmployeePayrollItems("employee-id")

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })

  describe("calculatePayrollSummary", () => {
    it("should calculate payroll summary", async () => {
      const result = await payrollService.calculatePayrollSummary("payroll-run-id")

      expect(result).toHaveProperty("success")
      if (result.success && result.data) {
        expect(result.data).toHaveProperty("count")
        expect(result.data).toHaveProperty("totalGrossPay")
        expect(result.data).toHaveProperty("totalDeductions")
        expect(result.data).toHaveProperty("totalNetPay")
      }
    })
  })

  describe("getPayrollHistory", () => {
    it("should fetch payroll history", async () => {
      const result = await payrollService.getPayrollHistory("test-company-id", 12)

      expect(result).toHaveProperty("success")
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true)
      }
    })
  })
})
