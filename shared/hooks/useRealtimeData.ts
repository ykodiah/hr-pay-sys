"use client"

import { useEffect, useState } from "react"
import { useRealtime } from "./useRealtime"

export function useRealtimeData<T>(
  initialData: T,
  dataType: string,
  userId?: string,
  platform: "web" | "mobile" = "web",
) {
  const [data, setData] = useState<T>(initialData)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const realtimeHook = useRealtime(userId, platform)
  const { subscribe } = realtimeHook

  useEffect(() => {
    // Subscribe to data updates for this specific data type
    const unsubscribe = subscribe(`${dataType}_updated`, (updatedData: any) => {
      setData(updatedData)
      setLastUpdated(new Date().toISOString())
    })

    // Subscribe to general data sync events
    const unsubscribeSync = subscribe("data_sync", (syncData: any) => {
      if (syncData[dataType]) {
        setData(syncData[dataType])
        setLastUpdated(new Date().toISOString())
      }
    })

    return () => {
      unsubscribe()
      unsubscribeSync()
    }
  }, [dataType, subscribe])

  const updateData = (newData: Partial<T>) => {
    const updatedData = { ...data, ...newData }
    setData(updatedData)
    setLastUpdated(new Date().toISOString())

    // Send update to other platforms
    if (realtimeHook.isConnected) {
      realtimeHook.sendEvent(`${dataType}_updated`, updatedData)
    }
  }

  return {
    data,
    lastUpdated,
    updateData,
    setData,
  }
}
