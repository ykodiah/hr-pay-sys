'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface Integration {
  id: string
  integration_type: string
  status: string
  last_sync_at: string
  sync_error_message?: string
}

const AVAILABLE_INTEGRATIONS = [
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing for global customers',
    icon: '💳',
    category: 'Payment',
  },
  {
    id: 'paystack',
    name: 'Paystack',
    description: 'African payment processing',
    icon: '🏦',
    category: 'Payment',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Global SMS and messaging',
    icon: '📱',
    category: 'SMS',
  },
  {
    id: 'arkesel',
    name: 'Arkesel',
    description: 'SMS for Ghana and West Africa',
    icon: '📲',
    category: 'SMS',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'Email delivery and marketing',
    icon: '📧',
    category: 'Email',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team notifications and alerts',
    icon: '💬',
    category: 'Communication',
  },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [configForm, setConfigForm] = useState({
    api_key: '',
    api_secret: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      // Mock fetch - will integrate with real API
      setIntegrations([
        { id: '1', integration_type: 'stripe', status: 'active', last_sync_at: new Date().toISOString() },
        { id: '2', integration_type: 'sendgrid', status: 'active', last_sync_at: new Date().toISOString() },
      ])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveIntegration = async () => {
    try {
      setSaving(true)
      setError('')
      // Mock save - will integrate with real API
      setSuccess(`${selectedIntegration} configured successfully!`)
      setConfigForm({ api_key: '', api_secret: '' })
      setSelectedIntegration(null)
      fetchIntegrations()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save integration')
    } finally {
      setSaving(false)
    }
  }

  const getIntegrationConfig = (type: string) => {
    return AVAILABLE_INTEGRATIONS.find((i) => i.id === type)
  }

  const isConfigured = (type: string) => {
    return integrations.some((i) => i.integration_type === type)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Integrations</h1>
        <p className="text-gray-600 mt-1">Connect third-party services and APIs</p>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">{success}</div>}

      {/* Selected Integration Config */}
      {selectedIntegration && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-lg">
            Configure {getIntegrationConfig(selectedIntegration)?.name}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="password"
                placeholder="Enter your API key"
                value={configForm.api_key}
                onChange={(e) => setConfigForm({ ...configForm, api_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {['stripe', 'paystack'].includes(selectedIntegration) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Secret Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your secret key"
                  value={configForm.api_secret}
                  onChange={(e) => setConfigForm({ ...configForm, api_secret: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <Button onClick={() => setSelectedIntegration(null)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSaveIntegration}
                disabled={saving || !configForm.api_key}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-2 gap-6">
        {AVAILABLE_INTEGRATIONS.map((integration) => {
          const isActive = isConfigured(integration.id)
          return (
            <div
              key={integration.id}
              className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{integration.icon}</div>
                  <div>
                    <h3 className="font-bold text-lg">{integration.name}</h3>
                    <p className="text-gray-600 text-sm">{integration.description}</p>
                  </div>
                </div>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="flex gap-2">
                {isActive ? (
                  <>
                    <Button variant="outline" className="flex-1">
                      Test Connection
                    </Button>
                    <Button variant="outline" className="flex-1 text-red-600">
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => setSelectedIntegration(integration.id)}
                    className="w-full bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Configure
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Documentation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-bold text-lg text-blue-900 mb-2">Need Help?</h3>
        <p className="text-blue-800 text-sm mb-4">
          Check our documentation for detailed setup instructions for each integration.
        </p>
        <Button variant="outline" className="border-blue-300 text-blue-600">
          View Documentation
        </Button>
      </div>
    </div>
  )
}
