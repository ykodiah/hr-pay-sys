'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Setting {
  id: string
  key: string
  value: string
  description: string
  is_sensitive: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      // Mock settings
      setSettings([
        {
          id: '1',
          key: 'max_tenants',
          value: '1000',
          description: 'Maximum number of tenants allowed',
          is_sensitive: false,
        },
        {
          id: '2',
          key: 'default_payment_term_days',
          value: '30',
          description: 'Default payment term in days',
          is_sensitive: false,
        },
        {
          id: '3',
          key: 'backup_retention_days',
          value: '90',
          description: 'Number of days to retain backups',
          is_sensitive: false,
        },
        {
          id: '4',
          key: 'maintenance_mode',
          value: 'false',
          description: 'System maintenance mode',
          is_sensitive: false,
        },
      ])
    } catch (err) {
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (key: string) => {
    try {
      setSaving(true)
      setError('')
      // Mock save
      setSettings(settings.map((s) => (s.key === key ? { ...s, value: editValue } : s)))
      setSuccess(`${key} updated successfully`)
      setEditingKey(null)
      setEditValue('')
    } catch (err) {
      setError('Failed to save setting')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage system configuration and preferences</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">{success}</div>}

      {loading ? (
        <div className="text-center py-8">Loading settings...</div>
      ) : (
        <div className="space-y-4">
          {settings.map((setting) => (
            <div key={setting.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{setting.key}</h3>
                  <p className="text-gray-600 text-sm mt-1">{setting.description}</p>
                </div>
                {setting.is_sensitive && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                    Sensitive
                  </span>
                )}
              </div>

              {editingKey === setting.key ? (
                <div className="flex gap-3">
                  <input
                    type={setting.is_sensitive ? 'password' : 'text'}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <Button
                    onClick={() => handleSave(setting.key)}
                    disabled={saving}
                    className="bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Save
                  </Button>
                  <Button onClick={() => setEditingKey(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="font-mono text-gray-900">
                    {setting.is_sensitive ? '••••••••' : setting.value}
                  </div>
                  <Button
                    onClick={() => {
                      setEditingKey(setting.key)
                      setEditValue(setting.value)
                    }}
                    variant="outline"
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
