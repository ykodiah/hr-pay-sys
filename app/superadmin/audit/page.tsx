'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

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

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: '',
    resourceType: '',
    days: 30,
  })

  useEffect(() => {
    fetchAuditLogs()
  }, [filters])

  const fetchAuditLogs = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.action) params.append('action', filters.action)
      if (filters.resourceType) params.append('resourceType', filters.resourceType)
      params.append('limit', '200')

      const res = await fetch(`/api/superadmin/audit?${params}`)
      if (!res.ok) throw new Error('Failed to fetch audit logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Action', 'Resource Type', 'User ID', 'IP Address', 'Changes'].join(','),
      ...logs.map((log) =>
        [
          log.created_at,
          log.action,
          log.resource_type,
          log.superadmin_user_id,
          log.ip_address,
          JSON.stringify(log.changes || ''),
        ]
          .map((v) => `"${v}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-gray-600 mt-1">View all superadmin actions and changes</p>
        </div>
        <Button onClick={handleExport} className="bg-green-600 text-white hover:bg-green-700">
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h3 className="font-bold">Filters</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Actions</option>
              <option value="tenant_created">Tenant Created</option>
              <option value="tenant_updated">Tenant Updated</option>
              <option value="tenant_deleted">Tenant Deleted</option>
              <option value="user_created">User Created</option>
              <option value="user_updated">User Updated</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={filters.resourceType}
              onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">All Types</option>
              <option value="tenant">Tenant</option>
              <option value="user">User</option>
              <option value="module">Module</option>
              <option value="billing">Billing</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Days</label>
            <select
              value={filters.days}
              onChange={(e) => setFilters({ ...filters, days: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No audit logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Changes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.resource_type} ({log.resource_id?.slice(0, 8)})
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 font-mono">{log.ip_address}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.changes ? JSON.stringify(log.changes).slice(0, 50) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
