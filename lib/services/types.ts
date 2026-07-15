// Common types for all services
export type ServiceError = {
  code: string
  message: string
  details?: Record<string, unknown>
  statusCode?: number
}

export type ServiceResponse<T> = {
  data: T | null
  error: ServiceError | null
  success: boolean
}

export type PaginationOptions = {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: "asc" | "desc"
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Employee types
export type Employee = {
  id: string
  company_id: string
  employee_id: string
  first_name: string
  last_name: string
  full_name: string
  email?: string
  corporate_email?: string
  personal_email?: string
  phone?: string
  position: string
  department: string
  status: "active" | "inactive" | "on_leave"
  date_of_joining?: string
  date_of_exit?: string
  special_role?: "Admin" | "HR" | "Manager" | null
  direct_supervisor?: string
  created_at: string
  updated_at: string
}

// Payroll types
export type PayrollRun = {
  id: string
  company_id: string
  subsidiary_id?: string
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  status: "draft" | "approved" | "processed" | "paid"
  total_gross_pay: number
  total_deductions: number
  total_net_pay: number
  created_by: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
}

export type PayrollItem = {
  id: string
  payroll_run_id: string
  employee_id: string
  basic_salary: number
  gross_pay: number
  allowances: Record<string, number>
  deductions: Record<string, number>
  tax_deduction: number
  ssnit_employee: number
  ssnit_employer: number
  net_pay: number
  total_deductions: number
  created_at: string
  updated_at: string
}

// Attendance types
export type AttendanceRecord = {
  id: string
  employee_id: string
  date: string
  clock_in?: string
  clock_out?: string
  status: "present" | "absent" | "late" | "leave"
  total_hours?: number
  overtime_hours?: number
  break_start?: string
  break_end?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Dashboard types
export type DashboardStats = {
  totalEmployees: number
  activeEmployees: number
  onLeaveEmployees: number
  inactiveEmployees: number
  totalPayroll: number
  attendanceRate: number
  pendingApprovals: number
  recentActivities: Activity[]
}

export type Activity = {
  id: string
  type: string
  actor: string
  action: string
  timestamp: string
  details?: Record<string, unknown>
}

export type CreatePayrollRunInput = {
  pay_period_start: string
  pay_period_end: string
  pay_date: string
  subsidiary_id?: string
}

export type UpdatePayrollRunInput = {
  status?: "draft" | "approved" | "processed" | "paid"
  approved_by?: string
}
