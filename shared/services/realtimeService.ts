import { syncService } from "./syncService"

export interface RealtimeEvent {
  type: string
  data: any
  timestamp: string
  userId?: string
  platform?: "web" | "mobile"
}

export class RealtimeService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private heartbeatInterval: NodeJS.Timeout | null = null
  private eventListeners: Map<string, ((event: RealtimeEvent) => void)[]> = new Map()

  constructor(private wsUrl = "ws://localhost:3001/ws") {}

  connect(userId: string, platform: "web" | "mobile" = "web") {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(`${this.wsUrl}?userId=${userId}&platform=${platform}`)

      this.ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit("connection", { connected: true, userId, platform })
      }

      this.ws.onmessage = (event) => {
        try {
          const realtimeEvent: RealtimeEvent = JSON.parse(event.data)
          this.handleRealtimeEvent(realtimeEvent)
        } catch (error) {
          console.error("[v0] Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        this.stopHeartbeat()
        this.attemptReconnect(userId, platform)
      }

      this.ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }
    } catch (error) {
      console.error("[v0] Failed to connect WebSocket:", error)
      this.attemptReconnect(userId, platform)
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.stopHeartbeat()
  }

  private attemptReconnect(userId: string, platform: "web" | "mobile") {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[v0] Max reconnection attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

    setTimeout(() => {
      console.log(`[v0] Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
      this.connect(userId, platform)
    }, delay)
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "ping" }))
      }
    }, 30000) // 30 seconds
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private handleRealtimeEvent(event: RealtimeEvent) {
    console.log("[v0] Received realtime event:", event.type)

    // Handle system events
    switch (event.type) {
      case "data_sync":
        syncService.performSync()
        break
      case "notification":
        this.handleNotification(event.data)
        break
      case "employee_updated":
      case "payroll_processed":
      case "leave_request_updated":
      case "goal_updated":
        this.handleDataUpdate(event)
        break
    }

    // Emit to registered listeners
    this.emit(event.type, event.data)
  }

  private handleNotification(notification: any) {
    // Dispatch custom event for notification components
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("realtimeNotification", {
          detail: notification,
        }),
      )
    }
  }

  private handleDataUpdate(event: RealtimeEvent) {
    // Dispatch custom event for data updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("realtimeDataUpdate", {
          detail: {
            type: event.type,
            data: event.data,
            timestamp: event.timestamp,
          },
        }),
      )
    }
  }

  // Send realtime event to server
  send(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const event: RealtimeEvent = {
        type,
        data,
        timestamp: new Date().toISOString(),
      }
      this.ws.send(JSON.stringify(event))
    } else {
      console.warn("[v0] WebSocket not connected, cannot send event:", type)
    }
  }

  // Subscribe to realtime events
  on(eventType: string, callback: (data: any) => void) {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(callback)
  }

  // Unsubscribe from realtime events
  off(eventType: string, callback: (data: any) => void) {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // Emit event to listeners
  private emit(eventType: string, data: any) {
    const listeners = this.eventListeners.get(eventType)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

export const realtimeService = new RealtimeService()
