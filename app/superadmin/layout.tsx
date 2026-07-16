'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SuperAdminNavbar } from '@/components/superadmin/navbar'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/superadmin/login') {
      return
    }

    // Check if user is authenticated
    const checkAuth = async () => {
      const res = await fetch('/api/superadmin/auth/verify')
      if (!res.ok) {
        router.push('/superadmin/login')
      }
    }
    checkAuth()
  }, [router, pathname])

  // Don't show navbar on login page
  const isLoginPage = pathname === '/superadmin/login'

  return (
    <div>
      {!isLoginPage && <SuperAdminNavbar />}
      <div className={isLoginPage ? '' : 'min-h-screen bg-gray-50'}>
        <div className={isLoginPage ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
          {children}
        </div>
      </div>
    </div>
  )
}
