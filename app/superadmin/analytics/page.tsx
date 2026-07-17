'use client'

import { useState, useEffect } from 'react'
import { Building2, Users, CreditCard, TrendingUp, BarChart3, PieChart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface Tenant { id: string; status: string; plan: string; created_at: string }

const PLANS = ['enterprise', 'pro', 'basic'] as const
const PLAN_COLORS: Record<string, string> = { enterprise: 'bg-violet-500', pro: 'bg-blue-500', basic: 'bg-emerald-500' }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function AnalyticsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/superadmin/tenants')
      .then(r => r.json())
      .then(d => setTenants(d.tenants || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const active = tenants.filter(t => t.status === 'active').length
  const total = tenants.length

  const planCounts = PLANS.map(p => ({
    plan: p,
    count: tenants.filter(t => t.plan === p).length,
    pct: total ? Math.round((tenants.filter(t => t.plan === p).length / total) * 100) : 0,
  }))

  // Monthly growth: group by month of created_at
  const now = new Date()
  const monthlyGrowth = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return {
      label: MONTHS[d.getMonth()],
      count: tenants.filter(t => {
        const c = new Date(t.created_at)
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth()
      }).length,
    }
  })
  const maxGrowth = Math.max(...monthlyGrowth.map(m => m.count), 1)

  const mrr = active * 850

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">Platform usage and growth metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tenants', value: total, sub: 'all time', icon: Building2, c: 'bg-slate-700' },
          { label: 'Active Tenants', value: active, sub: `${total ? Math.round(active/total*100) : 0}% active rate`, icon: TrendingUp, c: 'bg-emerald-600' },
          { label: 'Est. MRR', value: `GHS ${(mrr/1000).toFixed(1)}k`, sub: 'monthly recurring', icon: CreditCard, c: 'bg-blue-600' },
          { label: 'Growth (30d)', value: `+${monthlyGrowth[monthlyGrowth.length-1].count}`, sub: 'new this month', icon: BarChart3, c: 'bg-violet-600' },
        ].map(({ label, value, sub, icon: Icon, c }) => (
          <Card key={label}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold mt-1">{loading ? '—' : value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
                <div className={`p-2.5 rounded-lg ${c}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly growth bar chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" /> Tenant Growth (12 months)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-40 animate-pulse bg-slate-100 rounded-lg" />
            ) : (
              <div className="flex items-end gap-1.5 h-40">
                {monthlyGrowth.map(({ label, count }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-emerald-500 rounded-t-sm transition-all"
                      style={{ height: `${(count / maxGrowth) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4 text-muted-foreground" /> Plan Distribution
            </CardTitle>
            <CardDescription className="text-xs">Across all tenants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="h-24 animate-pulse bg-slate-100 rounded-lg" />
            ) : total === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tenants yet</p>
            ) : (
              planCounts.map(({ plan, count, pct }) => (
                <div key={plan}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium capitalize">{plan}</span>
                    <span className="text-muted-foreground">{count} ({pct}%)</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full">
                    <div className={`h-1.5 rounded-full ${PLAN_COLORS[plan]}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            {(['active', 'suspended', 'trial'] as const).map(s => {
              const n = tenants.filter(t => t.status === s).length
              return (
                <div key={s} className="p-4 bg-slate-50 rounded-lg border border-border">
                  <p className="text-2xl font-bold">{loading ? '—' : n}</p>
                  <p className="text-sm text-muted-foreground capitalize mt-1">{s}</p>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
