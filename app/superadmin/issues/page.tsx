'use client'

import { useState, useEffect } from 'react'
import { Plus, AlertCircle, Clock, CheckCircle2, CircleDot, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Issue {
  id: string; tenant_id: string | null; title: string; description: string
  priority: 'low' | 'medium' | 'high' | 'critical'; status: 'open' | 'in_progress' | 'resolved' | 'closed'
  issue_type: string; created_at: string; resolved_at: string | null
}

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-100 text-red-700', high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700', low: 'bg-slate-100 text-slate-600',
}
const STATUS_ICON: Record<string, JSX.Element> = {
  open: <AlertCircle className="w-4 h-4 text-red-500" />,
  in_progress: <Clock className="w-4 h-4 text-blue-500" />,
  resolved: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
  closed: <CircleDot className="w-4 h-4 text-slate-400" />,
}

const BLANK = { title: '', description: '', priority: 'medium', issue_type: 'bug' }

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected] = useState<Issue | null>(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/issues')
      const d = res.ok ? await res.json() : {}
      setIssues(d.issues || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await fetch('/api/superadmin/issues', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setForm(BLANK); setShowCreate(false); load()
    } finally { setSaving(false) }
  }

  const handleUpdate = async (id: string, changes: Partial<Issue>) => {
    await fetch(`/api/superadmin/issues/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changes),
    })
    load()
    if (selected?.id === id) setSelected(null)
  }

  const visible = issues.filter(i =>
    (filterStatus === 'all' || i.status === filterStatus) &&
    (filterPriority === 'all' || i.priority === filterPriority) &&
    (!search || i.title.toLowerCase().includes(search.toLowerCase()))
  )

  const counts = { total: issues.length, open: issues.filter(i => i.status === 'open').length, in_progress: issues.filter(i => i.status === 'in_progress').length, resolved: issues.filter(i => i.status === 'resolved').length }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Support Issues</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform support tickets and issues.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> New Issue
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, cls: 'text-slate-900' },
          { label: 'Open', value: counts.open, cls: 'text-red-600' },
          { label: 'In Progress', value: counts.in_progress, cls: 'text-blue-600' },
          { label: 'Resolved', value: counts.resolved, cls: 'text-emerald-600' },
        ].map(({ label, value, cls }) => (
          <Card key={label}><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls}`}>{loading ? '—' : value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="pl-9 h-9" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="h-9 px-3 border border-input rounded-md text-sm bg-background">
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
          className="h-9 px-3 border border-input rounded-md text-sm bg-background">
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader><CardTitle className="text-lg">Create Issue</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Issue title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              <textarea placeholder="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              <div className="grid grid-cols-2 gap-3">
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="h-9 px-3 border border-input rounded-md text-sm bg-background">
                  <option value="low">Low</option><option value="medium">Medium</option>
                  <option value="high">High</option><option value="critical">Critical</option>
                </select>
                <select value={form.issue_type} onChange={e => setForm({ ...form, issue_type: e.target.value })}
                  className="h-9 px-3 border border-input rounded-md text-sm bg-background">
                  <option value="bug">Bug</option><option value="feature_request">Feature Request</option>
                  <option value="billing">Billing</option><option value="technical_support">Tech Support</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setForm(BLANK) }}>Cancel</Button>
                <Button className="flex-1" disabled={saving} onClick={handleCreate}>{saving ? 'Creating...' : 'Create'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issue detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-base">{selected.title}</CardTitle>
              <p className="text-xs text-muted-foreground">{selected.issue_type} · {new Date(selected.created_at).toLocaleDateString('en-GB')}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected.description && <p className="text-sm text-slate-600">{selected.description}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                  <select defaultValue={selected.status} onChange={e => handleUpdate(selected.id, { status: e.target.value as Issue['status'] })}
                    className="mt-1 w-full h-9 px-3 border border-input rounded-md text-sm bg-background">
                    <option value="open">Open</option><option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option><option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Priority</label>
                  <select defaultValue={selected.priority} onChange={e => handleUpdate(selected.id, { priority: e.target.value as Issue['priority'] })}
                    className="mt-1 w-full h-9 px-3 border border-input rounded-md text-sm bg-background">
                    <option value="low">Low</option><option value="medium">Medium</option>
                    <option value="high">High</option><option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-2" onClick={() => setSelected(null)}>Close</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues list */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading issues...</div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No issues found.</div>
          ) : (
            <div className="divide-y divide-border">
              {visible.map(issue => (
                <div key={issue.id} onClick={() => setSelected(issue)}
                  className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors">
                  <div className="mt-0.5 shrink-0">{STATUS_ICON[issue.status] ?? STATUS_ICON.open}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{issue.issue_type} · {new Date(issue.created_at).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[issue.priority]}`}>{issue.priority}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600 capitalize">{issue.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
