import { AsyncStorage } from "@react-native-async-storage/async-storage"

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface SyncData {
  lastSync: string
  version: string
  changes: any[]
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private platform: "web" | "mobile"

  constructor(platform: "web" | "mobile") {
    this.platform = platform
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.akwaabahr.com"
  }

  async setAuthToken(token: string) {
    this.token = token
    if (this.platform === "mobile") {
      await AsyncStorage.setItem("auth_token", token)
    } else {
      localStorage.setItem("auth_token", token)
    }
  }

  async getAuthToken(): Promise<string | null> {
    if (this.token) return this.token

    if (this.platform === "mobile") {
      this.token = await AsyncStorage.getItem("auth_token")
    } else {
      this.token = localStorage.getItem("auth_token")
    }
    return this.token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = await this.getAuthToken()
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      "X-Platform": this.platform,
      ...options.headers,
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      const data = await response.json()
      return {
        success: response.ok,
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.message,
        timestamp: new Date().toISOString(),
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Network error",
        timestamp: new Date().toISOString(),
      }
    }
  }

  // Employee API methods
  async getEmployee(id: string) {
    return this.request(`/employees/${id}`)
  }

  async updateEmployee(id: string, data: any) {
    const result = await this.request(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })

    if (result.success) {
      await this.triggerSync("employee_updated", { id, data })
    }
    return result
  }

  // Payroll API methods
  async getPayslips(employeeId: string) {
    return this.request(`/payslips?employeeId=${employeeId}`)
  }

  async downloadPayslip(payslipId: string, format: "pdf" | "excel" = "pdf") {
    return this.request(`/payslips/${payslipId}/download?format=${format}`)
  }

  // Leave API methods
  async getLeaveBalance(employeeId: string) {
    return this.request(`/leave/balance/${employeeId}`)
  }

  async submitLeaveRequest(data: any) {
    const result = await this.request("/leave/requests", {
      method: "POST",
      body: JSON.stringify(data),
    })

    if (result.success) {
      await this.triggerSync("leave_request_submitted", data)
    }
    return result
  }

  // Sync methods
  async triggerSync(action: string, data: any) {
    return this.request("/sync/trigger", {
      method: "POST",
      body: JSON.stringify({
        action,
        data,
        platform: this.platform,
        timestamp: new Date().toISOString(),
      }),
    })
  }

  async getSyncData(lastSync?: string): Promise<ApiResponse<SyncData>> {
    const params = lastSync ? `?lastSync=${lastSync}` : ""
    return this.request(`/sync/data${params}`)
  }

  async markSyncComplete(syncId: string) {
    return this.request(`/sync/complete/${syncId}`, {
      method: "POST",
    })
  }
}

export const webApiClient = new ApiClient("web")
export const mobileApiClient = new ApiClient("mobile")

export default ApiClient
