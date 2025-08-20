"use client"

import { useEffect, useState } from "react"
import { realtimeService, type RealtimeEvent } from "../services/realtimeService"

export function useRealtime(userId?: string, platform: "web" | "mobile" = "web") {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null)

  useEffect(() => {
    if (!userId) return

    // Connect to realtime service
    realtimeService.connect(userId, platform)

    // Listen for connection status
    const handleConnection = (data: any) => {
      setIsConnected(data.connected)
    }

    realtimeService.on("connection", handleConnection)

    // Listen for all events
    const handleEvent = (data: any) => {
      setLastEvent({
        type: "generic",
        data,
        timestamp: new Date().toISOString(),
      })
    }

    // Subscribe to common events
    const eventTypes = [
      "employee_updated",
      "payroll_processed",
      "leave_request_updated",
      "notification",
      "goal_updated",
      "course_completed",
    ]

    eventTypes.forEach((eventType) => {
      realtimeService.on(eventType, handleEvent)
    })

    return () => {
      realtimeService.off("connection", handleConnection)
      eventTypes.forEach((eventType) => {
        realtimeService.off(eventType, handleEvent)
      })
    }
  }, [userId, platform])

  const sendEvent = (type: string, data: any) => {
    realtimeService.send(type, data)
  }

  const subscribe = (eventType: string, callback: (data: any) => void) => {
    realtimeService.on(eventType, callback)
    return () => realtimeService.off(eventType, callback)
  }

  return {
    isConnected,
    lastEvent,
    sendEvent,
    subscribe,
    realtimeService,
  }
}
