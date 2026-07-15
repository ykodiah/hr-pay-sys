export * from "./types"
export * from "./base-service"
export * from "./employee-service"
export * from "./payroll-service"
export * from "./attendance-service"
export * from "./dashboard-service"

import { EmployeeService } from "./employee-service"
import { PayrollService } from "./payroll-service"
import { AttendanceService } from "./attendance-service"
import { DashboardService } from "./dashboard-service"

// Factory functions for convenient service instantiation
export function createEmployeeService(isServer = true) {
  return new EmployeeService(isServer)
}

export function createPayrollService(isServer = true) {
  return new PayrollService(isServer)
}

export function createAttendanceService(isServer = true) {
  return new AttendanceService(isServer)
}

export function createDashboardService(isServer = true) {
  return new DashboardService(isServer)
}
