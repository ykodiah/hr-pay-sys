"use client"

import type React from "react"
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
  Palette,
  FileText,
  Shield,
} from "lucide-react"
import { Suspense, useState, useEffect } from "react"

// Theme configuration and state management
const themes = {
  emerald: {
    name: "Emerald",
    primary: "emerald",
    colors: {
      50: "#ecfdf5",
      100: "#d1fae5",
      500: "#10b981",
      600: "#059669",
      700: "#047857",
    },
  },
  blue: {
    name: "Ocean Blue",
    primary: "blue",
    colors: {
      50: "#eff6ff",
      100: "#dbeafe",
      500: "#3b82f6",
      600: "#2563eb",
      700: "#1d4ed8",
    },
  },
  purple: {
    name: "Royal Purple",
    primary: "purple",
    colors: {
      50: "#faf5ff",
      100: "#f3e8ff",
      500: "#8b5cf6",
      600: "#7c3aed",
      700: "#6d28d9",
    },
  },
  orange: {
    name: "Sunset Orange",
    primary: "orange",
    colors: {
      50: "#fff7ed",
      100: "#ffedd5",
      500: "#f97316",
      600: "#ea580c",
      700: "#c2410c",
    },
  },
  rose: {
    name: "Rose Pink",
    primary: "rose",
    colors: {
      50: "#fff1f2",
      100: "#ffe4e6",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
    },
  },
}

export default function ClientAppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Theme state management
  const [currentTheme, setCurrentTheme] = useState("emerald")
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const theme = themes[currentTheme as keyof typeof themes]
    const root = document.documentElement

    // Apply CSS custom properties for the selected theme
    root.style.setProperty("--theme-primary-50", theme.colors[50])
    root.style.setProperty("--theme-primary-100", theme.colors[100])
    root.style.setProperty("--theme-primary-500", theme.colors[500])
    root.style.setProperty("--theme-primary-600", theme.colors[600])
    root.style.setProperty("--theme-primary-700", theme.colors[700])

    // Store theme preference
    localStorage.setItem("akwaaba-theme", currentTheme)
  }, [currentTheme])

  useEffect(() => {
    const savedTheme = localStorage.getItem("akwaaba-theme")
    if (savedTheme && themes[savedTheme as keyof typeof themes]) {
      setCurrentTheme(savedTheme)
    }
  }, [])

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

  const unreadCount = notifications.filter((n) => n.unread).length
  const theme = themes[currentTheme as keyof typeof themes]

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification)
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n)))
  }

  const handleSearch = (e: React.FormEvent) => {
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
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: theme.colors[600] }}
              >
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">AkwaabaHRPay</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, payroll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent w-64"
                style={
                  {
                    "--tw-ring-color": theme.colors[500],
                    focusRingColor: theme.colors[500],
                  } as React.CSSProperties
                }
              />
            </form>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Palette className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">Choose Theme</p>
                  <p className="text-xs text-gray-500">Customize your experience</p>
                </div>
                <DropdownMenuSeparator />
                {Object.entries(themes).map(([key, themeOption]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setCurrentTheme(key)}
                    className="flex items-center space-x-3"
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 border-gray-200"
                      style={{ backgroundColor: themeOption.colors[500] }}
                    />
                    <span className={currentTheme === key ? "font-medium" : ""}>{themeOption.name}</span>
                    {currentTheme === key && <span className="ml-auto text-xs">✓</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

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
                          {notification.unread && (
                            <div
                              className="w-2 h-2 rounded-full ml-2 mt-1"
                              style={{ backgroundColor: theme.colors[500] }}
                            />
                          )}
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
                    <Button variant="ghost" size="sm" className="w-full" style={{ color: theme.colors[600] }}>
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
                className="flex items-center space-x-3 px-3 py-2 rounded-lg font-medium"
                style={{
                  backgroundColor: theme.colors[50],
                  color: theme.colors[700],
                }}
              >
                <LayoutDashboard className="w-5 h-5" />
                <span>Dashboard</span>
              </a>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">HR Management</p>
                <a
                  href="/app/employees"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Users className="w-5 h-5" />
                  <span>Employees</span>
                </a>
                <a
                  href="/app/documents"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <FileText className="w-5 h-5" />
                  <span>Document Vault</span>
                </a>
                <a
                  href="/app/recruitment"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Recruitment</span>
                </a>
                <a
                  href="/app/disciplinary"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Shield className="w-5 h-5" />
                  <span>Disciplinary & Grievance</span>
                </a>
                <a
                  href="/app/offboarding"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Employee Offboarding</span>
                </a>
                <a
                  href="/app/performance"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Target className="w-5 h-5" />
                  <span>Performance</span>
                </a>
                <a
                  href="/app/learning"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Learning & Development</span>
                </a>
                <a
                  href="/app/leave"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Calendar className="w-5 h-5" />
                  <span>Leave Management</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payroll</p>
                <a
                  href="/app/payroll"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Calculator className="w-5 h-5" />
                  <span>Payroll Processing</span>
                </a>
                <a
                  href="/app/loans"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Loans & Advances</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Analytics</p>
                <a
                  href="/app/analytics"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Reports & Analytics</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System</p>
                <a
                  href="/app/integrations"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Plug className="w-5 h-5" />
                  <span>Integrations</span>
                </a>
                <a
                  href="/app/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = `var(--theme-primary-600)`
                    e.currentTarget.style.color = "white"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ""
                    e.currentTarget.style.color = ""
                  }}
                >
                  <Settings className="w-4 h-4 mr-2" />
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
