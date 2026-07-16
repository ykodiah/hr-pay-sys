'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export function SuperAdminNavbar() {
  const pathname = usePathname()
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  const isActive = (path: string) => pathname.includes(path)

  const navItems = [
    { href: '/superadmin/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/superadmin/tenants', label: 'Tenants', icon: '🏢' },
    { href: '/superadmin/users', label: 'Users', icon: '👥' },
    { href: '/superadmin/billing', label: 'Billing', icon: '💰' },
    { href: '/superadmin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/superadmin/integrations', label: 'Integrations', icon: '🔗' },
    { href: '/superadmin/feature-flags', label: 'Feature Flags', icon: '🚩' },
    { href: '/superadmin/backups', label: 'Backups', icon: '💾' },
    { href: '/superadmin/issues', label: 'Issues', icon: '⚠️' },
    { href: '/superadmin/audit', label: 'Audit Trail', icon: '📋' },
    { href: '/superadmin/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/superadmin/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth/logout', { method: 'POST' })
    window.location.href = '/superadmin/login'
  }

  return (
    <nav className="bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-full px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/superadmin/dashboard" className="flex items-center gap-2 font-bold text-xl">
            <div className="bg-blue-500 rounded-lg p-2">👑</div>
            <span>SuperAdmin</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{item.icon}</span>
                <span className="text-sm">{item.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="relative p-2 text-gray-300 hover:text-white">
              <span>🔔</span>
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                2
              </span>
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              Logout
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 text-gray-300 hover:text-white"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 space-y-2 pb-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setShowMobileMenu(false)}
                className={`block px-4 py-2 rounded-lg transition ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
