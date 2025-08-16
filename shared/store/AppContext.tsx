"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import type { AppState, Action } from "./types"
import { appReducer, initialState } from "./reducer"
import { apiClient } from "../api/apiClient"
import { useRealtime } from "../hooks/useRealtime"

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
  actions: {
    // User actions
    setUser: (user: any) => void
    logout: () => void
    updatePreferences: (preferences: any) => void

    // Employee actions
    loadEmployees: () => Promise<void>
    addEmployee: (employee: any) => Promise<void>
    updateEmployee: (id: string, data: any) => Promise<void>
    deleteEmployee: (id: string) => Promise<void>

    // Payroll actions
    loadPayslips: () => Promise<void>
    processPayroll: (data: any) => Promise<void>

    // Leave actions
    loadLeaveRequests: () => Promise<void>
    submitLeaveRequest: (request: any) => Promise<void>
    updateLeaveRequest: (id: string, data: any) => Promise<void>

    // Notification actions
    loadNotifications: () => Promise<void>
    markNotificationRead: (id: string) => Promise<void>

    // Performance actions
    loadGoals: () => Promise<void>
    addGoal: (goal: any) => Promise<void>
    updateGoal: (id: string, data: any) => Promise<void>

    // Learning actions
    loadCourses: () => Promise<void>
    enrollCourse: (courseId: string) => Promise<void>
    completeCourse: (courseId: string) => Promise<void>

    // UI actions
    showToast: (message: string, type: "success" | "error" | "warning" | "info") => void
    hideToast: () => void
    toggleSidebar: () => void
    setTheme: (theme: "light" | "dark") => void
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  const { subscribe } = useRealtime(state.user.currentUser?.id, "web")

  // Set up real-time event listeners
  useEffect(() => {
    const unsubscribers = [
      subscribe("employee_updated", (data: any) => {
        dispatch({ type: "UPDATE_EMPLOYEE", payload: data })
      }),
      subscribe("payroll_processed", (data: any) => {
        dispatch({ type: "ADD_PAYSLIP", payload: data })
      }),
      subscribe("leave_request_updated", (data: any) => {
        dispatch({ type: "UPDATE_LEAVE_REQUEST", payload: data })
      }),
      subscribe("notification", (data: any) => {
        dispatch({ type: "ADD_NOTIFICATION", payload: data })
      }),
      subscribe("goal_updated", (data: any) => {
        dispatch({ type: "UPDATE_GOAL", payload: data })
      }),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    }
  }, [subscribe])

  // Actions
  const actions = {
    // User actions
    setUser: (user: any) => {
      dispatch({ type: "SET_USER", payload: user })
    },

    logout: () => {
      dispatch({ type: "SET_USER", payload: null })
      localStorage.removeItem("authToken")
    },

    updatePreferences: async (preferences: any) => {
      try {
        const response = await apiClient.request("/settings/user", {
          method: "PUT",
          body: JSON.stringify(preferences),
        })
        if (response.success) {
          dispatch({
            type: "SET_USER",
            payload: { ...state.user.currentUser, preferences },
          })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update preferences" })
      }
    },

    // Employee actions
    loadEmployees: async () => {
      dispatch({ type: "SET_LOADING", payload: { section: "employees", loading: true } })
      try {
        const response = await apiClient.getEmployees()
        if (response.success) {
          dispatch({ type: "SET_EMPLOYEES", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load employees" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { section: "employees", loading: false } })
      }
    },

    addEmployee: async (employee: any) => {
      try {
        const response = await apiClient.request("/employees", {
          method: "POST",
          body: JSON.stringify(employee),
        })
        if (response.success) {
          dispatch({ type: "ADD_EMPLOYEE", payload: response.data })
          actions.showToast("Employee added successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to add employee" })
      }
    },

    updateEmployee: async (id: string, data: any) => {
      try {
        const response = await apiClient.request(`/employees/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })
        if (response.success) {
          dispatch({ type: "UPDATE_EMPLOYEE", payload: response.data })
          actions.showToast("Employee updated successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update employee" })
      }
    },

    deleteEmployee: async (id: string) => {
      try {
        const response = await apiClient.request(`/employees/${id}`, {
          method: "DELETE",
        })
        if (response.success) {
          dispatch({ type: "DELETE_EMPLOYEE", payload: id })
          actions.showToast("Employee deleted successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to delete employee" })
      }
    },

    // Payroll actions
    loadPayslips: async () => {
      dispatch({ type: "SET_LOADING", payload: { section: "payroll", loading: true } })
      try {
        const response = await apiClient.getPayslips()
        if (response.success) {
          dispatch({ type: "SET_PAYSLIPS", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load payslips" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { section: "payroll", loading: false } })
      }
    },

    processPayroll: async (data: any) => {
      try {
        const response = await apiClient.request("/payroll/process", {
          method: "POST",
          body: JSON.stringify(data),
        })
        if (response.success) {
          actions.showToast("Payroll processed successfully", "success")
          actions.loadPayslips()
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to process payroll" })
      }
    },

    // Leave actions
    loadLeaveRequests: async () => {
      dispatch({ type: "SET_LOADING", payload: { section: "leave", loading: true } })
      try {
        const response = await apiClient.getLeaveRequests()
        if (response.success) {
          dispatch({ type: "SET_LEAVE_REQUESTS", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load leave requests" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { section: "leave", loading: false } })
      }
    },

    submitLeaveRequest: async (request: any) => {
      try {
        const response = await apiClient.submitLeaveRequest(request)
        if (response.success) {
          dispatch({ type: "ADD_LEAVE_REQUEST", payload: response.data })
          actions.showToast("Leave request submitted successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to submit leave request" })
      }
    },

    updateLeaveRequest: async (id: string, data: any) => {
      try {
        const response = await apiClient.request(`/leave/requests/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })
        if (response.success) {
          dispatch({ type: "UPDATE_LEAVE_REQUEST", payload: response.data })
          actions.showToast("Leave request updated successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update leave request" })
      }
    },

    // Notification actions
    loadNotifications: async () => {
      try {
        const response = await apiClient.getNotifications()
        if (response.success) {
          dispatch({ type: "SET_NOTIFICATIONS", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load notifications" })
      }
    },

    markNotificationRead: async (id: string) => {
      try {
        const response = await apiClient.markNotificationRead(id)
        if (response.success) {
          dispatch({ type: "MARK_NOTIFICATION_READ", payload: id })
        }
      } catch (error) {
        console.error("Failed to mark notification as read:", error)
      }
    },

    // Performance actions
    loadGoals: async () => {
      dispatch({ type: "SET_LOADING", payload: { section: "performance", loading: true } })
      try {
        const response = await apiClient.request("/performance/goals")
        if (response.success) {
          dispatch({ type: "SET_GOALS", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load goals" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { section: "performance", loading: false } })
      }
    },

    addGoal: async (goal: any) => {
      try {
        const response = await apiClient.request("/performance/goals", {
          method: "POST",
          body: JSON.stringify(goal),
        })
        if (response.success) {
          dispatch({ type: "ADD_GOAL", payload: response.data })
          actions.showToast("Goal added successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to add goal" })
      }
    },

    updateGoal: async (id: string, data: any) => {
      try {
        const response = await apiClient.request(`/performance/goals/${id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        })
        if (response.success) {
          dispatch({ type: "UPDATE_GOAL", payload: response.data })
          actions.showToast("Goal updated successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to update goal" })
      }
    },

    // Learning actions
    loadCourses: async () => {
      dispatch({ type: "SET_LOADING", payload: { section: "learning", loading: true } })
      try {
        const response = await apiClient.request("/learning/courses")
        if (response.success) {
          dispatch({ type: "SET_COURSES", payload: response.data })
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to load courses" })
      } finally {
        dispatch({ type: "SET_LOADING", payload: { section: "learning", loading: false } })
      }
    },

    enrollCourse: async (courseId: string) => {
      try {
        const response = await apiClient.request(`/learning/courses/${courseId}/enroll`, {
          method: "POST",
        })
        if (response.success) {
          dispatch({ type: "ENROLL_COURSE", payload: { courseId, enrollment: response.data } })
          actions.showToast("Enrolled in course successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to enroll in course" })
      }
    },

    completeCourse: async (courseId: string) => {
      try {
        const response = await apiClient.request(`/learning/courses/${courseId}/complete`, {
          method: "POST",
        })
        if (response.success) {
          dispatch({ type: "COMPLETE_COURSE", payload: { courseId, completion: response.data } })
          actions.showToast("Course completed successfully", "success")
        } else {
          dispatch({ type: "SET_ERROR", payload: response.error })
        }
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: "Failed to complete course" })
      }
    },

    // UI actions
    showToast: (message: string, type: "success" | "error" | "warning" | "info") => {
      dispatch({
        type: "SHOW_TOAST",
        payload: { message, type, visible: true },
      })
      setTimeout(() => {
        actions.hideToast()
      }, 5000)
    },

    hideToast: () => {
      dispatch({ type: "HIDE_TOAST" })
    },

    toggleSidebar: () => {
      dispatch({ type: "TOGGLE_SIDEBAR" })
    },

    setTheme: (theme: "light" | "dark") => {
      dispatch({ type: "SET_THEME", payload: theme })
      localStorage.setItem("theme", theme)
    },
  }

  return <AppContext.Provider value={{ state, dispatch, actions }}>{children}</AppContext.Provider>
}

export function useAppContext() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider")
  }
  return context
}
