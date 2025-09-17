import type React from "react"
import type { Metadata } from "next"
import { Work_Sans, Open_Sans } from "next/font/google"
import "./globals.css"

const workSans = Work_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-work-sans",
})

const openSans = Open_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-open-sans",
})

export const metadata: Metadata = {
  title: "AkwaabaHRPay - HR & Payroll Management for Ghana",
  description:
    "Comprehensive HR & Payroll SaaS platform designed specifically for Ghanaian businesses. Streamline workforce management with local expertise.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${openSans.style.fontFamily};
  --font-sans: ${openSans.variable};
  --font-serif: ${workSans.variable};
}
        `}</style>
      </head>
      <body className={`${workSans.variable} ${openSans.variable} antialiased`}>{children}</body>
    </html>
  )
}
