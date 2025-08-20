"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  LayoutDashboard,
  Users,
  Calendar,
  Calculator,
  CreditCard,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  LogOut,
  UserPlus,
  Target,
  BookOpen,
  Plug,
  User,
  ChevronDown,
  X,
  Wifi,
  WifiOff,
} from "lucide-react"
import { Suspense, useState, useEffect } from "react"
import { useFeatures } from "../../shared/hooks/useFeatures"
import { useRealtime } from "../../shared/hooks/useRealtime"
import { apiClient } from "../../shared/api/apiClient"
import { syncService } from "../../shared/services/syncService"

export default function ClientAppLayout({
  children,
}: {
  children: ReactNode
}) {
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New Leave Request",
      message: "John Doe has submitted a leave request for approval",
      fullMessage:
        "John Doe has submitted a leave request for March 15-20, 2024. The request is for annual leave and requires your immediate attention for approval. Please review the request details and approve or reject accordingly.",
      time: "2 minutes ago",
      unread: true,
    },
    {
      id: 2,
      title: "Payroll Processing Complete",
      message: "March 2024 payroll has been processed successfully",
      fullMessage:
        "The payroll for March 2024 has been successfully processed for all 150 employees. Total gross pay: GH₵ 450,000. All statutory deductions including PAYE, SSNIT, and Tier 3 contributions have been calculated and are ready for submission to relevant authorities.",
      time: "1 hour ago",
      unread: true,
    },
    {
      id: 3,
      title: "New Employee Onboarded",
      message: "Sarah Johnson has completed onboarding process",
      fullMessage:
        "Sarah Johnson has successfully completed the onboarding process and is now active in the system. All required documents have been uploaded and verified. Her employee ID is EMP-2024-045.",
      time: "3 hours ago",
      unread: false,
    },
  ])

  const { isFeatureEnabled } = useFeatures("web")
  const { isConnected, subscribe } = useRealtime("admin-user", "web")

  useEffect(() => {
    const unsubscribe = subscribe("notification", (notification: any) => {
      setNotifications((prev) => [
        {
          id: Date.now(),
          title: notification.title,
          message: notification.message,
          fullMessage: notification.fullMessage || notification.message,
          time: "Just now",
          unread: true,
        },
        ...prev,
      ])
    })

    return unsubscribe
  }, [subscribe])

  const token = localStorage.getItem("authToken")
  if (token) {
    apiClient.setToken(token)
    syncService.startSync()
  }

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification)
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n)))
  }

  const handleSearch = (e: any) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/app/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  const handleSignOut = () => {
    localStorage.removeItem("authToken")
    sessionStorage.clear()
    window.location.href = "/login"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">AkwaabaHRPay</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <div className="flex items-center space-x-1 text-emerald-600">
                  <Wifi className="w-4 h-4" />
                  <span className="text-xs hidden sm:block">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-gray-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-xs hidden sm:block">Offline</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, payroll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
              />
            </form>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  {unreadCount > 0 && <p className="text-sm text-gray-500">{unreadCount} unread notifications</p>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${
                          notification.unread ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{notification.time}</p>
                          </div>
                          {notification.unread && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No notifications</p>
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-2 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-emerald-600">
                      View all notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src="/placeholder.svg?height=32&width=32" />
                    <AvatarFallback>KA</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">Kwame Asante</p>
                    <p className="text-xs text-gray-500">Admin</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Kwame Asante</p>
                  <p className="text-xs text-gray-500">kwame.asante@company.com</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => (window.location.href = "/app/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/app/settings")}>
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Notification Modal Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={() => setSelectedNotification(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              {selectedNotification?.title}
              <Button variant="ghost" size="sm" onClick={() => setSelectedNotification(null)} className="h-6 w-6 p-0">
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
            <DialogDescription className="text-left">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">{selectedNotification?.fullMessage}</div>
                <div className="text-xs text-gray-400">{selectedNotification?.time}</div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setSelectedNotification(null)}>
              Close
            </Button>
            <Button onClick={() => setSelectedNotification(null)}>Mark as Read</Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
          <nav className="p-4 space-y-2">
            <Suspense fallback={<div>Loading...</div>}>
              <a
                href="/app"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium"
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </a>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">HR Management</p>
                {isFeatureEnabled("EMPLOYEE_MANAGEMENT") && (
                  <a
                    href="/app/employees"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>Employees</span>
                  </a>
                )}
                {isFeatureEnabled("RECRUITMENT") && (
                  <a
                    href="/app/recruitment"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <UserPlus className="w-5 h-5" />
                    <span>Recruitment</span>
                  </a>
                )}
                {isFeatureEnabled("PERFORMANCE_MANAGEMENT") && (
                  <a
                    href="/app/performance"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Target className="w-5 h-5" />
                    <span>Performance</span>
                  </a>
                )}
                {isFeatureEnabled("LEARNING_DEVELOPMENT") && (
                  <a
                    href="/app/learning"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>Learning & Development</span>
                  </a>
                )}
                {isFeatureEnabled("LEAVE_MANAGEMENT") && (
                  <a
                    href="/app/leave"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Calendar className="w-5 h-5" />
                    <span>Leave Management</span>
                  </a>
                )}
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payroll</p>
                {isFeatureEnabled("PAYROLL_PROCESSING") && (
                  <a
                    href="/app/payroll"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Calculator className="w-5 h-5" />
                    <span>Payroll Processing</span>
                  </a>
                )}
                {isFeatureEnabled("LOAN_MANAGEMENT") && (
                  <a
                    href="/app/loans"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Loans & Advances</span>
                  </a>
                )}
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Analytics</p>
                {isFeatureEnabled("ANALYTICS_REPORTING") && (
                  <a
                    href="/app/analytics"
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <BarChart3 className="w-5 h-5" />
                    <span>Reports & Analytics</span>
                  </a>
                )}
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System</p>
                <a
                  href="/app/integrations"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Plug className="w-5 h-5" />
                  <span>Integrations</span>
                </a>
                <a
                  href="/app/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </a>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className="w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </Suspense>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
