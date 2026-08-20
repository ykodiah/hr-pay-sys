import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://akwaabahr.com"),
  title: {
    default: "AkwaabaHRPay | HR & Payroll Software for Ghana",
    template: "%s",
  },
  description:
    "Connected HR and payroll software for Ghanaian businesses. Manage PAYE, SSNIT, employees, leave, attendance, recruitment, performance and analytics.",
  applicationName: "AkwaabaHRPay",
  authors: [{ name: "AkwaabaHRPay" }],
  creator: "AkwaabaHRPay",
  publisher: "AkwaabaHRPay",
  category: "Business software",
  keywords: [
    "HR software Ghana",
    "payroll software Ghana",
    "human resource management system",
    "PAYE Ghana",
    "SSNIT payroll",
    "employee management software",
    "leave management system",
    "workforce analytics Ghana",
  ],
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    locale: "en_GH",
    siteName: "AkwaabaHRPay",
    title: "AkwaabaHRPay | HR & Payroll Software for Ghana",
    description: "One connected platform for Ghana payroll, people operations, employee self-service and workforce insights.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AkwaabaHRPay | HR & Payroll Software for Ghana",
    description: "One connected platform for Ghana payroll, people operations and workforce insights.",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
