import type React from "react"

export default function ReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="space-y-6">{children}</div>
}
