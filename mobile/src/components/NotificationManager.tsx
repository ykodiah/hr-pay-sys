"use client"
import { useEffect, useState } from "react"
import * as Notifications from "expo-notifications"
import { Platform } from "react-native"

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

interface NotificationData {
  id: string
  title: string
  body: string
  data?: any
  timestamp: Date
  read: boolean
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([
    {
      id: "1",
      title: "Payslip Ready",
      body: "Your December 2024 payslip is now available for download",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
    },
    {
      id: "2",
      title: "Leave Approved",
      body: "Your annual leave request has been approved by your manager",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      read: false,
    },
    {
      id: "3",
      title: "Performance Review",
      body: "Your Q4 performance review is scheduled for next week",
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      read: true,
    },
  ])

  useEffect(() => {
    registerForPushNotificationsAsync()

    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const newNotification: NotificationData = {
        id: Date.now().toString(),
        title: notification.request.content.title || "New Notification",
        body: notification.request.content.body || "",
        data: notification.request.content.data,
        timestamp: new Date(),
        read: false,
      }
      setNotifications((prev) => [newNotification, ...prev])
    })

    // Listen for notification responses (when user taps notification)
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("Notification tapped:", response)
    })

    return () => {
      Notifications.removeNotificationSubscription(notificationListener)
      Notifications.removeNotificationSubscription(responseListener)
    }
  }, [])

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  }
}

async function registerForPushNotificationsAsync() {
  let token

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#10b981",
    })
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  if (finalStatus !== "granted") {
    console.log("Failed to get push token for push notification!")
    return
  }

  token = (await Notifications.getExpoPushTokenAsync()).data
  console.log("Push token:", token)

  return token
}
