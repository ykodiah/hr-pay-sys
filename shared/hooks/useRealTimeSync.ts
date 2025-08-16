"use client"

import { useEffect, useCallback } from "react"
import { webSocketService, mobileWebSocketService } from "../services/websocket"
import { webPushService, mobilePushService } from "../services/pushNotifications"
import { syncStore } from "../store/syncStore"

interface UseRealTimeSyncOptions {
  platform: "web" | "mobile"
  userId: string
  token: string
  enablePushNotifications?: boolean
}

export function useRealTimeSync(options: UseRealTimeSyncOptions) {
  const { platform, userId, token, enablePushNotifications = true } = options

  const wsService = platform === "web" ? webSocketService : mobileWebSocketService
  const pushService = platform === "web" ? webPushService : mobilePushService

  // Handle real-time data updates
  const handleEmployeeUpdate = useCallback(
    (data: any) => {
      syncStore.updateEmployee(data.id, data)

      // Show notification for important updates
      if (data.salary || data.position) {
        pushService.sendLocalNotification({
          title: "Profile Updated",
          body: "Your employee profile has been updated",
          data: { type: "employee_update", employeeId: data.id },
        })
      }
    },
    [pushService],
  )

  const handlePayslipUpdate = useCallback(
    (data: any) => {
      syncStore.updatePayslip(data.id, data)

      pushService.sendLocalNotification({
        title: "New Payslip Available",
        body: `Your payslip for ${data.period} is ready`,
        data: { type: "payslip", payslipId: data.id },
      })
    },
    [pushService],
  )

  const handleLeaveUpdate = useCallback(
    (data: any) => {
      syncStore.updateLeaveRequest(data.id, data)

      const statusMessages = {
        approved: "Your leave request has been approved",
        rejected: "Your leave request has been rejected",
        pending: "Your leave request is under review",
      }

      pushService.sendLocalNotification({
        title: "Leave Request Update",
        body: statusMessages[data.status as keyof typeof statusMessages] || "Leave request updated",
        data: { type: "leave", requestId: data.id },
      })
    },
    [pushService],
  )

  const handleNotificationReceived = useCallback(
    (data: any) => {
      syncStore.addNotification(data)

      pushService.sendLocalNotification({
        title: data.title || "New Notification",
        body: data.message,
        data: { type: "notification", notificationId: data.id },
      })
    },
    [pushService],
  )

  // Broadcast changes to other platforms
  const broadcastChange = useCallback(
    (type: string, data: any) => {
      wsService.sendMessage(type, data)
    },
    [wsService],
  )

  useEffect(() => {
    // Initialize WebSocket connection
    wsService.connect(userId, token)

    // Initialize push notifications
    if (enablePushNotifications) {
      pushService.initialize().then(() => {
        pushService.registerForRemoteNotifications(userId)
        pushService.setupNotificationHandlers()
      })
    }

    // Subscribe to WebSocket events
    const unsubscribeEmployee = wsService.subscribe("sync_employee", handleEmployeeUpdate)
    const unsubscribePayslip = wsService.subscribe("sync_payslip", handlePayslipUpdate)
    const unsubscribeLeave = wsService.subscribe("sync_leave", handleLeaveUpdate)
    const unsubscribeNotification = wsService.subscribe("sync_notification", handleNotificationReceived)

    // Listen for local changes to broadcast
    const handleLocalEmployeeUpdate = (event: CustomEvent) => {
      broadcastChange("employee_updated", event.detail)
    }

    const handleLocalLeaveRequest = (event: CustomEvent) => {
      broadcastChange("leave_request_updated", event.detail)
    }

    window.addEventListener("employee_updated", handleLocalEmployeeUpdate as EventListener)
    window.addEventListener("leave_request_submitted", handleLocalLeaveRequest as EventListener)

    return () => {
      // Cleanup
      unsubscribeEmployee()
      unsubscribePayslip()
      unsubscribeLeave()
      unsubscribeNotification()

      window.removeEventListener("employee_updated", handleLocalEmployeeUpdate as EventListener)
      window.removeEventListener("leave_request_submitted", handleLocalLeaveRequest as EventListener)

      wsService.disconnect()
    }
  }, [
    userId,
    token,
    enablePushNotifications,
    wsService,
    pushService,
    handleEmployeeUpdate,
    handlePayslipUpdate,
    handleLeaveUpdate,
    handleNotificationReceived,
    broadcastChange,
  ])

  return {
    broadcastChange,
    isConnected: wsService !== null,
  }
}
