'use client'

import { useState } from 'react'
import { Settings, Shield, Bell, Database, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const SETTINGS_SECTIONS = [
  {
    id: 'platform', icon: Globe, label: 'Platform', items: [
      { key: 'platform_name', label: 'Platform Name', value: 'AkwaabaHRPay', desc: 'Displayed in branding and emails' },
      { key: 'support_email', label: 'Support Email', value: 'support@akwaabahrpay.com', desc: 'Default support contact' },
      { key: 'max_tenants', label: 'Max Tenants', value: '1000', desc: 'Platform-wide tenant cap' },
    ],
  },
  {
    id: 'billing', icon: Database, label: 'Billing', items: [
      { key: 'default_payment_term_days', label: 'Payment Term (days)', value: '30', desc: 'Default invoice payment window' },
      { key: 'trial_period_days', label: 'Trial Period (days)', value: '14', desc: 'Free trial duration for new tenants' },
    ],
  },
  {
    id: 'backups', icon: Shield, label: 'Backups & Retention', items: [
      { key: 'backup_retention_days', label: 'Retention (days)', value: '90', desc: 'How long to keep backup files' },
      { key: 'auto_backup_enabled', label: 'Auto Backup', value: 'true', desc: 'Enable scheduled daily backups' },
    ],
  },
  {
    id: 'notifications', icon: Bell, label: 'Notifications', items: [
      { key: 'maintenance_mode', label: 'Maintenance Mode', value: 'false', desc: 'Block access while in maintenance' },
      { key: 'alert_email', label: 'Alert Email', value: 'alerts@akwaabahrpay.com', desc: 'Receive system alerts here' },
    ],
  },
]

type SettingsMap = Record<string, string>

function buildDefaults(): SettingsMap {
  const m: SettingsMap = {}
  SETTINGS_SECTIONS.forEach(s => s.items.forEach(i => { m[i.key] = i.value }))
  return m
}

export default function SettingsPage() {
  const [values, setValues] = useState<SettingsMap>(buildDefaults)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saved, setSaved] = useState<string | null>(null)

  const startEdit = (key: string) => { setEditing(key); setDraft(values[key] ?? '') }

  const commitEdit = (key: string) => {
    setValues(v => ({ ...v, [key]: draft }))
    setEditing(null)
    setSaved(key)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage platform configuration and preferences.</p>
      </div>

      {SETTINGS_SECTIONS.map(({ id, icon: Icon, label, items }) => (
        <Card key={id}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Icon className="w-4 h-4 text-muted-foreground" /> {label}
            </CardTitle>
            <CardDescription className="text-xs">Configure {label.toLowerCase()} settings</CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {items.map(item => (
              <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-medium text-slate-800">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
                {editing === item.key ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <Input value={draft} onChange={e => setDraft(e.target.value)} className="h-8 w-40 text-sm"
                      onKeyDown={e => { if (e.key === 'Enter') commitEdit(item.key); if (e.key === 'Escape') setEditing(null) }} autoFocus />
                    <Button size="sm" className="h-8 px-3" onClick={() => commitEdit(item.key)}>Save</Button>
                    <Button size="sm" variant="outline" className="h-8 px-3" onClick={() => setEditing(null)}>Cancel</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 shrink-0">
                    {saved === item.key && <span className="text-xs text-emerald-600 font-medium">Saved</span>}
                    <code className="text-sm font-mono text-slate-700 bg-slate-50 border border-border px-2 py-0.5 rounded">
                      {values[item.key]}
                    </code>
                    <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => startEdit(item.key)}>
                      Edit
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Danger zone */}
      <Card className="border-red-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-red-600 flex items-center gap-2">
            <Shield className="w-4 h-4" /> Danger Zone
          </CardTitle>
          <CardDescription className="text-xs">Irreversible platform-level actions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50">
            <div>
              <p className="text-sm font-medium text-red-800">Enable Maintenance Mode</p>
              <p className="text-xs text-red-600 mt-0.5">Blocks all tenant logins and shows a maintenance page.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setValues(v => ({ ...v, maintenance_mode: v.maintenance_mode === 'true' ? 'false' : 'true' }))}>
              {values.maintenance_mode === 'true' ? 'Disable' : 'Enable'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
