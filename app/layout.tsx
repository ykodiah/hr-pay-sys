import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "AkwaabaHRPay - HR & Payroll for Ghana",
  description:
    "Professional HR & Payroll software built specifically for Ghanaian businesses with PAYE, SSNIT compliance and more.",
  generator: "v0.app",
  viewport: "width=device-width, initial-scale=1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="font-sans bg-background text-foreground min-h-screen">
        <div id="root">{children}</div>
      </body>
    </html>
  )
}
