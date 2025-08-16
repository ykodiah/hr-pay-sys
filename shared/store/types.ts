import type { Employee, Payslip, LeaveRequest, Notification, Goal, Course } from "../types"

export interface AppState {
  user: UserState
  employees: EmployeesState
  payroll: PayrollState
  leave: LeaveState
  notifications: NotificationsState
  performance: PerformanceState
  learning: LearningState
  ui: UIState
}

export interface UserState {
  currentUser: Employee | null
  isAuthenticated: boolean
  permissions: string[]
  preferences: UserPreferences
  loading: boolean
  error: string | null
}

export interface UserPreferences {
  theme: "light" | "dark"
  language: "en" | "tw"
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY"
  currency: "GHS" | "USD"
}

export interface EmployeesState {
  employees: Employee[]
  selectedEmployee: Employee | null
  loading: boolean
  error: string | null
  filters: {
    department: string
    status: string
    search: string
  }
  pagination: {
    page: number
    limit: number
    total: number
  }
}

export interface PayrollState {
  payslips: Payslip[]
  currentPayroll: any | null
  processing: boolean
  loading: boolean
  error: string | null
  filters: {
    period: string
    employee: string
  }
}

export interface LeaveState {
  requests: LeaveRequest[]
  balance: any | null
  types: any[]
  loading: boolean
  error: string | null
  filters: {
    status: string
    employee: string
    dateRange: [string, string] | null
  }
}

export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
  error: string | null
}

export interface PerformanceState {
  goals: Goal[]
  reviews: any[]
  competencies: any[]
  loading: boolean
  error: string | null
}

export interface LearningState {
  courses: Course[]
  enrollments: any[]
  certifications: any[]
  progress: any[]
  loading: boolean
  error: string | null
}

export interface UIState {
  sidebarOpen: boolean
  theme: "light" | "dark"
  loading: {
    global: boolean
    [key: string]: boolean
  }
  modals: {
    [key: string]: boolean
  }
  toast: {
    message: string
    type: "success" | "error" | "warning" | "info"
    visible: boolean
  } | null
}

export type ActionType =
  | "SET_USER"
  | "SET_LOADING"
  | "SET_ERROR"
  | "SET_EMPLOYEES"
  | "ADD_EMPLOYEE"
  | "UPDATE_EMPLOYEE"
  | "DELETE_EMPLOYEE"
  | "SET_PAYSLIPS"
  | "ADD_PAYSLIP"
  | "SET_LEAVE_REQUESTS"
  | "ADD_LEAVE_REQUEST"
  | "UPDATE_LEAVE_REQUEST"
  | "SET_NOTIFICATIONS"
  | "ADD_NOTIFICATION"
  | "MARK_NOTIFICATION_READ"
  | "SET_GOALS"
  | "ADD_GOAL"
  | "UPDATE_GOAL"
  | "SET_COURSES"
  | "ENROLL_COURSE"
  | "COMPLETE_COURSE"
  | "SET_UI_STATE"
  | "SHOW_TOAST"
  | "HIDE_TOAST"
  | "TOGGLE_SIDEBAR"
  | "SET_THEME"

export interface Action {
  type: ActionType
  payload?: any
}
