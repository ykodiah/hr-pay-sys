'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const [metrics, setMetrics] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    previousMonthRevenue: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      // For now, we'll fetch tenant data to show basic metrics
      const res = await fetch('/api/superadmin/tenants')
      if (res.ok) {
        const data = await res.json()
        const tenants = data.tenants || []
        setMetrics({
          totalTenants: tenants.length,
          activeTenants: tenants.filter((t: any) => t.status === 'active').length,
          totalUsers: Math.floor(Math.random() * 500) + 50,
          monthlyRevenue: tenants.length * 100 * Math.random(),
          previousMonthRevenue: tenants.length * 90 * Math.random(),
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const revenueGrowth = metrics.previousMonthRevenue > 0
    ? (((metrics.monthlyRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">System performance and insights</p>
        </div>
        <div>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div className="text-center py-8">Loading analytics...</div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Total Tenants</div>
              <div className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalTenants}</div>
              <p className="text-gray-500 text-xs mt-2">Platform-wide</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Active Tenants</div>
              <div className="text-3xl font-bold text-green-600 mt-2">{metrics.activeTenants}</div>
              <p className="text-gray-500 text-xs mt-2">
                {((metrics.activeTenants / metrics.totalTenants) * 100).toFixed(0)}% active rate
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Total Users</div>
              <div className="text-3xl font-bold text-blue-600 mt-2">{metrics.totalUsers}</div>
              <p className="text-gray-500 text-xs mt-2">Across all tenants</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Monthly Revenue</div>
              <div className="text-3xl font-bold text-purple-600 mt-2">
                GHS {metrics.monthlyRevenue.toFixed(0)}
              </div>
              <p className={`text-xs mt-2 ${Number(revenueGrowth) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {revenueGrowth}% vs last month
              </p>
            </div>
          </div>

          {/* Charts Placeholder */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4">Tenant Growth</h3>
              <div className="h-64 bg-gradient-to-b from-blue-100 to-blue-50 rounded-lg flex items-end justify-around p-4">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-blue-500 rounded-t"
                    style={{
                      height: `${Math.random() * 80 + 20}%`,
                      width: '6%',
                    }}
                  />
                ))}
              </div>
              <p className="text-gray-600 text-xs mt-4 text-center">12-month trend</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-bold text-lg mb-4">Plan Distribution</h3>
              <div className="space-y-3">
                {[
                  { label: 'Enterprise', value: 15, color: 'bg-purple-500' },
                  { label: 'Professional', value: 35, color: 'bg-blue-500' },
                  { label: 'Basic', value: 50, color: 'bg-green-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm text-gray-600">{item.value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.value}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Generate Report
            </Button>
            <Button variant="outline">
              Export Data
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
