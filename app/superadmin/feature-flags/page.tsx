'use client'

import { useState, useEffect } from 'react'
import { Flag, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FeatureFlag {
  id: string
  flag_key: string
  flag_name: string
  description: string
  enabled: boolean
  rollout_percentage: number
  created_at: string
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ flag_key: '', flag_name: '', description: '', enabled: false, rollout_percentage: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { fetchFlags() }, [])

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/feature-flags')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setFlags(data.flags || [])
    } catch {
      setError('Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError(''); setSuccess('')
      const res = await fetch('/api/superadmin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      setSuccess('Feature flag created.')
      setForm({ flag_key: '', flag_name: '', description: '', enabled: false, rollout_percentage: 0 })
      setShowCreate(false)
      fetchFlags()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggle = async (flag: FeatureFlag) => {
    // Optimistic update
    setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, enabled: !f.enabled } : f))
    try {
      await fetch(`/api/superadmin/feature-flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !flag.enabled }),
      })
    } catch {
      // revert on error
      setFlags((prev) => prev.map((f) => f.id === flag.id ? { ...f, enabled: flag.enabled } : f))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
          <p className="text-slate-500 mt-1 text-sm">Control feature rollout across all tenants.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="w-4 h-4 mr-1.5" /> New Flag
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Flags', value: flags.length },
          { label: 'Enabled', value: flags.filter((f) => f.enabled).length },
          { label: 'Disabled', value: flags.filter((f) => !f.enabled).length },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold mt-1">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}<button onClick={() => setError('')}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
          {success}<button onClick={() => setSuccess('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">New Feature Flag</CardTitle>
              <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700"><X className="w-4 h-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Flag Key</label>
                  <Input placeholder="new-payroll-engine" value={form.flag_key}
                    onChange={(e) => setForm({ ...form, flag_key: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">Flag Name</label>
                  <Input placeholder="New Payroll Engine" value={form.flag_name}
                    onChange={(e) => setForm({ ...form, flag_name: e.target.value })} required />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  placeholder="What does this flag control?"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Rollout — {form.rollout_percentage}%
                  </label>
                  <input type="range" min="0" max="100" value={form.rollout_percentage}
                    onChange={(e) => setForm({ ...form, rollout_percentage: +e.target.value })}
                    className="w-full accent-emerald-600" />
                </div>
                <div className="flex items-center gap-2 pb-0.5">
                  <input type="checkbox" id="enabled" checked={form.enabled}
                    onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                    className="w-4 h-4 rounded accent-emerald-600" />
                  <label htmlFor="enabled" className="text-sm font-medium text-slate-700">Enable immediately</label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" size="sm" disabled={submitting}>{submitting ? 'Creating...' : 'Create Flag'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Flags list */}
      {loading ? (
        <div className="py-10 text-center text-sm text-muted-foreground">Loading flags...</div>
      ) : flags.length === 0 ? (
        <div className="py-10 text-center">
          <Flag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No feature flags yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map((flag) => (
            <Card key={flag.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900">{flag.flag_name}</p>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{flag.flag_key}</span>
                    </div>
                    {flag.description && <p className="text-sm text-slate-500 mt-0.5">{flag.description}</p>}
                    {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Rollout</span>
                          <span>{flag.rollout_percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${flag.rollout_percentage}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleToggle(flag)}
                    className={`relative flex-shrink-0 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flag.enabled ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    role="switch"
                    aria-checked={flag.enabled}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${flag.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
