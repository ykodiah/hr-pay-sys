import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign In - AkwaabaHRPay",
  description: "Sign in to your AkwaabaHRPay account",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="min-h-screen">{children}</div>
}
