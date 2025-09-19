"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, AlertTriangle, CheckCircle, Clock, X, Eye, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { TaxRateUpdate } from "@/lib/tax-api-service"

interface NotificationPreferences {
  emailNotifications: boolean
  pushNotifications: boolean
  urgentOnly: boolean
  countries: string[]
}

interface TaxNotification {
  id: string
  type: "update_available" | "update_applied" | "api_error" | "compliance_warning"
  title: string
  message: string
  country: string
  taxYear: number
  priority: "low" | "medium" | "high" | "urgent"
  timestamp: Date
  read: boolean
  actionRequired: boolean
  relatedUpdate?: TaxRateUpdate
}

export default function TaxUpdateNotifications() {
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<TaxNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    emailNotifications: true,
    pushNotifications: true,
    urgentOnly: false,
    countries: ["ghana", "nigeria"],
  })

  // Sample notifications
  useEffect(() => {
    const sampleNotifications: TaxNotification[] = [
      {
        id: "1",
        type: "update_available",
        title: "New Tax Rates Available - Ghana 2026",
        message:
          "Ghana Revenue Authority has published updated tax rates for 2026. Review and apply the changes before January 1st, 2026.",
        country: "Ghana",
        taxYear: 2026,
        priority: "high",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        actionRequired: true,
        relatedUpdate: {
          country: "Ghana",
          currency: "GHS",
          taxYear: 2026,
          status: "available",
          effectiveDate: "2026-01-01",
          changes: ["Updated band 4 rate from 17.5% to 18%", "Increased threshold for band 6"],
          source: "government_api",
          confidence: 0.95,
          validationStatus: "verified",
        },
      },
      {
        id: "2",
        type: "compliance_warning",
        title: "Tax Compliance Deadline Approaching",
        message:
          "You have 15 days remaining to apply the new tax rates for Ghana 2025. Failure to update may result in compliance issues.",
        country: "Ghana",
        taxYear: 2025,
        priority: "urgent",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        read: false,
        actionRequired: true,
      },
      {
        id: "3",
        type: "update_applied",
        title: "Tax Rates Successfully Updated",
        message: "Nigeria tax rates for 2025 have been successfully applied to your system.",
        country: "Nigeria",
        taxYear: 2025,
        priority: "medium",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true,
        actionRequired: false,
      },
      {
        id: "4",
        type: "api_error",
        title: "API Connection Issue",
        message: "Unable to connect to Ghana Revenue Authority API. Tax rate updates may be delayed.",
        country: "Ghana",
        taxYear: 2025,
        priority: "medium",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        read: true,
        actionRequired: false,
      },
    ]

    setNotifications(sampleNotifications)
    setUnreadCount(sampleNotifications.filter((n) => !n.read).length)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const dismissNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId))
    const notification = notifications.find((n) => n.id === notificationId)
    if (notification && !notification.read) {
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "destructive"
      case "high":
        return "default"
      case "medium":
        return "secondary"
      case "low":
        return "outline"
      default:
        return "outline"
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "update_available":
        return <Bell className="h-4 w-4" />
      case "update_applied":
        return <CheckCircle className="h-4 w-4" />
      case "api_error":
        return <AlertTriangle className="h-4 w-4" />
      case "compliance_warning":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  const handleApplyUpdate = async (notification: TaxNotification) => {
    if (!notification.relatedUpdate) return

    try {
      const response = await fetch("/api/tax-rates/apply-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notification.relatedUpdate),
      })

      if (response.ok) {
        toast({
          title: "Tax Rates Updated",
          description: `Successfully applied ${notification.country} tax rates for ${notification.taxYear}`,
        })

        // Mark notification as read and update type
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, read: true, type: "update_applied", actionRequired: false } : n,
          ),
        )
      } else {
        throw new Error("Failed to apply update")
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to apply tax rate update. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      {/* Notification Bell Icon */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Tax Rate Notifications</span>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Mark all as read
                </Button>
              )}
            </DialogTitle>
            <DialogDescription>Stay updated on tax rate changes and compliance requirements</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`transition-all ${!notification.read ? "border-l-4 border-l-blue-500 bg-blue-50/50" : ""}`}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className={`font-semibold ${!notification.read ? "text-blue-900" : ""}`}>
                              {notification.title}
                            </h4>
                            <Badge variant={getPriorityColor(notification.priority)}>{notification.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{notification.message}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {notification.country} {notification.taxYear}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimestamp(notification.timestamp)}
                            </span>
                          </div>

                          {notification.actionRequired && (
                            <div className="flex gap-2 pt-2">
                              {notification.relatedUpdate && (
                                <Button size="sm" onClick={() => handleApplyUpdate(notification)}>
                                  Apply Update
                                </Button>
                              )}
                              <Button variant="outline" size="sm" onClick={() => markAsRead(notification.id)}>
                                <Eye className="h-3 w-3 mr-1" />
                                Review
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {!notification.read && (
                          <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification.id)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Urgent Notifications Banner */}
      {notifications.some((n) => n.priority === "urgent" && !n.read) && (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            You have urgent tax compliance notifications that require immediate attention.
            <Button variant="link" className="p-0 h-auto ml-2 text-red-600" onClick={() => setShowNotifications(true)}>
              View Now
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}
