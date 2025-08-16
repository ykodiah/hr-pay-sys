import type React from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User, FileText, Calendar, CreditCard, Settings, Bell, LogOut, Home } from "lucide-react"

export default function SelfServiceLayout({
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
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900">AkwaabaHRPay</span>
              <span className="text-sm text-gray-500 ml-2">Employee Portal</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
                <p className="text-xs text-gray-500">Software Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
            </div>

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
