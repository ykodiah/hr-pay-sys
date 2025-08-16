"use client"

import { useEffect, useCallback } from "react"
import { useGlobalState } from "../context/GlobalStateContext"
import { StorageService } from "../services/storage"
import { webApiClient, mobileApiClient } from "../api/client"

interface UseOfflineSyncOptions {
  platform: "web" | "mobile"
  syncInterval?: number
}

export function useOfflineSync(options: UseOfflineSyncOptions) {
  const { state, actions } = useGlobalState()
  const storageService = new StorageService(options.platform)
  const apiClient = options.platform === "web" ? webApiClient : mobileApiClient

  const processOfflineQueue = useCallback(async () => {
    if (state.sync.status === "offline") return

    try {
      const queue = await storageService.getOfflineQueue()
      if (queue.length === 0) return

      actions.setSyncStatus("syncing")

      for (const queuedAction of queue) {
        try {
          await processQueuedAction(queuedAction)
        } catch (error) {
          console.error("[v0] Failed to process queued action:", error)
          // Keep failed actions in queue for retry
          continue
        }
      }

      await storageService.clearOfflineQueue()
      actions.setSyncStatus("idle")
    } catch (error) {
      console.error("[v0] Offline sync error:", error)
      actions.setSyncStatus("error")
    }
  }, [state.sync.status, actions, storageService, apiClient])

  const processQueuedAction = async (action: any) => {
    switch (action.type) {
      case "employee_updated":
        await apiClient.updateEmployee(action.data.id, action.data.data)
        break
      case "leave_request_submitted":
        await apiClient.submitLeaveRequest(action.data)
        break
      case "profile_updated":
        await apiClient.updateEmployee(action.data.userId, action.data.data)
        break
      default:
        console.warn("[v0] Unknown queued action type:", action.type)
    }
  }

  const handleOnline = useCallback(() => {
    actions.setSyncStatus("idle")
    processOfflineQueue()
  }, [actions, processOfflineQueue])

  const handleOffline = useCallback(() => {
    actions.setSyncStatus("offline")
  }, [actions])

  // Monitor network status
  useEffect(() => {
    if (options.platform === "web") {
      window.addEventListener("online", handleOnline)
      window.addEventListener("offline", handleOffline)

      // Set initial status
      if (!navigator.onLine) {
        actions.setSyncStatus("offline")
      }

      return () => {
        window.removeEventListener("online", handleOnline)
        window.removeEventListener("offline", handleOffline)
      }
    } else {
      // Mobile network monitoring would use NetInfo
      const NetInfo = require("@react-native-netinfo/netinfo")

      const unsubscribe = NetInfo.addEventListener((state: any) => {
        if (state.isConnected) {
          handleOnline()
        } else {
          handleOffline()
        }
      })

      return unsubscribe
    }
  }, [options.platform, handleOnline, handleOffline, actions])

  // Queue actions when offline
  const queueAction = useCallback(
    async (action: any) => {
      if (state.sync.status === "offline") {
        await storageService.addToOfflineQueue(action)
        actions.addPendingChange(action)
      }
    },
    [state.sync.status, storageService, actions],
  )

  // Periodic sync when online
  useEffect(() => {
    if (state.sync.status === "offline" || !options.syncInterval) return

    const interval = setInterval(() => {
      if (state.sync.status === "idle") {
        processOfflineQueue()
      }
    }, options.syncInterval)

    return () => clearInterval(interval)
  }, [state.sync.status, options.syncInterval, processOfflineQueue])

  return {
    isOffline: state.sync.status === "offline",
    isSyncing: state.sync.status === "syncing",
    pendingChanges: state.sync.pendingChanges.length,
    queueAction,
    processOfflineQueue,
  }
}
