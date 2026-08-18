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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
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
  Clock,
  Sigma as Sitemap,
  Home,
  ChevronRight,
  Plus,
  Zap,
  Star,
  History,
  TrendingUp,
  Building2,
  UserCheck,
  FileCheck,
  MessageSquare,
  Briefcase,
  Award,
  GraduationCap,
  DollarSign,
  PieChart,
  Timer,
  CheckSquare,
  Globe,
  Cog,
  ArrowRight,
  ArrowLeft,
  Video,
  Brain,
  ClipboardList,
  AlertCircle,
  Receipt,
} from "lucide-react"
import { Suspense, useState, useEffect, useMemo } from "react"
import { AIChatbox } from "@/components/ai-chatbox"
import { EmployeeAIChatbox } from "@/components/employee-ai-chatbox"
import { CurrencyProvider } from "@/lib/currency-context"
import { NavTree } from "@/components/nav/NavTree"
import {
  APP_NAV_TREE,
  APP_NAV_FLAT_SECTIONS,
  filterNavTreeByGates,
} from "@/lib/navigation/app-nav-tree"
import { createClient } from "@/lib/supabase/client"

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [currentPath, setCurrentPath] = useState("")
  const [breadcrumbs, setBreadcrumbs] = useState<{ label: string; href: string; icon: any }[]>([])
  const [adminAccount, setAdminAccount] = useState<any>(null)

  // Service Worker registration with proper error handling
  useEffect(() => {
    // Only register Service Worker in production and if supported
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      // Wait for the page to be fully loaded
      window.addEventListener("load", () => {
        // Check if document is in a valid state
        if (document.readyState === "complete") {
          navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
              console.log("[v0] Service Worker registered successfully:", registration.scope)
            })
            .catch((error) => {
              // Silently fail - Service Worker is optional
              console.log("[v0] Service Worker registration skipped:", error.message)
            })
        }
      })
    }
  }, [])

  useEffect(() => {
    fetch("/api/admin/account")
      .then(async (response) => (response.ok ? response.json() : null))
      .then((value) => value && setAdminAccount(value))
      .catch(() => undefined)
  }, [])

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

  // Generate breadcrumbs based on current path
  useEffect(() => {
    const path = window.location.pathname
    setCurrentPath(path)
    
    const pathSegments = path.split('/').filter(Boolean)
    const breadcrumbItems = []
    
    // Add home
    breadcrumbItems.push({ label: 'Dashboard', href: '/app', icon: Home })
    
      if (pathSegments.length > 1) {
        const module = pathSegments[1]
        const moduleMap = {
          'employees': { label: 'Employees', icon: Users },
          'payroll': { label: 'Payroll', icon: Calculator },
          'attendance': { label: 'Attendance', icon: Clock },
          'leave': { label: 'Leave Management', icon: Calendar },
          'performance': { label: 'Performance', icon: Target },
          'learning': { label: 'Learning', icon: BookOpen },
          'documents': { label: 'Documents', icon: FileText },
          'analytics': { label: 'Analytics', icon: BarChart3 },
          'reports': { label: 'Compliance Reports', icon: FileCheck },
          'settings': { label: 'Settings', icon: Settings },
          'recruitment': { label: 'Recruitment', icon: UserPlus },
          'communication': { label: 'Communication', icon: MessageSquare },
          'org-chart': { label: 'Org Chart', icon: Sitemap },
          'self-service': { label: 'My Portal', icon: UserCheck },
          'disciplinary': { label: 'Disciplinary', icon: Shield },
          'offboarding': { label: 'Offboarding', icon: LogOut },
          'promotions': { label: 'Promotions', icon: Award },
          'loans': { label: 'Loans', icon: CreditCard },
          'integrations': { label: 'Integrations', icon: Plug },
          'meetings': { label: 'Meetings', icon: Video },
          'ml-analytics': { label: 'ML Analytics', icon: Brain },
          'hr': { label: 'HR', icon: ClipboardList },
          'overtime': { label: 'Overtime', icon: Timer },
          'approvals': { label: 'Approvals', icon: CheckSquare },
        }

        const moduleEntry = moduleMap[module as keyof typeof moduleMap]
        if (moduleEntry) {
          breadcrumbItems.push({
            label: moduleEntry.label,
            href: `/app/${module}`,
            icon: moduleEntry.icon,
          })
        }

        if (pathSegments.length > 2) {
          const subPage = pathSegments[2]
          const subPageMap = {
            history: "History",
            input: "Pay Inputs",
            reports: "Reports",
            profile: "Profile",
            settings: "Settings",
            "update-details": "Update details",
            "change-requests": "Change Requests",
          }

          if (subPageMap[subPage as keyof typeof subPageMap]) {
            breadcrumbItems.push({
              label: subPageMap[subPage as keyof typeof subPageMap],
              href: path,
              icon: null,
            })
          }
        }
      }
    
    setBreadcrumbs(breadcrumbItems)
  }, [])

  // Flat leftover sections (Payroll / Analytics / Hub / Admin) — icons for sidebar
  const flatSectionIconMap: Record<string, any> = {
    payroll_input: ClipboardList,
    payroll: Calculator,
    payroll_reports: FileCheck,
    tax_reliefs: Shield,
    payslips: Receipt,
    payroll_history: History,
    approvals: CheckSquare,
    loans: CreditCard,
    analytics: BarChart3,
    compliance_reports: FileCheck,
    ml_analytics: Brain,
    self_service: UserCheck,
    update_details: FileCheck,
    change_requests: ClipboardList,
    disciplinary: Shield,
    offboarding: LogOut,
    integrations: Plug,
    settings: Settings,
  }

  const [enabledModuleCodes, setEnabledModuleCodes] = useState<string[] | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch("/api/settings/modules", { credentials: "include", cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (Array.isArray(data.enabled_codes) && data.enabled_codes.length) {
          setEnabledModuleCodes(data.enabled_codes)
        }
      } catch {
        // keep full nav
      }
    })()
  }, [])

  const navTreeModules = useMemo(
    () => filterNavTreeByGates(APP_NAV_TREE, enabledModuleCodes),
    [enabledModuleCodes],
  )

  const flatNavigationSections = useMemo(
    () =>
      APP_NAV_FLAT_SECTIONS.map((section) => ({
        title: section.title,
        items: section.items
          .filter((item) => !enabledModuleCodes || enabledModuleCodes.includes(item.code))
          .map((item) => ({
            ...item,
            name: item.name,
            icon: flatSectionIconMap[item.code] || FileText,
            description: "",
          })),
      })).filter((section) => section.items.length > 0),
    [enabledModuleCodes],
  )

  // Quick actions for common tasks
  const quickActions = [
    { name: "Add Employee", href: "/app/employees?action=add", icon: UserPlus, color: "bg-blue-500" },
    { name: "Process Payroll", href: "/app/payroll?action=process", icon: Calculator, color: "bg-green-500" },
    { name: "View Reports", href: "/app/analytics", icon: BarChart3, color: "bg-purple-500" },
    { name: "Upload Documents", href: "/app/documents?action=upload", icon: FileText, color: "bg-orange-500" }
  ]

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

  const handleSignOut = async () => {
    await createClient().auth.signOut().catch(() => undefined)
    localStorage.removeItem("authToken")
    sessionStorage.clear()
    window.location.href = "/login"
  }

  const adminProfile = adminAccount?.profile || {}
  const adminName = adminProfile.display_name || "Administrator"
  const adminRole = adminProfile.role_label || "Admin"
  const adminInitials = adminName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase())
    .join("") || "AD"

  return (
    <CurrencyProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="md:hidden">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: theme.colors[600] }}
                        >
                          <span className="text-white font-bold text-sm">A</span>
                        </div>
                        <span className="text-lg font-bold text-gray-900">AkwaabaHRPay</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4">
                      <a
                        href="/app"
                        className="mb-4 flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-5 w-5 text-gray-500" />
                        <span className="font-medium">Dashboard</span>
                      </a>
                      <Suspense fallback={null}>
                        <NavTree
                          modules={navTreeModules}
                          themeColor={theme.colors[600]}
                          onNavigate={() => setIsMobileMenuOpen(false)}
                        />
                      </Suspense>
                      {flatNavigationSections.map((section, sectionIndex) => (
                        <div key={sectionIndex} className="mb-6 mt-4">
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {section.title}
                          </h3>
                          <div className="space-y-1">
                            {section.items.map((item, itemIndex) => (
                              <a
                                key={itemIndex}
                                href={item.href}
                                className="group flex items-center space-x-3 rounded-lg px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100"
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <item.icon className="h-5 w-5 text-gray-500 group-hover:text-gray-700" />
                                <div className="flex-1">
                                  <div className="font-medium">{item.name}</div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 border-t">
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
                </SheetContent>
              </Sheet>

              {/* Desktop Sidebar Toggle */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="hidden md:block"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <Menu className="w-5 h-5" />
              </Button>

              {/* Logo */}
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

            {/* Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden md:block">
              <form onSubmit={handleSearch} className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search employees, payroll..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent font-sans"
                  style={{
                    "--tw-ring-color": theme.colors[500],
                    focusRingColor: theme.colors[500],
                  } as React.CSSProperties}
                />
              </form>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Search */}
              <Button variant="ghost" size="sm" className="md:hidden">
                <Search className="w-5 h-5" />
              </Button>

              {/* Quick Actions Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="hidden lg:flex">
                    <Zap className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">Quick Actions</p>
                    <p className="text-xs text-gray-500">Common tasks and shortcuts</p>
                  </div>
                  <DropdownMenuSeparator />
                  {quickActions.map((action, index) => (
                    <DropdownMenuItem key={index} onClick={() => window.location.href = action.href}>
                      <div className={`w-2 h-2 rounded-full mr-3 ${action.color}`} />
                      <div>
                        <div className="font-medium">{action.name}</div>
                        <div className="text-xs text-gray-500">Quick access</div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Selector */}
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

              {/* Notifications */}
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

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={adminProfile.avatar_url || undefined} />
                      <AvatarFallback>{adminInitials}</AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">{adminName}</p>
                      <p className="text-xs text-gray-500">{adminRole}</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{adminName}</p>
                    <p className="text-xs text-gray-500">{adminProfile.email || ""}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => (window.location.href = "/app/profile")}>
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </DropdownMenuItem>
                  {adminAccount?.can_access_employee_portal && (
                    <DropdownMenuItem onClick={() => (window.location.href = "/self-service")}>
                      <UserCheck className="w-4 h-4 mr-2" />
                      Switch to employee portal
                    </DropdownMenuItem>
                  )}
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

          {/* Breadcrumb Navigation */}
          {breadcrumbs.length > 1 && (
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <Breadcrumb>
                <BreadcrumbList>
                  {breadcrumbs.map((crumb, index) => (
                    <div key={index} className="flex items-center">
                      {index > 0 && <BreadcrumbSeparator className="mx-2" />}
                      <BreadcrumbItem>
                        {index === breadcrumbs.length - 1 ? (
                          <BreadcrumbPage className="flex items-center space-x-2">
                            {crumb.icon && <crumb.icon className="w-4 h-4" />}
                            <span>{crumb.label}</span>
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink href={crumb.href} className="flex items-center space-x-2">
                            {crumb.icon && <crumb.icon className="w-4 h-4" />}
                            <span>{crumb.label}</span>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          )}
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
          {/* Desktop Sidebar */}
          <aside className={`bg-white border-r border-gray-200 sticky top-0 h-screen transition-all duration-300 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          } hidden md:flex md:flex-col flex-shrink-0`}>
            <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin">
              <Suspense fallback={<div>Loading...</div>}>
                {/* Dashboard Link */}
                <a
                  href="/app"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg font-medium ${
                    currentPath === '/app' ? 'bg-gray-100' : ''
                  }`}
                  style={currentPath === '/app' ? {
                    backgroundColor: theme.colors[50],
                    color: theme.colors[700],
                  } : {}}
                >
                  <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>Dashboard</span>}
                </a>

                {/* Phase-1 collapsible numbered tree */}
                <Suspense fallback={null}>
                  <NavTree
                    modules={navTreeModules}
                    collapsed={sidebarCollapsed}
                    themeColor={theme.colors[600]}
                  />
                </Suspense>

                {/* Remaining flat sections (Payroll / Analytics / Hub / Admin) */}
                {flatNavigationSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="pt-4">
                    {!sidebarCollapsed && (
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                        {section.title}
                      </p>
                    )}
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => {
                        const isActive =
                          currentPath === item.href || currentPath.startsWith(item.href + "/")
                        return (
                          <a
                            key={itemIndex}
                            href={item.href}
                            className={`group flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors ${
                              isActive ? "text-white" : "text-gray-700 hover:text-white"
                            }`}
                            style={
                              isActive
                                ? {
                                    backgroundColor: theme.colors[600],
                                  }
                                : {}
                            }
                            onMouseEnter={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = theme.colors[600]
                                e.currentTarget.style.color = "white"
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isActive) {
                                e.currentTarget.style.backgroundColor = ""
                                e.currentTarget.style.color = ""
                              }
                            }}
                            title={sidebarCollapsed ? item.name : undefined}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!sidebarCollapsed && (
                              <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">{item.name}</div>
                              </div>
                            )}
                          </a>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Quick Actions Section */}
                {!sidebarCollapsed && (
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                      Quick Actions
                    </p>
                    <div className="space-y-1">
                      {quickActions.map((action, index) => (
                        <a
                          key={index}
                          href={action.href}
                          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:text-white transition-colors group"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = theme.colors[600]
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = ''
                            e.currentTarget.style.color = ''
                          }}
                        >
                          <action.icon className="w-5 h-5" />
                          <span className="font-medium">{action.name}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sign Out */}
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Button
                    variant="ghost"
                    onClick={handleSignOut}
                    className={`w-full justify-start text-gray-700 hover:text-red-600 hover:bg-red-50 ${
                      sidebarCollapsed ? 'px-3' : ''
                    }`}
                    title={sidebarCollapsed ? 'Sign Out' : undefined}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {!sidebarCollapsed && 'Sign Out'}
                  </Button>
                </div>
              </Suspense>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-4 md:p-6 overflow-x-auto">
            {children}
          </main>
        </div>
          {currentPath.startsWith("/app/self-service") ? <EmployeeAIChatbox /> : <AIChatbox />}
      </div>
    </CurrencyProvider>
  )
}
