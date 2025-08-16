interface PushNotificationData {
  title: string
  body: string
  data?: any
  badge?: number
}

class PushNotificationService {
  private platform: "web" | "mobile"
  private token: string | null = null

  constructor(platform: "web" | "mobile") {
    this.platform = platform
  }

  async initialize() {
    if (this.platform === "mobile") {
      // React Native push notifications setup
      const { Notifications } = require("expo-notifications")

      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      })

      // Get permission
      const { status } = await Notifications.requestPermissionsAsync()
      if (status !== "granted") {
        console.warn("[v0] Push notification permission denied")
        return null
      }

      // Get push token
      const tokenData = await Notifications.getExpoPushTokenAsync()
      this.token = tokenData.data

      return this.token
    } else {
      // Web push notifications setup
      if ("serviceWorker" in navigator && "PushManager" in window) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js")
          const permission = await Notification.requestPermission()

          if (permission === "granted") {
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
            })
            this.token = JSON.stringify(subscription)
            return this.token
          }
        } catch (error) {
          console.error("[v0] Web push setup error:", error)
        }
      }
      return null
    }
  }

  async sendLocalNotification(data: PushNotificationData) {
    if (this.platform === "mobile") {
      const { Notifications } = require("expo-notifications")
      await Notifications.scheduleNotificationAsync({
        content: {
          title: data.title,
          body: data.body,
          data: data.data,
          badge: data.badge,
        },
        trigger: null, // Show immediately
      })
    } else {
      // Web notification
      if (Notification.permission === "granted") {
        new Notification(data.title, {
          body: data.body,
          data: data.data,
          badge: "/icon-192.png",
          icon: "/icon-192.png",
        })
      }
    }
  }

  async registerForRemoteNotifications(userId: string) {
    if (!this.token) {
      await this.initialize()
    }

    if (this.token) {
      // Register token with backend
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          userId,
          token: this.token,
          platform: this.platform,
        }),
      })

      return response.ok
    }
    return false
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.platform === "mobile") {
      const AsyncStorage = require("@react-native-async-storage/async-storage").default
      return await AsyncStorage.getItem("auth_token")
    } else {
      return localStorage.getItem("auth_token")
    }
  }

  setupNotificationHandlers() {
    if (this.platform === "mobile") {
      const { Notifications } = require("expo-notifications")

      // Handle notification received while app is in foreground
      Notifications.addNotificationReceivedListener((notification: any) => {
        console.log("[v0] Notification received:", notification)
        // Trigger sync when notification received
        window.dispatchEvent(
          new CustomEvent("notification_received", {
            detail: notification.request.content,
          }),
        )
      })

      // Handle notification tap
      Notifications.addNotificationResponseReceivedListener((response: any) => {
        console.log("[v0] Notification tapped:", response)
        // Navigate to relevant screen based on notification data
        const data = response.notification.request.content.data
        if (data?.screen) {
          // Handle navigation
          window.dispatchEvent(
            new CustomEvent("navigate_to_screen", {
              detail: data.screen,
            }),
          )
        }
      })
    }
  }
}

export const webPushService = new PushNotificationService("web")
export const mobilePushService = new PushNotificationService("mobile")
