import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calculator, Calendar, CreditCard, BarChart3, Settings, Home, Bell, Search } from "lucide-react"
import { Suspense } from "react"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Suspense fallback={<div>Loading...</div>}>
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">A</span>
                </div>
                <span className="font-serif font-bold text-xl">AkwaabaHRPay</span>
                <Badge variant="secondary" className="ml-2">
                  Admin
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search employees, payroll..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gray-300"></div>
                <span className="text-sm font-medium">Admin User</span>
              </div>
            </div>
          </div>
        </header>
      </Suspense>

      <div className="flex">
        {/* Sidebar Navigation */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            <div className="space-y-2">
              <a
                href="/admin"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </a>

              <a
                href="/admin/employees"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Users className="h-5 w-5" />
                <span className="font-medium">Employees</span>
              </a>

              <a
                href="/admin/payroll"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Calculator className="h-5 w-5" />
                <span className="font-medium">Payroll</span>
              </a>

              <a
                href="/admin/leave"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Leave Management</span>
              </a>

              <a
                href="/admin/loans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Loans & Advances</span>
              </a>

              <a
                href="/admin/analytics"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <BarChart3 className="h-5 w-5" />
                <span className="font-medium">Analytics</span>
              </a>

              <a
                href="/admin/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
