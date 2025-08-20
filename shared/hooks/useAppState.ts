"use client"

import { useAppContext } from "../store/AppContext"

export function useAppState() {
  const { state, actions } = useAppContext()
  return { state, actions }
}

export function useEmployees() {
  const { state, actions } = useAppContext()
  return {
    employees: state.employees.employees,
    loading: state.employees.loading,
    error: state.employees.error,
    selectedEmployee: state.employees.selectedEmployee,
    filters: state.employees.filters,
    pagination: state.employees.pagination,
    loadEmployees: actions.loadEmployees,
    addEmployee: actions.addEmployee,
    updateEmployee: actions.updateEmployee,
    deleteEmployee: actions.deleteEmployee,
  }
}

export function usePayroll() {
  const { state, actions } = useAppContext()
  return {
    payslips: state.payroll.payslips,
    currentPayroll: state.payroll.currentPayroll,
    processing: state.payroll.processing,
    loading: state.payroll.loading,
    error: state.payroll.error,
    filters: state.payroll.filters,
    loadPayslips: actions.loadPayslips,
    processPayroll: actions.processPayroll,
  }
}

export function useLeave() {
  const { state, actions } = useAppContext()
  return {
    requests: state.leave.requests,
    balance: state.leave.balance,
    types: state.leave.types,
    loading: state.leave.loading,
    error: state.leave.error,
    filters: state.leave.filters,
    loadLeaveRequests: actions.loadLeaveRequests,
    submitLeaveRequest: actions.submitLeaveRequest,
    updateLeaveRequest: actions.updateLeaveRequest,
  }
}

export function useNotifications() {
  const { state, actions } = useAppContext()
  return {
    notifications: state.notifications.notifications,
    unreadCount: state.notifications.unreadCount,
    loading: state.notifications.loading,
    error: state.notifications.error,
    loadNotifications: actions.loadNotifications,
    markNotificationRead: actions.markNotificationRead,
  }
}

export function usePerformance() {
  const { state, actions } = useAppContext()
  return {
    goals: state.performance.goals,
    reviews: state.performance.reviews,
    competencies: state.performance.competencies,
    loading: state.performance.loading,
    error: state.performance.error,
    loadGoals: actions.loadGoals,
    addGoal: actions.addGoal,
    updateGoal: actions.updateGoal,
  }
}

export function useLearning() {
  const { state, actions } = useAppContext()
  return {
    courses: state.learning.courses,
    enrollments: state.learning.enrollments,
    certifications: state.learning.certifications,
    progress: state.learning.progress,
    loading: state.learning.loading,
    error: state.learning.error,
    loadCourses: actions.loadCourses,
    enrollCourse: actions.enrollCourse,
    completeCourse: actions.completeCourse,
  }
}

export function useUI() {
  const { state, actions } = useAppContext()
  return {
    sidebarOpen: state.ui.sidebarOpen,
    theme: state.ui.theme,
    loading: state.ui.loading,
    modals: state.ui.modals,
    toast: state.ui.toast,
    showToast: actions.showToast,
    hideToast: actions.hideToast,
    toggleSidebar: actions.toggleSidebar,
    setTheme: actions.setTheme,
  }
}
