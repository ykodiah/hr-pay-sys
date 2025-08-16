interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
}

class WebStorageAdapter implements StorageAdapter {
  async getItem(key: string): Promise<string | null> {
    return localStorage.getItem(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value)
  }

  async removeItem(key: string): Promise<void> {
    localStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    localStorage.clear()
  }
}

class MobileStorageAdapter implements StorageAdapter {
  private AsyncStorage: any

  constructor() {
    this.AsyncStorage = require("@react-native-async-storage/async-storage").default
  }

  async getItem(key: string): Promise<string | null> {
    return await this.AsyncStorage.getItem(key)
  }

  async setItem(key: string, value: string): Promise<void> {
    await this.AsyncStorage.setItem(key, value)
  }

  async removeItem(key: string): Promise<void> {
    await this.AsyncStorage.removeItem(key)
  }

  async clear(): Promise<void> {
    await this.AsyncStorage.clear()
  }
}

export class StorageService {
  private adapter: StorageAdapter
  private readonly STATE_KEY = "akwaaba_hr_state"
  private readonly SYNC_KEY = "akwaaba_hr_sync"

  constructor(platform: "web" | "mobile") {
    this.adapter = platform === "web" ? new WebStorageAdapter() : new MobileStorageAdapter()
  }

  async setState(state: any): Promise<void> {
    try {
      // Only persist essential data, not UI state or temporary data
      const persistableState = {
        user: state.user,
        employees: {
          list: state.employees.list,
          lastUpdated: state.employees.lastUpdated,
        },
        payroll: {
          payslips: state.payroll.payslips,
          lastUpdated: state.payroll.lastUpdated,
        },
        leave: {
          requests: state.leave.requests,
          balance: state.leave.balance,
          lastUpdated: state.leave.lastUpdated,
        },
        notifications: state.notifications,
        ui: {
          theme: state.ui.theme,
          language: state.ui.language,
        },
      }

      await this.adapter.setItem(this.STATE_KEY, JSON.stringify(persistableState))
    } catch (error) {
      console.error("[v0] Storage setState error:", error)
    }
  }

  async getState(): Promise<any | null> {
    try {
      const stateJson = await this.adapter.getItem(this.STATE_KEY)
      return stateJson ? JSON.parse(stateJson) : null
    } catch (error) {
      console.error("[v0] Storage getState error:", error)
      return null
    }
  }

  async clearState(): Promise<void> {
    try {
      await this.adapter.removeItem(this.STATE_KEY)
      await this.adapter.removeItem(this.SYNC_KEY)
    } catch (error) {
      console.error("[v0] Storage clearState error:", error)
    }
  }

  async setSyncData(syncData: any): Promise<void> {
    try {
      await this.adapter.setItem(this.SYNC_KEY, JSON.stringify(syncData))
    } catch (error) {
      console.error("[v0] Storage setSyncData error:", error)
    }
  }

  async getSyncData(): Promise<any | null> {
    try {
      const syncJson = await this.adapter.getItem(this.SYNC_KEY)
      return syncJson ? JSON.parse(syncJson) : null
    } catch (error) {
      console.error("[v0] Storage getSyncData error:", error)
      return null
    }
  }

  // Offline queue management
  async addToOfflineQueue(action: any): Promise<void> {
    try {
      const queueJson = await this.adapter.getItem("offline_queue")
      const queue = queueJson ? JSON.parse(queueJson) : []
      queue.push({ ...action, timestamp: new Date().toISOString() })
      await this.adapter.setItem("offline_queue", JSON.stringify(queue))
    } catch (error) {
      console.error("[v0] Storage addToOfflineQueue error:", error)
    }
  }

  async getOfflineQueue(): Promise<any[]> {
    try {
      const queueJson = await this.adapter.getItem("offline_queue")
      return queueJson ? JSON.parse(queueJson) : []
    } catch (error) {
      console.error("[v0] Storage getOfflineQueue error:", error)
      return []
    }
  }

  async clearOfflineQueue(): Promise<void> {
    try {
      await this.adapter.removeItem("offline_queue")
    } catch (error) {
      console.error("[v0] Storage clearOfflineQueue error:", error)
    }
  }
}
