"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User, FileText, Calendar, CreditCard, Settings, Bell, LogOut, Home, Menu, X } from "lucide-react"

export default function SelfServiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const NavigationItems = () => (
    <nav className="space-y-2">
      <a
        href="/self-service"
        className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-medium"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Home className="w-5 h-5" />
        <span>Dashboard</span>
      </a>

      <div className="pt-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Personal</p>
        <a
          href="/self-service/profile"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <User className="w-5 h-5" />
          <span>My Profile</span>
        </a>
        <a
          href="/self-service/payslips"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
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
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Calendar className="w-5 h-5" />
          <span>Leave Requests</span>
        </a>
        <a
          href="/self-service/loans"
          className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          onClick={() => setIsMobileMenuOpen(false)}
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
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <Settings className="w-5 h-5" />
          <span>Account Settings</span>
        </a>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
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
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="text-lg font-bold text-gray-900">AkwaabaHRPay</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <NavigationItems />
                  <div className="mt-8 pt-4 border-t border-gray-200">
                    <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-bold text-gray-900">AkwaabaHRPay</span>
                <span className="text-xs text-gray-500 hidden sm:block">Employee Portal</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
            </Button>
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg?height=32&width=32" />
                <AvatarFallback>KA</AvatarFallback>
              </Avatar>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-gray-900">Kwame Asante</p>
                <p className="text-xs text-gray-500">Software Engineer</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen hidden md:block">
          <div className="p-4">
            <NavigationItems />
            <div className="absolute bottom-4 left-4 right-4">
              <div className="border-t border-gray-200 pt-4">
                <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-3 md:p-6 max-w-full overflow-x-hidden">{children}</main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
        <div className="flex items-center justify-around py-2">
          <a href="/self-service" className="flex flex-col items-center p-2 text-emerald-600">
            <Home className="w-5 h-5" />
            <span className="text-xs mt-1">Home</span>
          </a>
          <a href="/self-service/payslips" className="flex flex-col items-center p-2 text-gray-600">
            <FileText className="w-5 h-5" />
            <span className="text-xs mt-1">Payslips</span>
          </a>
          <a href="/self-service/leave" className="flex flex-col items-center p-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span className="text-xs mt-1">Leave</span>
          </a>
          <a href="/self-service/profile" className="flex flex-col items-center p-2 text-gray-600">
            <User className="w-5 h-5" />
            <span className="text-xs mt-1">Profile</span>
          </a>
        </div>
      </div>

      {/* Mobile Content Padding */}
      <div className="md:hidden h-16"></div>
    </div>
  )
}
