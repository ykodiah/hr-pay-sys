import { API_CONFIG } from "./config"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor() {
    this.baseURL = API_CONFIG.BASE_URL
  }

  setToken(token: string) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`
      const headers = {
        ...API_CONFIG.HEADERS,
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      }

      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          error: data.message || "Request failed",
        }
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  // Authentication
  async login(credentials: { email: string; password: string }) {
    return this.request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: "POST",
      body: JSON.stringify(credentials),
    })
  }

  async logout() {
    return this.request(API_CONFIG.ENDPOINTS.LOGOUT, {
      method: "POST",
    })
  }

  // Employee Management
  async getEmployees(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.EMPLOYEES}${query}`)
  }

  async getEmployeeProfile(id?: string) {
    const endpoint = id ? `${API_CONFIG.ENDPOINTS.EMPLOYEES}/${id}` : API_CONFIG.ENDPOINTS.EMPLOYEE_PROFILE
    return this.request(endpoint)
  }

  async updateEmployeeProfile(data: any) {
    return this.request(API_CONFIG.ENDPOINTS.EMPLOYEE_PROFILE, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Payroll
  async getPayslips(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.PAYSLIPS}${query}`)
  }

  async downloadPayslip(id: string, format: "pdf" | "excel" = "pdf") {
    return this.request(`${API_CONFIG.ENDPOINTS.PAYSLIPS}/${id}/download?format=${format}`)
  }

  // Leave Management
  async getLeaveRequests(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.LEAVE_REQUESTS}${query}`)
  }

  async submitLeaveRequest(data: any) {
    return this.request(API_CONFIG.ENDPOINTS.LEAVE_REQUESTS, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async getLeaveBalance() {
    return this.request(API_CONFIG.ENDPOINTS.LEAVE_BALANCE)
  }

  // Notifications
  async getNotifications() {
    return this.request(API_CONFIG.ENDPOINTS.NOTIFICATIONS)
  }

  async markNotificationRead(id: string) {
    return this.request(`${API_CONFIG.ENDPOINTS.MARK_READ}/${id}`, {
      method: "PUT",
    })
  }

  // Sync
  async getSyncStatus() {
    return this.request(API_CONFIG.ENDPOINTS.SYNC_STATUS)
  }

  async syncData(lastSyncTime?: string) {
    const params = lastSyncTime ? `?since=${lastSyncTime}` : ""
    return this.request(`${API_CONFIG.ENDPOINTS.SYNC_DATA}${params}`)
  }
}

export const apiClient = new ApiClient()
