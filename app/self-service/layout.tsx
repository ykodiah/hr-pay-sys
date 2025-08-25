"use client"

import type React from "react"
import { useState } from "react"
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
  User,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  Bell,
  LogOut,
  Home,
  Target,
  Star,
  BookOpen,
  Award,
  ChevronDown,
  X,
  AlertTriangle,
  DoorOpen,
} from "lucide-react"
import { Logo } from "@/components/logo"

export default function SelfServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [selectedNotification, setSelectedNotification] = useState<any>(null)
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Payslip Available",
      message: "Your May 2024 payslip is ready for download",
      fullMessage:
        "Your payslip for May 2024 has been processed and is now available for download. The payslip includes your basic salary, allowances, deductions, and net pay details. Please review and download it from the Payslips section.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "Leave Request Approved",
      message: "Your annual leave request has been approved",
      fullMessage:
        "Your annual leave request for June 15-20, 2024 has been approved by your manager. The leave has been added to your leave balance and calendar. Please ensure proper handover of your responsibilities before the leave period.",
      time: "1 day ago",
      unread: true,
    },
    {
      id: 3,
      title: "Performance Review Due",
      message: "Your Q2 performance review is due next week",
      fullMessage:
        "Your Q2 2024 performance review is scheduled for completion by June 30, 2024. Please complete your self-assessment and prepare for the review meeting with your manager. Access the performance review section to get started.",
      time: "3 days ago",
      unread: false,
    },
  ])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleNotificationClick = (notification: any) => {
    setSelectedNotification(notification)
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, unread: false } : n)))
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
            <div className="flex items-center space-x-2">
              <Logo variant="icon" size="sm" />
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
              <span className="text-sm text-gray-500 ml-2">Employee Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-red-500 hover:bg-red-500">
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
                    <p className="text-xs text-gray-500">Software Engineer</p>
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
                <DropdownMenuItem onClick={() => (window.location.href = "/self-service/profile")}>
                  <User className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => (window.location.href = "/self-service/settings")}>
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
                <p className="text-sm text-gray-600">{selectedNotification?.fullMessage}</p>
                <p className="text-xs text-gray-400">{selectedNotification?.time}</p>
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
            <a
              href="/self-service"
              className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium"
            >
              <Home className="w-5 h-5" />
              <span>Dashboard</span>
            </a>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal</p>
              <a
                href="/self-service/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-5 h-5" />
                <span>My Profile</span>
              </a>
              <a
                href="/self-service/payslips"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>Payslips</span>
              </a>
            </div>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Performance</p>
              <a
                href="/self-service/goals"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Target className="w-5 h-5" />
                <span>My Goals</span>
              </a>
              <a
                href="/self-service/performance"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Star className="w-5 h-5" />
                <span>Performance Reviews</span>
              </a>
            </div>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Learning</p>
              <a
                href="/self-service/courses"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                <span>My Courses</span>
              </a>
              <a
                href="/self-service/certifications"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Award className="w-5 h-5" />
                <span>Certifications</span>
              </a>
            </div>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requests</p>
              <a
                href="/self-service/leave"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                <span>Leave Requests</span>
              </a>
              <a
                href="/self-service/loans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <CreditCard className="w-5 h-5" />
                <span>Loan Requests</span>
              </a>
              <a
                href="/self-service/grievances"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>Grievances</span>
              </a>
            </div>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Support</p>
              <a
                href="/self-service/exit-process"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <DoorOpen className="w-5 h-5" />
                <span>Exit Process</span>
              </a>
            </div>

            <div className="pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Settings</p>
              <a
                href="/self-service/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>Account Settings</span>
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
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
