"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  DollarSign,
  MessageSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building,
  FileText,
  Bell,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: any
  roles?: string[]
  children?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    href: "/users",
    icon: UserCheck,
    roles: ["super_admin", "school_admin"],
    children: [
      { title: "All Users", href: "/users", icon: Users },
      { title: "Create User", href: "/users/create", icon: UserCheck },
      { title: "Staff", href: "/users/staff", icon: Users },
      { title: "Parents", href: "/users/parents", icon: Users },
    ],
  },
  {
    title: "Students",
    href: "/students",
    icon: Users,
    roles: ["super_admin", "school_admin", "principal", "teacher"],
    children: [
      { title: "All Students", href: "/students", icon: Users },
      { title: "Admissions", href: "/students/admissions", icon: UserCheck },
      { title: "Enrollments", href: "/students/enrollments", icon: FileText },
    ],
  },
  {
    title: "Academic",
    href: "/academic",
    icon: BookOpen,
    roles: ["super_admin", "school_admin", "principal", "teacher"],
    children: [
      { title: "Classes", href: "/academic/classes", icon: Building },
      { title: "Subjects", href: "/academic/subjects", icon: BookOpen },
      { title: "Timetable", href: "/academic/timetable", icon: Calendar },
      { title: "Terms", href: "/academic/terms", icon: Calendar },
    ],
  },
  {
    title: "Attendance",
    href: "/attendance",
    icon: ClipboardCheck,
    roles: ["super_admin", "school_admin", "principal", "teacher"],
  },
  {
    title: "Assessments",
    href: "/assessments",
    icon: FileText,
    roles: ["super_admin", "school_admin", "principal", "teacher"],
    children: [
      { title: "Gradebook", href: "/assessments/gradebook", icon: FileText },
      { title: "Exams", href: "/assessments/exams", icon: ClipboardCheck },
      { title: "Reports", href: "/assessments/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Fees & Finance",
    href: "/finance",
    icon: DollarSign,
    roles: ["super_admin", "school_admin", "principal"],
    children: [
      { title: "Fee Structure", href: "/finance/structure", icon: Settings },
      { title: "Invoices", href: "/finance/invoices", icon: FileText },
      { title: "Payments", href: "/finance/payments", icon: DollarSign },
      { title: "Scholarships", href: "/finance/scholarships", icon: GraduationCap },
    ],
  },
  {
    title: "Communications",
    href: "/communications",
    icon: MessageSquare,
    children: [
      { title: "Announcements", href: "/communications/announcements", icon: Bell },
      { title: "Messages", href: "/communications/messages", icon: MessageSquare },
    ],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["super_admin", "school_admin", "principal"],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    roles: ["super_admin", "school_admin"],
  },
]

interface SidebarProps {
  userRoles?: string[]
}

export function Sidebar({ userRoles = [] }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const filteredItems = navigationItems.filter((item) => {
    if (!item.roles) return true
    return item.roles.some((role) => userRoles.includes(role))
  })

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", collapsed ? "w-16" : "w-64")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center">
            <GraduationCap className="h-8 w-8 text-blue-600 mr-2" />
            <span className="font-semibold text-gray-900">SMS</span>
          </div>
        )}
        <Button variant="ghost" size="sm" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8 p-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-2">
          {filteredItems.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                )}
              >
                <item.icon className={cn("flex-shrink-0", collapsed ? "h-5 w-5" : "h-5 w-5 mr-3")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>

              {/* Sub-navigation */}
              {!collapsed && item.children && pathname.startsWith(item.href) && (
                <div className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm rounded-md transition-colors",
                        pathname === child.href
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-500 hover:bg-gray-50 hover:text-gray-700",
                      )}
                    >
                      <child.icon className="h-4 w-4 mr-2" />
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
