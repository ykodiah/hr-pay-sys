import type React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { User, FileText, Calendar, CreditCard, Settings, Bell, LogOut, Home } from "lucide-react"
import { Suspense } from "react"

export default function PortalLayout({
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
                <Badge variant="outline" className="ml-2">
                  Employee Portal
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                  AM
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">Akosua Mensah</p>
                  <p className="text-xs text-gray-500">HR Manager</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <LogOut className="h-4 w-4" />
              </Button>
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
                href="/portal"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Home className="h-5 w-5" />
                <span className="font-medium">Dashboard</span>
              </a>

              <a
                href="/portal/profile"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <User className="h-5 w-5" />
                <span className="font-medium">My Profile</span>
              </a>

              <a
                href="/portal/payslips"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <FileText className="h-5 w-5" />
                <span className="font-medium">Payslips</span>
              </a>

              <a
                href="/portal/leave"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Leave & Time Off</span>
              </a>

              <a
                href="/portal/loans"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <CreditCard className="h-5 w-5" />
                <span className="font-medium">Loans & Advances</span>
              </a>

              <a
                href="/portal/settings"
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Settings className="h-5 w-5" />
                <span className="font-medium">Settings</span>
              </a>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
              <h3 className="font-semibold text-sm text-cyan-900 mb-3">Quick Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-cyan-700">Annual Leave</span>
                  <span className="font-medium text-cyan-900">18 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-700">Sick Leave</span>
                  <span className="font-medium text-cyan-900">8 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-700">Active Loans</span>
                  <span className="font-medium text-cyan-900">1</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
