"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, type ReactNode } from "react"
import { globalReducer, initialState, type GlobalState, type GlobalAction } from "../store/globalStore"
import { StorageService } from "../services/storage"
import { useRealTimeSync } from "../hooks/useRealTimeSync"

interface GlobalStateContextType {
  state: GlobalState
  dispatch: React.Dispatch<GlobalAction>
  actions: {
    // User actions
    setUser: (user: any) => void
    logout: () => void
    updateProfile: (data: any) => void

    // Employee actions
    setEmployees: (employees: any[]) => void
    addEmployee: (employee: any) => void
    updateEmployee: (id: string, data: any) => void
    deleteEmployee: (id: string) => void

    // Payroll actions
    setPayslips: (payslips: any[]) => void
    addPayslip: (payslip: any) => void

    // Leave actions
    setLeaveRequests: (requests: any[]) => void
    addLeaveRequest: (request: any) => void
    updateLeaveRequest: (id: string, data: any) => void
    setLeaveBalance: (balance: any) => void

    // Notification actions
    addNotification: (notification: any) => void
    markNotificationRead: (id: string) => void
    clearNotifications: () => void

    // UI actions
    setTheme: (theme: GlobalState["ui"]["theme"]) => void
    setLanguage: (language: string) => void

    // Sync actions
    setSyncStatus: (status: GlobalState["sync"]["status"]) => void
    addPendingChange: (change: any) => void
    clearPendingChanges: () => void
  }
}

const GlobalStateContext = createContext<GlobalStateContextType | undefined>(undefined)

interface GlobalStateProviderProps {
  children: ReactNode
  platform: "web" | "mobile"
}

export function GlobalStateProvider({ children, platform }: GlobalStateProviderProps) {
  const [state, dispatch] = useReducer(globalReducer, {
    ...initialState,
    ui: { ...initialState.ui, platform },
  })

  const storageService = new StorageService(platform)

  // Initialize real-time sync if user is authenticated
  const { broadcastChange } = useRealTimeSync({
    platform,
    userId: state.user.id || "",
    token: "", // Get from storage
    enablePushNotifications: true,
  })

  // Load persisted state on mount
  useEffect(() => {
    const loadPersistedState = async () => {
      try {
        const persistedState = await storageService.getState()
        if (persistedState) {
          dispatch({ type: "HYDRATE_STATE", payload: persistedState })
        }
      } catch (error) {
        console.error("[v0] Failed to load persisted state:", error)
      }
    }

    loadPersistedState()
  }, [])

  // Persist state changes
  useEffect(() => {
    const persistState = async () => {
      try {
        await storageService.setState(state)
      } catch (error) {
        console.error("[v0] Failed to persist state:", error)
      }
    }

    // Debounce state persistence
    const timeoutId = setTimeout(persistState, 1000)
    return () => clearTimeout(timeoutId)
  }, [state])

  // Action creators with optimistic updates and sync
  const actions = {
    // User actions
    setUser: (user: any) => {
      dispatch({ type: "SET_USER", payload: user })
    },

    logout: () => {
      dispatch({ type: "LOGOUT" })
      storageService.clearState()
    },

    updateProfile: (data: any) => {
      dispatch({ type: "UPDATE_PROFILE", payload: data })
      broadcastChange("profile_updated", { userId: state.user.id, data })
    },

    // Employee actions
    setEmployees: (employees: any[]) => {
      dispatch({ type: "SET_EMPLOYEES", payload: employees })
    },

    addEmployee: (employee: any) => {
      const optimisticEmployee = { ...employee, id: `temp_${Date.now()}`, _optimistic: true }
      dispatch({ type: "ADD_EMPLOYEE", payload: optimisticEmployee })
      broadcastChange("employee_added", employee)
    },

    updateEmployee: (id: string, data: any) => {
      dispatch({ type: "UPDATE_EMPLOYEE", payload: { id, data } })
      broadcastChange("employee_updated", { id, data })
    },

    deleteEmployee: (id: string) => {
      dispatch({ type: "DELETE_EMPLOYEE", payload: id })
      broadcastChange("employee_deleted", { id })
    },

    // Payroll actions
    setPayslips: (payslips: any[]) => {
      dispatch({ type: "SET_PAYSLIPS", payload: payslips })
    },

    addPayslip: (payslip: any) => {
      dispatch({ type: "ADD_PAYSLIP", payload: payslip })
      broadcastChange("payslip_generated", payslip)
    },

    // Leave actions
    setLeaveRequests: (requests: any[]) => {
      dispatch({ type: "SET_LEAVE_REQUESTS", payload: requests })
    },

    addLeaveRequest: (request: any) => {
      const optimisticRequest = { ...request, id: `temp_${Date.now()}`, status: "pending", _optimistic: true }
      dispatch({ type: "ADD_LEAVE_REQUEST", payload: optimisticRequest })
      broadcastChange("leave_request_submitted", request)
    },

    updateLeaveRequest: (id: string, data: any) => {
      dispatch({ type: "UPDATE_LEAVE_REQUEST", payload: { id, data } })
      broadcastChange("leave_request_updated", { id, data })
    },

    setLeaveBalance: (balance: any) => {
      dispatch({ type: "SET_LEAVE_BALANCE", payload: balance })
    },

    // Notification actions
    addNotification: (notification: any) => {
      dispatch({ type: "ADD_NOTIFICATION", payload: notification })
    },

    markNotificationRead: (id: string) => {
      dispatch({ type: "MARK_NOTIFICATION_READ", payload: id })
    },

    clearNotifications: () => {
      dispatch({ type: "CLEAR_NOTIFICATIONS" })
    },

    // UI actions
    setTheme: (theme: GlobalState["ui"]["theme"]) => {
      dispatch({ type: "SET_THEME", payload: theme })
    },

    setLanguage: (language: string) => {
      dispatch({ type: "SET_LANGUAGE", payload: language })
    },

    // Sync actions
    setSyncStatus: (status: GlobalState["sync"]["status"]) => {
      dispatch({ type: "SET_SYNC_STATUS", payload: status })
    },

    addPendingChange: (change: any) => {
      dispatch({ type: "ADD_PENDING_CHANGE", payload: change })
    },

    clearPendingChanges: () => {
      dispatch({ type: "CLEAR_PENDING_CHANGES" })
    },
  }

  return <GlobalStateContext.Provider value={{ state, dispatch, actions }}>{children}</GlobalStateContext.Provider>
}

export function useGlobalState() {
  const context = useContext(GlobalStateContext)
  if (context === undefined) {
    throw new Error("useGlobalState must be used within a GlobalStateProvider")
  }
  return context
}

// Selector hooks for specific state slices
export function useUser() {
  const { state } = useGlobalState()
  return state.user
}

export function useEmployees() {
  const { state } = useGlobalState()
  return state.employees
}

export function usePayroll() {
  const { state } = useGlobalState()
  return state.payroll
}

export function useLeave() {
  const { state } = useGlobalState()
  return state.leave
}

export function useNotifications() {
  const { state } = useGlobalState()
  return state.notifications
}

export function useSync() {
  const { state } = useGlobalState()
  return state.sync
}

export function useUI() {
  const { state } = useGlobalState()
  return state.ui
}
