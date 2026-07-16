'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

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
  const [createForm, setCreateForm] = useState({
    flag_key: '',
    flag_name: '',
    description: '',
    enabled: false,
    rollout_percentage: 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchFlags()
  }, [])

  const fetchFlags = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/feature-flags')
      if (!res.ok) throw new Error('Failed to fetch flags')
      const data = await res.json()
      setFlags(data.flags || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load feature flags')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const res = await fetch('/api/superadmin/feature-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create flag')
      }

      setSuccess('Feature flag created successfully!')
      setCreateForm({
        flag_key: '',
        flag_name: '',
        description: '',
        enabled: false,
        rollout_percentage: 0,
      })
      setShowCreate(false)
      fetchFlags()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create flag')
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleFlag = async (flag: FeatureFlag) => {
    // Mock toggle - in production this would be a PATCH request
    const updated = { ...flag, enabled: !flag.enabled }
    setFlags(flags.map((f) => (f.id === flag.id ? updated : f)))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-gray-600 mt-1">Control feature rollout and A/B testing</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          + Create Flag
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">
          {success}
        </div>
      )}

      {/* Create Form */}
      {showCreate && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-lg">Create New Feature Flag</h2>
          <form onSubmit={handleCreateFlag} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag Key
                </label>
                <input
                  type="text"
                  placeholder="e.g., new-payroll-engine"
                  value={createForm.flag_key}
                  onChange={(e) => setCreateForm({ ...createForm, flag_key: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Flag Name
                </label>
                <input
                  type="text"
                  placeholder="New Payroll Engine"
                  value={createForm.flag_name}
                  onChange={(e) => setCreateForm({ ...createForm, flag_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="What does this feature do?"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rollout Percentage
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={createForm.rollout_percentage}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        rollout_percentage: parseInt(e.target.value),
                      })
                    }
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-12">
                    {createForm.rollout_percentage}%
                  </span>
                </div>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={createForm.enabled}
                    onChange={(e) => setCreateForm({ ...createForm, enabled: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700">Enabled</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                onClick={() => setShowCreate(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {submitting ? 'Creating...' : 'Create Flag'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Flags Grid */}
      {loading ? (
        <div className="text-center py-8">Loading feature flags...</div>
      ) : flags.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No feature flags created yet</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flags.map((flag) => (
            <div key={flag.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{flag.flag_name}</h3>
                  <p className="text-gray-600 text-sm font-mono">{flag.flag_key}</p>
                  {flag.description && (
                    <p className="text-gray-600 text-sm mt-2">{flag.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Rollout</div>
                    <div className="text-lg font-bold text-gray-900">{flag.rollout_percentage}%</div>
                  </div>
                  <button
                    onClick={() => handleToggleFlag(flag)}
                    className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${
                      flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                        flag.enabled ? 'translate-x-9' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {flag.rollout_percentage > 0 && flag.rollout_percentage < 100 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-600 mb-2">Rollout Progress</div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{ width: `${flag.rollout_percentage}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg text-blue-900 mb-2">Feature Flags Guide</h3>
        <ul className="text-blue-800 text-sm space-y-2 list-disc list-inside">
          <li>Use flags to control feature rollout to users gradually</li>
          <li>Set rollout percentage for A/B testing and gradual rollouts</li>
          <li>Enable/disable features instantly without deployment</li>
          <li>Monitor adoption and toggle based on metrics</li>
        </ul>
      </div>
    </div>
  )
}
