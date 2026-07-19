'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Building2, Users, CreditCard, Zap, ArrowRight, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DashboardStats {
  activeTenants: number
  totalRevenue: number
  totalUsers: number
  pendingIssues: number
  activeFlags: number
}

interface RecentTenant {
  id: string
  name: string
  plan: string
  status: string
  created_at: string
}

function planBadge(p: string) {
  if (p === 'enterprise') return 'bg-purple-100 text-purple-700'
  if (p === 'pro') return 'bg-blue-100 text-blue-700'
  return 'bg-slate-100 text-slate-600'
}

function statusBadge(s: string) {
  if (s === 'active') return 'bg-emerald-100 text-emerald-700'
  if (s === 'suspended') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-600'
}

export default function SuperadminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    activeTenants: 0, totalRevenue: 0, totalUsers: 0, pendingIssues: 0, activeFlags: 0,
  })
  const [recent, setRecent] = useState<RecentTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const [verifyRes, tenantsRes, usersRes, flagsRes] = await Promise.all([
          fetch('/api/superadmin/auth/verify', { cache: 'no-store' }),
          fetch('/api/superadmin/tenants'),
          fetch('/api/superadmin/users'),
          fetch('/api/superadmin/feature-flags'),
        ])
        const [verifyData, tenantsData, usersData, flagsData] = await Promise.all([
          verifyRes.json(),
          tenantsRes.ok ? tenantsRes.json() : { tenants: [] },
          usersRes.ok ? usersRes.json() : { users: [] },
          flagsRes.ok ? flagsRes.json() : { flags: [] },
        ])
        if (verifyData.user) setUser(verifyData.user)
        const tenants: RecentTenant[] = tenantsData.tenants || []
        setStats({
          activeTenants: tenants.filter((t) => t.status === 'active').length,
          totalRevenue: tenants.filter((t) => t.status === 'active').length * 850,
          totalUsers: (usersData.users || []).length,
          pendingIssues: 0,
          activeFlags: (flagsData.flags || []).filter((f: any) => f.enabled).length,
        })
        setRecent(tenants.slice(0, 6))
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const timeOfDay = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const STAT_CARDS = [
    { title: 'Active Tenants', value: stats.activeTenants, sub: 'organisations', icon: Building2, color: 'bg-emerald-500' },
    { title: 'Est. MRR', value: `GHS ${(stats.totalRevenue / 1000).toFixed(1)}k`, sub: 'monthly revenue', icon: CreditCard, color: 'bg-blue-500' },
    { title: 'Admin Users', value: stats.totalUsers, sub: 'portal admins', icon: Users, color: 'bg-violet-500' },
    { title: 'Active Flags', value: stats.activeFlags, sub: 'feature flags on', icon: Zap, color: 'bg-amber-500' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {timeOfDay()}{user ? `, ${user.firstName || user.email?.split('@')[0]}` : ''}.
          </h1>
          <p className="text-slate-500 mt-1 text-sm">Here&apos;s what&apos;s happening across the platform.</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-xs font-medium text-emerald-700">All systems operational</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}><CardContent className="h-24 animate-pulse bg-slate-100 rounded-lg mt-4" /></Card>
            ))
          : STAT_CARDS.map(({ title, value, sub, icon: Icon, color }) => (
              <Card key={title}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{title}</p>
                      <p className="text-2xl font-bold mt-1">{value}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">{sub}</p>
                    </div>
                    <div className={`p-2.5 rounded-lg ${color}`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Recent tenants + Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Recent Tenants</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/superadmin/tenants" className="flex items-center gap-1 text-xs text-muted-foreground">
                  View all <ArrowRight className="w-3 h-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Loading...</div>
            ) : recent.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No tenants yet.</div>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((t) => (
                  <Link
                    key={t.id}
                    href={`/superadmin/tenants/${t.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-semibold text-slate-600 text-xs">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${planBadge(t.plan)}`}>{t.plan}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(t.status)}`}>{t.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {[
              { href: '/superadmin/tenants', label: 'Create / manage tenants', icon: Building2, color: 'text-emerald-600 bg-emerald-50' },
              { href: '/superadmin/users', label: 'Add portal admin', icon: Users, color: 'text-blue-600 bg-blue-50' },
              { href: '/superadmin/settings', label: 'Change password / settings', icon: Activity, color: 'text-slate-600 bg-slate-50' },
              { href: '/superadmin/feature-flags', label: 'Manage feature flags', icon: Zap, color: 'text-amber-600 bg-amber-50' },
              { href: '/superadmin/billing', label: 'View billing', icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
            ].map(({ href, label, icon: Icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
              >
                <div className={`p-1.5 rounded-md ${color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-sm text-slate-700 group-hover:text-slate-900 flex-1">{label}</span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
