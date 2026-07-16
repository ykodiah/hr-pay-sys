'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

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

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    pendingPayments: 0,
    paidInvoices: 0,
  })
  const [dateRange, setDateRange] = useState('month')

  useEffect(() => {
    fetchBillingData()
  }, [dateRange])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      // Mock billing data
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          tenant_id: 'tenant-1',
          invoice_number: 'INV-2026-001',
          total_amount: 500,
          payment_status: 'paid',
          billing_period_start: '2026-07-01',
          billing_period_end: '2026-07-31',
          created_at: '2026-07-01',
        },
        {
          id: '2',
          tenant_id: 'tenant-2',
          invoice_number: 'INV-2026-002',
          total_amount: 1200,
          payment_status: 'pending',
          billing_period_start: '2026-07-01',
          billing_period_end: '2026-07-31',
          created_at: '2026-07-01',
        },
      ]
      setInvoices(mockInvoices)
      setMetrics({
        totalRevenue: mockInvoices.reduce((sum, i) => sum + i.total_amount, 0),
        pendingPayments: mockInvoices.filter((i) => i.payment_status === 'pending').length,
        paidInvoices: mockInvoices.filter((i) => i.payment_status === 'paid').length,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleExportInvoices = () => {
    const csv = [
      ['Invoice Number', 'Tenant ID', 'Amount', 'Status', 'Period', 'Created'].join(','),
      ...invoices.map((inv) =>
        [
          inv.invoice_number,
          inv.tenant_id,
          inv.total_amount,
          inv.payment_status,
          `${inv.billing_period_start} to ${inv.billing_period_end}`,
          inv.created_at,
        ]
          .map((v) => `"${v}"`)
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Revenue tracking and invoicing</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <Button onClick={handleExportInvoices} className="bg-green-600 text-white hover:bg-green-700">
            Export
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {loading ? (
        <div className="text-center py-8">Loading billing data...</div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Total Revenue</div>
              <div className="text-3xl font-bold text-green-600 mt-2">
                GHS {metrics.totalRevenue.toFixed(2)}
              </div>
              <p className="text-gray-500 text-xs mt-2">All time</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Paid Invoices</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{metrics.paidInvoices}</div>
              <p className="text-gray-500 text-xs mt-2">Completed payments</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Pending Payments</div>
              <div className="text-3xl font-bold text-orange-600 mt-2">{metrics.pendingPayments}</div>
              <p className="text-gray-500 text-xs mt-2">Awaiting payment</p>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-bold text-lg">Recent Invoices</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Invoice
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">
                        {inv.invoice_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{inv.tenant_id}</td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">
                        GHS {inv.total_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(inv.billing_period_start).toLocaleDateString()} -{' '}
                        {new Date(inv.billing_period_end).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            inv.payment_status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {inv.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button variant="ghost" size="sm" className="text-blue-600">
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
