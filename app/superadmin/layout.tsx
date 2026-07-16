import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import '../globals.css'

const geistSans = Geist({ subsets: ['latin'] })
const geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Superadmin Portal',
  description: 'Multi-tenant management system',
}

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${geistSans.className} antialiased`}>
        {children}
      </body>
    </html>
  )
}
