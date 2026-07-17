'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, ExternalLink, Zap } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INTEGRATIONS = [
  { id: 'stripe', name: 'Stripe', desc: 'Global payment processing', category: 'Payments', fields: ['api_key', 'secret_key'] },
  { id: 'paystack', name: 'Paystack', desc: 'African payment processing', category: 'Payments', fields: ['public_key', 'secret_key'] },
  { id: 'sendgrid', name: 'SendGrid', desc: 'Email delivery service', category: 'Email', fields: ['api_key'] },
  { id: 'mailgun', name: 'Mailgun', desc: 'Transactional email', category: 'Email', fields: ['api_key', 'domain'] },
  { id: 'twilio', name: 'Twilio', desc: 'Global SMS messaging', category: 'SMS', fields: ['account_sid', 'auth_token'] },
  { id: 'arkesel', name: 'Arkesel', desc: 'SMS for Ghana & West Africa', category: 'SMS', fields: ['api_key'] },
  { id: 'slack', name: 'Slack', desc: 'Team notifications & alerts', category: 'Notifications', fields: ['webhook_url'] },
  { id: 'sentry', name: 'Sentry', desc: 'Error tracking & monitoring', category: 'Monitoring', fields: ['dsn'] },
]

const CATEGORIES = [...new Set(INTEGRATIONS.map(i => i.category))]

type ConfiguredMap = Record<string, boolean>
type FormState = { api_key?: string; secret_key?: string; public_key?: string; domain?: string; account_sid?: string; auth_token?: string; webhook_url?: string; dsn?: string }

export default function IntegrationsPage() {
  const [configured, setConfigured] = useState<ConfiguredMap>({ stripe: true, sendgrid: true })
  const [selected, setSelected] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>({})
  const [saving, setSaving] = useState(false)
  const [savedMsg, setSavedMsg] = useState<string | null>(null)

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 600)) // mock save
    setConfigured(c => ({ ...c, [selected]: true }))
    setSavedMsg(selected)
    setSelected(null); setForm({})
    setSaving(false)
    setTimeout(() => setSavedMsg(null), 3000)
  }

  const handleDisconnect = (id: string) => setConfigured(c => ({ ...c, [id]: false }))

  const selectedInt = INTEGRATIONS.find(i => i.id === selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Integrations</h1>
        <p className="text-sm text-slate-500 mt-1">Connect third-party services and APIs to the platform.</p>
      </div>

      {savedMsg && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{INTEGRATIONS.find(i => i.id === savedMsg)?.name} configured successfully.</span>
        </div>
      )}

      {/* Configure modal */}
      {selected && selectedInt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="text-base">Configure {selectedInt.name}</CardTitle>
              <CardDescription className="text-xs">{selectedInt.desc}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedInt.fields.map(field => (
                <div key={field}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <Input type="password" placeholder={`Enter your ${field.replace(/_/g, ' ')}`}
                    value={form[field as keyof FormState] ?? ''}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    className="h-9 text-sm" />
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => { setSelected(null); setForm({}) }}>Cancel</Button>
                <Button className="flex-1" disabled={saving} onClick={handleSave}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Integrations by category */}
      {CATEGORIES.map(category => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">{category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INTEGRATIONS.filter(i => i.category === category).map(integration => {
              const isActive = configured[integration.id]
              return (
                <Card key={integration.id} className={isActive ? 'border-emerald-200' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{integration.name}</p>
                          <p className="text-xs text-muted-foreground">{integration.desc}</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {isActive ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {isActive ? (
                        <>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs gap-1.5">
                            <ExternalLink className="w-3 h-3" /> Test
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDisconnect(integration.id)}>
                            Disconnect
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="w-full h-8 text-xs" onClick={() => setSelected(integration.id)}>
                          Configure
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
