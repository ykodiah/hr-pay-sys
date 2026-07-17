'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  Puzzle,
  Flag,
  HardDrive,
  AlertTriangle,
  ScrollText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/superadmin/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/superadmin/tenants',      label: 'Tenants',       icon: Building2 },
  { href: '/superadmin/users',        label: 'Admin Users',   icon: Users },
  { href: '/superadmin/billing',      label: 'Billing',       icon: CreditCard },
  { href: '/superadmin/analytics',    label: 'Analytics',     icon: BarChart3 },
  { href: '/superadmin/modules',      label: 'Modules',       icon: Puzzle },
  { href: '/superadmin/feature-flags',label: 'Feature Flags', icon: Flag },
  { href: '/superadmin/backups',      label: 'Backups',       icon: HardDrive },
  { href: '/superadmin/issues',       label: 'Issues',        icon: AlertTriangle },
  { href: '/superadmin/audit',        label: 'Audit Trail',   icon: ScrollText },
  { href: '/superadmin/notifications',label: 'Notifications', icon: Bell },
  { href: '/superadmin/settings',     label: 'Settings',      icon: Settings },
]

export function SuperAdminNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/superadmin/dashboard'
      ? pathname === href
      : pathname.startsWith(href)

  const handleLogout = async () => {
    await fetch('/api/superadmin/auth/logout', { method: 'POST' })
    router.replace('/superadmin/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-slate-700/60',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-white font-semibold text-sm leading-none">AkwaabaHR</p>
            <p className="text-slate-400 text-xs mt-0.5">Superadmin Portal</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium group',
                active
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/60',
                collapsed && 'justify-center px-2'
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', active ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/60 p-2 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-red-500/20 transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'hidden md:flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-700/40 transition-all',
            collapsed && 'justify-center px-2'
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-slate-900 border-r border-slate-700/60 z-40 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900 border-b border-slate-700/60 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-emerald-500 flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">SuperAdmin</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-slate-400 hover:text-white p-1"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="md:hidden fixed left-0 top-0 h-screen w-64 bg-slate-900 z-50 border-r border-slate-700/60">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* Spacer so content is not hidden behind desktop sidebar */}
      <div className={cn('hidden md:block flex-shrink-0 transition-all duration-200', collapsed ? 'w-16' : 'w-56')} />
    </>
  )
}
