import type React from "react"
import { Toaster } from "@/components/ui/toaster"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
      <Toaster />
    </div>
  )
}
