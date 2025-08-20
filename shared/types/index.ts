export interface Employee {
  id: string
  employeeId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  department: string
  position: string
  startDate: string
  basicSalary: number
  bankName: string
  bankAccountNumber: string
  ssnitNumber: string
  ghanaCardNumber: string
  status: "active" | "inactive" | "terminated"
  profileImage?: string
}

export interface Payslip {
  id: string
  employeeId: string
  period: string
  basicSalary: number
  allowances: Allowance[]
  deductions: Deduction[]
  grossSalary: number
  netSalary: number
  ssnitEmployee: number
  ssnitEmployer: number
  paye: number
  providentFundEmployee: number
  providentFundEmployer: number
  processedDate: string
}

export interface Allowance {
  id: string
  name: string
  amount: number
  taxable: boolean
}

export interface Deduction {
  id: string
  name: string
  amount: number
  type: "statutory" | "voluntary" | "loan"
}

export interface LeaveRequest {
  id: string
  employeeId: string
  leaveType: string
  startDate: string
  endDate: string
  days: number
  reason: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: string
  approvedDate?: string
  comments?: string
}

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
  actionUrl?: string
}

export interface Goal {
  id: string
  employeeId: string
  title: string
  description: string
  targetDate: string
  progress: number
  status: "not_started" | "in_progress" | "completed" | "overdue"
  keyResults: KeyResult[]
}

export interface KeyResult {
  id: string
  description: string
  target: number
  current: number
  unit: string
}

export interface Course {
  id: string
  title: string
  description: string
  duration: number
  type: "online" | "classroom" | "blended"
  status: "available" | "enrolled" | "completed"
  progress?: number
  completedDate?: string
}
