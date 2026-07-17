'use client'

import { useState, useEffect } from 'react'
import { ScrollText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface AuditLog {
  id: string
  superadmin_user_id: string
  action: string
  resource_type: string
  resource_id: string
  tenant_id: string
  changes: any
  ip_address: string
  user_agent: string
  created_at: string
}

const ACTION_COLOR: Record<string, string> = {
  tenant_created:  'bg-emerald-100 text-emerald-700',
  tenant_updated:  'bg-blue-100 text-blue-700',
  tenant_deleted:  'bg-red-100 text-red-700',
  user_created:    'bg-violet-100 text-violet-700',
  user_updated:    'bg-amber-100 text-amber-700',
  backup_created:  'bg-slate-100 text-slate-600',
  admin_user_created: 'bg-violet-100 text-violet-700',
  feature_flag_created: 'bg-amber-100 text-amber-700',
}

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ action: '', resourceType: '' })

  useEffect(() => { fetchLogs() }, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ limit: '200' })
      if (filters.action) params.append('action', filters.action)
      if (filters.resourceType) params.append('resourceType', filters.resourceType)
      const res = await fetch(`/api/superadmin/audit?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setLogs(data.logs || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'Resource ID', 'IP Address'].join(','),
      ...logs.map((l) =>
        [l.created_at, l.action, l.resource_type, l.resource_id || '', l.ip_address].map((v) => `"${v}"`).join(',')
      ),
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `audit-${new Date().toISOString().split('T')[0]}.csv`,
    })
    document.body.appendChild(a); a.click(); a.remove()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-slate-500 mt-1 text-sm">Every superadmin action logged for accountability.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Actions</option>
          <option value="tenant">Tenant</option>
          <option value="user">User</option>
          <option value="backup">Backup</option>
          <option value="feature_flag">Feature Flag</option>
        </select>
        <select
          value={filters.resourceType}
          onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
          className="px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">All Resources</option>
          <option value="tenant">Tenant</option>
          <option value="admin_user">Admin User</option>
          <option value="backup">Backup</option>
          <option value="feature_flag">Feature Flag</option>
        </select>
        <span className="ml-auto text-sm text-muted-foreground self-center">
          {logs.length} record{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading audit logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <ScrollText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No audit logs found.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  {['Timestamp', 'Action', 'Resource', 'Resource ID', 'IP Address'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {new Date(log.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLOR[log.action] || 'bg-slate-100 text-slate-600'}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-600 capitalize">{log.resource_type?.replace(/_/g, ' ')}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.resource_id ? log.resource_id.slice(0, 8) + '...' : '—'}</td>
                    <td className="px-5 py-3 text-slate-500 font-mono text-xs">{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
