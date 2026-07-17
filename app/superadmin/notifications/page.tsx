'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Notification {
  id: string; title: string; message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read_at?: string; created_at: string
}

const TYPE_STYLES: Record<string, { bg: string; icon: JSX.Element }> = {
  info: { bg: 'border-l-blue-400', icon: <Info className="w-4 h-4 text-blue-500" /> },
  success: { bg: 'border-l-emerald-400', icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  warning: { bg: 'border-l-amber-400', icon: <AlertTriangle className="w-4 h-4 text-amber-500" /> },
  error: { bg: 'border-l-red-400', icon: <XCircle className="w-4 h-4 text-red-500" /> },
}

const MOCK: Notification[] = [
  { id: '1', title: 'New tenant registered', message: 'Acme Corp has completed signup and is pending verification.', type: 'info', created_at: new Date(Date.now() - 1e6).toISOString() },
  { id: '2', title: 'Payment received', message: 'Invoice INV-2026-001 for GHS 1,500 has been paid by Zenith Ltd.', type: 'success', created_at: new Date(Date.now() - 3e6).toISOString() },
  { id: '3', title: 'Backup failed', message: 'Scheduled daily backup failed at 02:00 AM. Please check storage configuration.', type: 'error', created_at: new Date(Date.now() - 8e6).toISOString() },
  { id: '4', title: 'Overdue invoice', message: 'Momentum HR has an overdue invoice of GHS 2,400 (30+ days).', type: 'warning', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '5', title: 'Feature flag enabled', message: 'advanced_payroll_module flag was enabled for all tenants by admin@akwaabahrpay.com.', type: 'info', read_at: new Date(Date.now() - 172800000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString() },
]

const FILTERS = ['all', 'unread', 'info', 'success', 'warning', 'error'] as const

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<typeof FILTERS[number]>('all')

  const unreadCount = notifications.filter(n => !n.read_at).length

  const markRead = (id: string) =>
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))

  const markAllRead = () =>
    setNotifications(ns => ns.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))

  const dismiss = (id: string) => setNotifications(ns => ns.filter(n => n.id !== id))

  const visible = notifications.filter(n => {
    if (filter === 'unread') return !n.read_at
    if (filter === 'all') return true
    return n.type === filter
  })

  const ago = (iso: string) => {
    const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (s < 60) return `${s}s ago`
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Notifications
            {unreadCount > 0 && (
              <span className="text-sm font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-1">System alerts and platform updates.</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="w-3.5 h-3.5" /> Mark all read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition capitalize',
              filter === f ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}>
            {f}
            {f === 'unread' && unreadCount > 0 && (
              <span className="ml-1.5 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Notification list */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading notifications...</div>
      ) : visible.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No notifications to show.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map(n => {
            const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info
            const isRead = !!n.read_at
            return (
              <Card key={n.id} className={cn('border-l-4 transition-opacity', style.bg, isRead && 'opacity-60')}>
                <CardContent className="flex items-start gap-3 py-3 px-4">
                  <div className="mt-0.5 shrink-0">{style.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', isRead ? 'text-slate-600' : 'text-slate-900')}>{n.title}</p>
                      <span className="text-xs text-muted-foreground shrink-0">{ago(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isRead && (
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Mark as read" onClick={() => markRead(n.id)}>
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-600" title="Dismiss" onClick={() => dismiss(n.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
