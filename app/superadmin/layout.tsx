'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SuperAdminNavbar } from '@/components/superadmin/navbar'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const checking = useRef(false)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === '/superadmin/login') return
    // Prevent concurrent checks
    if (checking.current) return
    checking.current = true

    const checkAuth = async () => {
      try {
        const res = await fetch('/api/superadmin/auth/verify', { cache: 'no-store' })
        if (!res.ok) {
          router.replace('/superadmin/login')
        }
      } finally {
        checking.current = false
      }
    }
    checkAuth()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

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
