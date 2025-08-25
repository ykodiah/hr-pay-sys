import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AkwaabaHRPay - HR & Payroll for Ghana",
  description:
    "Professional HR & Payroll software built specifically for Ghanaian businesses with PAYE, SSNIT compliance and more.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-background text-foreground">{children}</body>
    </html>
  )
}
