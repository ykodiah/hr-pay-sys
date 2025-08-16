interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
  platform: "web" | "mobile"
  userId: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private platform: "web" | "mobile"
  private userId: string | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(platform: "web" | "mobile") {
    this.platform = platform
  }

  connect(userId: string, token: string) {
    this.userId = userId
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "wss://ws.akwaabahr.com"}?token=${token}&platform=${this.platform}&userId=${userId}`

    try {
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log("[v0] WebSocket connected")
        this.reconnectAttempts = 0
        this.sendMessage("connection_established", { platform: this.platform })
      }

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)
          this.handleMessage(message)
        } catch (error) {
          console.error("[v0] WebSocket message parse error:", error)
        }
      }

      this.ws.onclose = () => {
        console.log("[v0] WebSocket disconnected")
        this.attemptReconnect(userId, token)
      }

      this.ws.onerror = (error) => {
        console.error("[v0] WebSocket error:", error)
      }
    } catch (error) {
      console.error("[v0] WebSocket connection error:", error)
      this.attemptReconnect(userId, token)
    }
  }

  private attemptReconnect(userId: string, token: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)

      setTimeout(() => {
        console.log(`[v0] Attempting WebSocket reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
        this.connect(userId, token)
      }, delay)
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Don't process messages from the same platform to avoid loops
    if (message.platform === this.platform) return

    const listeners = this.listeners.get(message.type)
    if (listeners) {
      listeners.forEach((listener) => listener(message.data))
    }

    // Handle specific message types
    switch (message.type) {
      case "employee_updated":
        this.notifyListeners("sync_employee", message.data)
        break
      case "payslip_generated":
        this.notifyListeners("sync_payslip", message.data)
        break
      case "leave_request_updated":
        this.notifyListeners("sync_leave", message.data)
        break
      case "notification_sent":
        this.notifyListeners("sync_notification", message.data)
        break
    }
  }

  sendMessage(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.userId) {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: new Date().toISOString(),
        platform: this.platform,
        userId: this.userId,
      }
      this.ws.send(JSON.stringify(message))
    }
  }

  subscribe(eventType: string, callback: (data: any) => void) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set())
    }
    this.listeners.get(eventType)!.add(callback)

    return () => {
      const listeners = this.listeners.get(eventType)
      if (listeners) {
        listeners.delete(callback)
      }
    }
  }

  private notifyListeners(eventType: string, data: any) {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach((listener) => listener(data))
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export const webSocketService = new WebSocketService("web")
export const mobileWebSocketService = new WebSocketService("mobile")
