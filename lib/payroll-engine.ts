import { calculatePayroll, type PayrollCalculation } from "./ghana-rules"

export interface EmployeePayrollData {
  id: string
  firstName: string
  lastName: string
  baseSalary: number
  allowances?: Record<string, number>
  preDeductions?: Record<string, number>
  postDeductions?: Record<string, number>
  ssnitNumber?: string
  tin?: string
}

export interface PayrollRunData {
  id: string
  period: string
  startDate: string
  endDate: string
  employees: EmployeePayrollData[]
  status: "DRAFT" | "CALCULATED" | "APPROVED" | "POSTED"
}

export interface PayrollResult extends PayrollCalculation {
  employeeId: string
  employeeName: string
  period: string
  payDate: string
}

export class PayrollEngine {
  /**
   * Process payroll for a single employee
   */
  static processEmployeePayroll(employee: EmployeePayrollData, period: string, payDate: string): PayrollResult {
    const calculation = calculatePayroll(
      employee.baseSalary,
      employee.allowances || {},
      employee.preDeductions || {},
      employee.postDeductions || {},
    )

    return {
      ...calculation,
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      period,
      payDate,
    }
  }

  /**
   * Process payroll for multiple employees
   */
  static processPayrollRun(payrollRun: PayrollRunData): PayrollResult[] {
    const payDate = payrollRun.endDate

    return payrollRun.employees.map((employee) => this.processEmployeePayroll(employee, payrollRun.period, payDate))
  }

  /**
   * Calculate payroll summary for a run
   */
  static calculatePayrollSummary(results: PayrollResult[]) {
    return {
      totalEmployees: results.length,
      totalGrossPay: results.reduce((sum, r) => sum + r.grossPay, 0),
      totalNetPay: results.reduce((sum, r) => sum + r.netPay, 0),
      totalPaye: results.reduce((sum, r) => sum + r.paye, 0),
      totalSsnitEmployee: results.reduce((sum, r) => sum + r.ssnitEmployee, 0),
      totalSsnitEmployer: results.reduce((sum, r) => sum + r.ssnitEmployer, 0),
      totalDeductions: results.reduce((sum, r) => sum + r.paye + r.ssnitEmployee, 0),
    }
  }

  /**
   * Generate payslip data for an employee
   */
  static generatePayslip(result: PayrollResult) {
    return {
      employeeId: result.employeeId,
      employeeName: result.employeeName,
      period: result.period,
      payDate: result.payDate,
      grossPay: result.grossPay,
      taxableIncome: result.taxableIncome,
      paye: result.paye,
      ssnitEmployee: result.ssnitEmployee,
      ssnitEmployer: result.ssnitEmployer,
      netPay: result.netPay,
      breakdown: {
        earnings: {
          basicSalary: result.grossPay - Object.values({}).reduce((a, b) => a + b, 0), // Simplified
          allowances: {},
        },
        deductions: {
          paye: result.paye,
          ssnit: result.ssnitEmployee,
          other: {},
        },
      },
    }
  }

  /**
   * Validate payroll data before processing
   */
  static validatePayrollRun(payrollRun: PayrollRunData): string[] {
    const errors: string[] = []

    if (!payrollRun.period) {
      errors.push("Payroll period is required")
    }

    if (!payrollRun.startDate || !payrollRun.endDate) {
      errors.push("Start date and end date are required")
    }

    if (payrollRun.employees.length === 0) {
      errors.push("At least one employee is required")
    }

    payrollRun.employees.forEach((employee, index) => {
      if (!employee.firstName || !employee.lastName) {
        errors.push(`Employee ${index + 1}: Name is required`)
      }
      if (!employee.baseSalary || employee.baseSalary <= 0) {
        errors.push(`Employee ${index + 1}: Valid base salary is required`)
      }
    })

    return errors
  }
}
