'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface Invoice {
  id: string
  tenant_id: string
  invoice_number: string
  total_amount: number
  payment_status: string
  billing_period_start: string
  billing_period_end: string
  created_at: string
}

const PAY_STYLE: Record<string, string> = {
  paid:    'bg-emerald-100 text-emerald-700',
  pending: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
  void:    'bg-slate-100 text-slate-500',
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Billing invoices are currently seeded statically
    // until a full billing API is implemented.
    const mock: Invoice[] = [
      { id: '1', tenant_id: 'Acme Corp', invoice_number: 'INV-2026-001', total_amount: 1500, payment_status: 'paid', billing_period_start: '2026-07-01', billing_period_end: '2026-07-31', created_at: '2026-07-01' },
      { id: '2', tenant_id: 'Zenith Ltd', invoice_number: 'INV-2026-002', total_amount: 850, payment_status: 'pending', billing_period_start: '2026-07-01', billing_period_end: '2026-07-31', created_at: '2026-07-01' },
      { id: '3', tenant_id: 'Momentum HR', invoice_number: 'INV-2026-003', total_amount: 2400, payment_status: 'overdue', billing_period_start: '2026-06-01', billing_period_end: '2026-06-30', created_at: '2026-06-01' },
    ]
    setInvoices(mock)
    setLoading(false)
  }, [])

  const totalRevenue = invoices.filter((i) => i.payment_status === 'paid').reduce((s, i) => s + i.total_amount, 0)
  const pending = invoices.filter((i) => i.payment_status === 'pending')
  const overdue = invoices.filter((i) => i.payment_status === 'overdue')

  const handleExport = () => {
    const csv = [
      ['Invoice', 'Tenant', 'Amount', 'Status', 'Period'].join(','),
      ...invoices.map((i) =>
        [i.invoice_number, i.tenant_id, i.total_amount, i.payment_status, `${i.billing_period_start} – ${i.billing_period_end}`]
          .map((v) => `"${v}"`).join(',')
      ),
    ].join('\n')
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })),
      download: `invoices-${new Date().toISOString().split('T')[0]}.csv`,
    })
    document.body.appendChild(a); a.click(); a.remove()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
          <p className="text-slate-500 mt-1 text-sm">Revenue tracking and invoice management.</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-1.5" /> Export CSV
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Collected Revenue', value: `GHS ${totalRevenue.toLocaleString()}`, sub: 'paid invoices', color: 'text-emerald-600' },
          { label: 'Pending', value: pending.length, sub: `GHS ${pending.reduce((s, i) => s + i.total_amount, 0).toLocaleString()} outstanding`, color: 'text-amber-600' },
          { label: 'Overdue', value: overdue.length, sub: `GHS ${overdue.reduce((s, i) => s + i.total_amount, 0).toLocaleString()} overdue`, color: 'text-red-600' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invoices table */}
      <Card>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">Loading invoices...</div>
          ) : invoices.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-slate-50/60">
                  {['Invoice #', 'Tenant', 'Amount', 'Billing Period', 'Status'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-700 text-xs">{inv.invoice_number}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-900">{inv.tenant_id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">GHS {inv.total_amount.toLocaleString()}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">
                      {new Date(inv.billing_period_start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {' – '}
                      {new Date(inv.billing_period_end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PAY_STYLE[inv.payment_status] || 'bg-slate-100 text-slate-500'}`}>
                        {inv.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  )
}
