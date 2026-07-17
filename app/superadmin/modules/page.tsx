'use client'

import { useState, useEffect } from 'react'
import { Puzzle, Plus, ToggleLeft, ToggleRight, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Module {
  id: string; name: string; slug: string; description: string
  monthly_cost: number; is_active: boolean; created_at: string
}

const BLANK = { name: '', slug: '', description: '', monthly_cost: 0, is_active: true }

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/superadmin/modules')
      if (res.ok) { const d = await res.json(); setModules(d.modules || []) }
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.slug.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/superadmin/modules', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setForm(BLANK); setShowCreate(false); load() }
    } finally { setSaving(false) }
  }

  const handleToggle = async (m: Module) => {
    setModules(ms => ms.map(x => x.id === m.id ? { ...x, is_active: !x.is_active } : x))
    try {
      await fetch(`/api/superadmin/modules/${m.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !m.is_active }),
      })
    } catch {
      setModules(ms => ms.map(x => x.id === m.id ? { ...x, is_active: m.is_active } : x))
    }
  }

  const total = modules.length
  const active = modules.filter(m => m.is_active).length
  const monthlyRevPotential = modules.reduce((s, m) => s + (m.is_active ? m.monthly_cost : 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Modules</h1>
          <p className="text-sm text-slate-500 mt-1">Manage platform modules available to tenants.</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Module
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Modules', value: total },
          { label: 'Active', value: active, cls: 'text-emerald-600' },
          { label: 'Monthly Revenue Potential', value: `GHS ${monthlyRevPotential.toLocaleString()}`, cls: 'text-blue-600' },
        ].map(({ label, value, cls }) => (
          <Card key={label}><CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${cls ?? 'text-slate-900'}`}>{loading ? '—' : value}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Puzzle className="w-4 h-4" /> New Module</CardTitle>
              <CardDescription className="text-xs">Modules are available platform features billable to tenants.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Module name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
              <Input placeholder="Slug (auto-generated)" value={form.slug}
                onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, '_') })} />
              <textarea placeholder="Description" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-md text-sm h-16 resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">Monthly Cost (GHS)</label>
                <Input type="number" min="0" value={form.monthly_cost}
                  onChange={e => setForm({ ...form, monthly_cost: parseFloat(e.target.value) || 0 })} className="h-9 text-sm" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="mod-active" checked={form.is_active}
                  onChange={e => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600" />
                <label htmlFor="mod-active" className="text-sm text-slate-700">Active (available to tenants)</label>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" className="flex-1" onClick={() => { setShowCreate(false); setForm(BLANK) }}>Cancel</Button>
                <Button className="flex-1" disabled={saving} onClick={handleCreate}>{saving ? 'Creating...' : 'Create'}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modules grid */}
      {loading ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Loading modules...</div>
      ) : modules.length === 0 ? (
        <div className="text-center py-12">
          <Puzzle className="w-8 h-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No modules found.</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>Create your first module</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => (
            <Card key={m.id} className={m.is_active ? '' : 'opacity-60'}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <Puzzle className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{m.name}</p>
                      <p className="text-xs font-mono text-slate-400">{m.slug}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(m)} title={m.is_active ? 'Disable module' : 'Enable module'} className="shrink-0 ml-2">
                    {m.is_active
                      ? <ToggleRight className="w-6 h-6 text-emerald-500" />
                      : <ToggleLeft className="w-6 h-6 text-slate-300" />}
                  </button>
                </div>
                {m.description && <p className="text-xs text-slate-500 mb-3 leading-relaxed">{m.description}</p>}
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700">
                  <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
                  GHS {m.monthly_cost.toLocaleString()} / month
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
