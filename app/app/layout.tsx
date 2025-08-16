import type React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import { Suspense } from "react"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees, payroll..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent w-64"
              />
            </div>
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>KA</AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900">Kwame Asante</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                <a
                  href="/app/employees"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Employees</span>
                </a>
                <a
                  href="/app/recruitment"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Recruitment</span>
                </a>
                <a
                  href="/app/performance"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Target className="w-5 h-5" />
                  <span>Performance</span>
                </a>
                <a
                  href="/app/learning"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="w-5 h-5" />
                  <span>Learning & Development</span>
                </a>
                <a
                  href="/app/leave"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Leave Management</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Payroll</p>
                <a
                  href="/app/payroll"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Payroll Processing</span>
                </a>
                <a
                  href="/app/loans"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Loans & Advances</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Analytics</p>
                <a
                  href="/app/analytics"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <BarChart3 className="w-5 h-5" />
                  <span>Reports & Analytics</span>
                </a>
              </div>

              <div className="pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">System</p>
                <a
                  href="/app/settings"
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </a>
              </div>
            </Suspense>

            {/* User Menu at Bottom */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="border-t border-gray-200 pt-4">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600">
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
