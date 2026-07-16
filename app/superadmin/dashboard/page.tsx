'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  activeTenants: number
  totalRevenue: number
  totalUsers: number
  pendingIssues: number
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

export default function SuperadminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    activeTenants: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingIssues: 0,
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/superadmin/auth/verify')
        if (!response.ok) {
          router.push('/superadmin/login')
          return
        }
        const data = await response.json()
        setUser(data.user)
        loadDashboardData()
      } catch (err) {
        router.push('/superadmin/login')
      }
    }
    checkAuth()
  }, [router])

  const loadDashboardData = async () => {
    try {
      // For now, load mock data. In production, fetch from API
      setStats({
        activeTenants: 24,
        totalRevenue: 125400,
        totalUsers: 1850,
        pendingIssues: 8,
      })
    } finally {
      setLoading(false)
    }
  }

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/superadmin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4V5"
          />
        </svg>
      ),
    },
    {
      label: 'Tenants',
      href: '/superadmin/tenants',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m-1 4h1M9 7a3 3 0 013-3h1a3 3 0 013 3m0 0a3 3 0 013-3h1a3 3 0 013 3"
          />
        </svg>
      ),
    },
    {
      label: 'Users',
      href: '/superadmin/users',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 8.048M7 13H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-2m-2-6h.01M15 13H9"
          />
        </svg>
      ),
    },
    {
      label: 'Billing',
      href: '/superadmin/billing',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Analytics',
      href: '/superadmin/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      ),
    },
    {
      label: 'Issues',
      href: '/superadmin/issues',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
      ),
      badge: stats.pendingIssues,
    },
    {
      label: 'Audit Trail',
      href: '/superadmin/audit',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Backups',
      href: '/superadmin/backups',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
          />
        </svg>
      ),
    },
    {
      label: 'Settings',
      href: '/superadmin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ]

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth/logout', { method: 'POST' })
    router.push('/superadmin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/20 mb-4 animate-pulse">
            <svg className="w-6 h-6 text-blue-500 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800/50 backdrop-blur-xl border-r border-slate-700/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-white">Superadmin</h2>
              <p className="text-xs text-slate-400">Control Hub</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition group"
            >
              <span className="text-slate-400 group-hover:text-blue-400">{item.icon}</span>
              <span className="flex-1 text-sm font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-500/20 text-red-300 rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-slate-700/50 space-y-3">
          {user && (
            <div className="px-4 py-3 bg-slate-700/30 rounded-lg">
              <p className="text-xs text-slate-400 mb-1">Logged in as</p>
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-slate-800/30 backdrop-blur-xl border-b border-slate-700/50 flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { label: 'Active Tenants', value: stats.activeTenants, icon: '🏢', color: 'bg-blue-500/10 text-blue-400' },
              { label: 'Total Revenue', value: `$${(stats.totalRevenue / 1000).toFixed(1)}K`, icon: '💰', color: 'bg-green-500/10 text-green-400' },
              { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'bg-purple-500/10 text-purple-400' },
              { label: 'Pending Issues', value: stats.pendingIssues, icon: '⚠️', color: 'bg-red-500/10 text-red-400' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center text-xl`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <Link
                href="/superadmin/tenants?new=true"
                className="p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-blue-400 font-medium transition text-center"
              >
                Create Tenant
              </Link>
              <Link
                href="/superadmin/users?new=true"
                className="p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-purple-400 font-medium transition text-center"
              >
                Add User
              </Link>
              <Link
                href="/superadmin/issues"
                className="p-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 font-medium transition text-center"
              >
                View Issues
              </Link>
              <Link
                href="/superadmin/audit"
                className="p-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-lg text-indigo-400 font-medium transition text-center"
              >
                Audit Trail
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
