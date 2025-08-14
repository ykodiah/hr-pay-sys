import type React from "react"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "./sidebar"
import { Header } from "./header"
import { Breadcrumb } from "./breadcrumb"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar userRoles={user.roles} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            <Breadcrumb />
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
