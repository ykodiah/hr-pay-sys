import { apiClient } from "../api/apiClient"
import { SYNC_CONFIG } from "../api/config"

export interface SyncData {
  employees?: any[]
  payslips?: any[]
  leaveRequests?: any[]
  notifications?: any[]
  lastSync: string
}

export class SyncService {
  private syncInterval: NodeJS.Timeout | null = null
  private isOnline = true
  private pendingSync: any[] = []

  constructor() {
    this.setupNetworkListener()
  }

  private setupNetworkListener() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        this.isOnline = true
        this.processPendingSync()
      })

      window.addEventListener("offline", () => {
        this.isOnline = false
      })
    }
  }

  async startSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }

    // Initial sync
    await this.performSync()

    // Set up periodic sync
    this.syncInterval = setInterval(() => {
      this.performSync()
    }, SYNC_CONFIG.SYNC_INTERVAL)
  }

  stopSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
      this.syncInterval = null
    }
  }

  private async performSync() {
    if (!this.isOnline) {
      console.log("[v0] Offline - skipping sync")
      return
    }

    try {
      const lastSync = this.getLastSyncTime()
      const response = await apiClient.syncData(lastSync)

      if (response.success && response.data) {
        await this.updateLocalData(response.data)
        this.setLastSyncTime(new Date().toISOString())
        console.log("[v0] Sync completed successfully")
      }
    } catch (error) {
      console.error("[v0] Sync failed:", error)
    }
  }

  private async updateLocalData(syncData: SyncData) {
    if (typeof window !== "undefined") {
      try {
        // Update local storage with synced data
        localStorage.setItem(SYNC_CONFIG.OFFLINE_STORAGE_KEY, JSON.stringify(syncData))

        // Dispatch custom event for components to update
        window.dispatchEvent(
          new CustomEvent("dataSync", {
            detail: syncData,
          }),
        )
      } catch (error) {
        console.error("[v0] Failed to update local data:", error)
      }
    }
  }

  private getLastSyncTime(): string | undefined {
    if (typeof window !== "undefined") {
      return localStorage.getItem(SYNC_CONFIG.LAST_SYNC_KEY) || undefined
    }
    return undefined
  }

  private setLastSyncTime(time: string) {
    if (typeof window !== "undefined") {
      localStorage.setItem(SYNC_CONFIG.LAST_SYNC_KEY, time)
    }
  }

  async addToPendingSync(action: any) {
    this.pendingSync.push({
      ...action,
      timestamp: new Date().toISOString(),
    })

    if (this.isOnline) {
      await this.processPendingSync()
    }
  }

  private async processPendingSync() {
    while (this.pendingSync.length > 0 && this.isOnline) {
      const action = this.pendingSync.shift()
      try {
        // Process the pending action
        await this.executeAction(action)
      } catch (error) {
        console.error("[v0] Failed to process pending sync:", error)
        // Re-add to queue for retry
        this.pendingSync.unshift(action)
        break
      }
    }
  }

  private async executeAction(action: any) {
    // Execute the pending action based on its type
    switch (action.type) {
      case "UPDATE_PROFILE":
        return apiClient.updateEmployeeProfile(action.data)
      case "SUBMIT_LEAVE":
        return apiClient.submitLeaveRequest(action.data)
      case "MARK_NOTIFICATION_READ":
        return apiClient.markNotificationRead(action.data.id)
      default:
        console.warn("[v0] Unknown action type:", action.type)
    }
  }

  getOfflineData(): SyncData | null {
    if (typeof window !== "undefined") {
      const data = localStorage.getItem(SYNC_CONFIG.OFFLINE_STORAGE_KEY)
      return data ? JSON.parse(data) : null
    }
    return null
  }
}

export const syncService = new SyncService()
