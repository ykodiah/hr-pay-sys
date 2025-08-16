"use client"

import { useState, useEffect, useCallback } from "react"
import { webApiClient, mobileApiClient } from "../api/client"

interface UseSyncOptions {
  platform: "web" | "mobile"
  syncInterval?: number // milliseconds
  autoSync?: boolean
}

export function useSync(options: UseSyncOptions) {
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "error">("idle")
  const [lastSync, setLastSync] = useState<string | null>(null)
  const [pendingChanges, setPendingChanges] = useState<any[]>([])

  const apiClient = options.platform === "web" ? webApiClient : mobileApiClient

  const performSync = useCallback(async () => {
    setSyncStatus("syncing")

    try {
      // Get latest sync data from server
      const syncResponse = await apiClient.getSyncData(lastSync || undefined)

      if (syncResponse.success && syncResponse.data) {
        const { changes, version, lastSync: serverLastSync } = syncResponse.data

        // Apply changes to local state
        for (const change of changes) {
          await applyChange(change)
        }

        setLastSync(serverLastSync)
        setPendingChanges([])
        setSyncStatus("idle")

        // Store last sync time locally
        if (options.platform === "mobile") {
          const AsyncStorage = require("@react-native-async-storage/async-storage").default
          await AsyncStorage.setItem("last_sync", serverLastSync)
        } else {
          localStorage.setItem("last_sync", serverLastSync)
        }
      }
    } catch (error) {
      console.error("[v0] Sync error:", error)
      setSyncStatus("error")
    }
  }, [lastSync, apiClient, options.platform])

  const applyChange = async (change: any) => {
    switch (change.type) {
      case "employee_updated":
        // Update employee data in local state
        window.dispatchEvent(new CustomEvent("employee_updated", { detail: change.data }))
        break
      case "payslip_generated":
        // Refresh payslip data
        window.dispatchEvent(new CustomEvent("payslip_updated", { detail: change.data }))
        break
      case "leave_request_approved":
        // Update leave balance and status
        window.dispatchEvent(new CustomEvent("leave_updated", { detail: change.data }))
        break
      case "notification_sent":
        // Add new notification
        window.dispatchEvent(new CustomEvent("notification_received", { detail: change.data }))
        break
    }
  }

  const queueChange = useCallback((change: any) => {
    setPendingChanges((prev) => [...prev, { ...change, timestamp: new Date().toISOString() }])
  }, [])

  // Initialize sync on mount
  useEffect(() => {
    const initSync = async () => {
      // Get last sync time from storage
      let storedLastSync: string | null = null

      if (options.platform === "mobile") {
        const AsyncStorage = require("@react-native-async-storage/async-storage").default
        storedLastSync = await AsyncStorage.getItem("last_sync")
      } else {
        storedLastSync = localStorage.getItem("last_sync")
      }

      setLastSync(storedLastSync)

      if (options.autoSync !== false) {
        await performSync()
      }
    }

    initSync()
  }, [options.platform, options.autoSync, performSync])

  // Set up periodic sync
  useEffect(() => {
    if (!options.autoSync || !options.syncInterval) return

    const interval = setInterval(performSync, options.syncInterval)
    return () => clearInterval(interval)
  }, [options.autoSync, options.syncInterval, performSync])

  return {
    syncStatus,
    lastSync,
    pendingChanges,
    performSync,
    queueChange,
  }
}
