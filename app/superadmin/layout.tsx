'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { SuperAdminNavbar } from '@/components/superadmin/navbar'

export default function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const checking = useRef(false)

  useEffect(() => {
    if (pathname === '/superadmin/login') return
    if (checking.current) return
    checking.current = true
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/superadmin/auth/verify', { cache: 'no-store' })
        if (!res.ok) router.replace('/superadmin/login')
      } finally {
        checking.current = false
      }
    }
    checkAuth()
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  const isLoginPage = pathname === '/superadmin/login'
  if (isLoginPage) return <>{children}</>

  return (
    <div className="flex min-h-screen bg-slate-50">
      <SuperAdminNavbar />
      {/* md:pl-56 offsets content past the 224px (w-56) fixed sidebar */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 md:pl-56">
        <div className="p-6 max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
