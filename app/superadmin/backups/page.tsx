'use client'

import { useState, useEffect } from 'react'
import { HardDrive, Plus, Download, Trash2, RefreshCw, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Backup {
  id: string; tenant_id: string | null; backup_type: 'full' | 'incremental' | 'tenant_export'
  backup_size_mb: number; status: 'in_progress' | 'completed' | 'failed'
  s3_path: string | null; created_at: string; retention_until: string
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-700',
  in_progress: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
}
const STATUS_ICON: Record<string, JSX.Element> = {
  completed: <CheckCircle2 className="w-3.5 h-3.5" />,
  in_progress: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  failed: <AlertCircle className="w-3.5 h-3.5" />,
}
const TYPE_LABELS: Record<string, string> = { full: 'Full Backup', incremental: 'Incremental', tenant_export: 'Tenant Export' }

export default function BackupsPage() {
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [backupType, setBackupType] = useState<Backup['backup_type']>('full')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/superadmin/backups')
      const d = r.ok ? await r.json() : {}
      setBackups(d.backups || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await fetch('/api/superadmin/backups', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backup_type: backupType }),
      })
      setShowCreate(false); load()
    } finally { setCreating(false) }
  }

  const totalMB = backups.reduce((s, b) => s + (b.backup_size_mb || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data Backups</h1>
          <p className="text-sm text-slate-500 mt-1">Manage system backups and recovery operations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreate(true)} className="gap-2">
            <Plus className="w-4 h-4" /> New Backup
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Backups', value: backups.length },
          { label: 'Completed', value: backups.filter(b => b.status === 'completed').length, cls: 'text-emerald-600' },
          { label: 'In Progress', value: backups.filter(b => b.status === 'in_progress').length, cls: 'text-blue-600' },
          { label: 'Total Size', value: `${(totalMB / 1024).toFixed(2)} GB` },
        ].map(({ label, value, cls }) => (
          <Card key={label}><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls ?? 'text-slate-900'}`}>{loading ? '—' : value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Create backup modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><HardDrive className="w-5 h-5" /> New Backup</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 mb-2 block">Backup Type</label>
                <select value={backupType} onChange={e => setBackupType(e.target.value as Backup['backup_type'])}
                  className="w-full h-9 px-3 border border-input rounded-md text-sm bg-background">
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental Backup</option>
                  <option value="tenant_export">Tenant Export</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {backupType === 'full' && 'Complete snapshot of all platform data and configuration.'}
                  {backupType === 'incremental' && 'Only changes since the last full backup.'}
                  {backupType === 'tenant_export' && 'Isolated export of a single tenant\'s data.'}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button className="flex-1" disabled={creating} onClick={handleCreate}>
                  {creating ? <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Creating...</> : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Type</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Size</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Created</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Retain Until</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading backups...</td></tr>
                ) : backups.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No backups found. Create one to get started.</td></tr>
                ) : backups.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium">{TYPE_LABELS[b.backup_type] ?? b.backup_type}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.backup_size_mb ? `${b.backup_size_mb.toFixed(1)} MB` : '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[b.status]}`}>
                        {STATUS_ICON[b.status]} {b.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{new Date(b.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{b.retention_until ? new Date(b.retention_until).toLocaleDateString('en-GB') : '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        {b.status === 'completed' && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
