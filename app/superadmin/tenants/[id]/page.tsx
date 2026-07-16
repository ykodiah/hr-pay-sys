'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface TenantDetail {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  subscription_status: string
  description: string
  created_at: string
  updated_at: string
}

interface TenantUser {
  id: string
  email: string
  first_name: string
  last_name: string
  role: string
  status: string
  created_at: string
}

interface TenantModule {
  id: string
  module_id: string
  status: string
  enabled_at: string
  superadmin_modules?: { name: string; monthly_cost: number }
}

export default function TenantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [modules, setModules] = useState<TenantModule[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', status: '', plan: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchTenantDetails()
  }, [tenantId])

  const fetchTenantDetails = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`)
      if (!res.ok) throw new Error('Failed to fetch tenant')
      const data = await res.json()
      setTenant(data.tenant)
      setUsers(data.users || [])
      setModules(data.modules || [])
      setEditForm({
        name: data.tenant.name,
        status: data.tenant.status,
        plan: data.tenant.plan,
      })
    } catch (err) {
      setError('Failed to load tenant details')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveChanges = async () => {
    try {
      setError('')
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })

      if (!res.ok) throw new Error('Failed to update tenant')
      setSuccess('Tenant updated successfully!')
      setEditing(false)
      fetchTenantDetails()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleDeleteTenant = async () => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to delete tenant')
      router.push('/superadmin/tenants')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>
  if (!tenant) return <div className="text-center py-8 text-red-600">Tenant not found</div>

  const calculatedCost = modules.reduce(
    (sum, m) => sum + ((m.superadmin_modules?.monthly_cost || 0) * 1),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link href="/superadmin/tenants" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to Tenants
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">{tenant.name}</h1>
          <p className="text-gray-600 mt-1">{tenant.slug}</p>
        </div>
        <div className="flex gap-3">
          {!editing && (
            <>
              <Button onClick={() => setEditing(true)} variant="outline">
                Edit
              </Button>
              <Button
                onClick={handleDeleteTenant}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-700">{success}</div>}

      {/* Edit Mode */}
      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-bold text-lg">Edit Tenant</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select
                value={editForm.plan}
                onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Button onClick={() => setEditing(false)} variant="outline">
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} className="bg-blue-600 text-white hover:bg-blue-700">
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        {['overview', 'users', 'modules', 'billing'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-4 font-medium text-sm capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-lg">Subscription Info</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Plan</div>
                <div className="font-semibold text-gray-900 capitalize">{tenant.plan}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <div
                  className={`font-semibold capitalize ${
                    tenant.status === 'active' ? 'text-green-600' : 'text-gray-600'
                  }`}
                >
                  {tenant.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Subscription Status</div>
                <div className="font-semibold text-gray-900 capitalize">
                  {tenant.subscription_status}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-lg">Dates</h3>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-gray-600">Created</div>
                <div className="font-semibold text-gray-900">
                  {new Date(tenant.created_at).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Last Updated</div>
                <div className="font-semibold text-gray-900">
                  {new Date(tenant.updated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-lg">Tenant Users</h3>
          </div>
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                      <td className="px-6 py-4 text-sm capitalize text-gray-900">{user.role}</td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-lg">Enabled Modules</h3>
            <p className="text-gray-600 text-sm mt-1">
              Monthly cost: GHS {calculatedCost.toFixed(2)}
            </p>
          </div>
          {modules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No modules enabled</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {modules.map((m) => (
                <div key={m.id} className="p-6 flex justify-between items-center hover:bg-gray-50">
                  <div>
                    <div className="font-semibold text-gray-900">
                      {m.superadmin_modules?.name || 'Unknown Module'}
                    </div>
                    <div className="text-sm text-gray-600">
                      Enabled: {new Date(m.enabled_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">
                      GHS {(m.superadmin_modules?.monthly_cost || 0).toFixed(2)}/mo
                    </div>
                    <span className="text-xs inline-block mt-1 px-2 py-1 bg-green-100 text-green-800 rounded">
                      {m.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Current Monthly Cost</div>
              <div className="text-4xl font-bold text-gray-900 mt-2">GHS {calculatedCost.toFixed(2)}</div>
              <p className="text-gray-600 text-sm mt-2">{modules.length} modules enabled</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="text-gray-600 text-sm font-medium">Subscription Status</div>
              <div className={`text-xl font-bold mt-2 capitalize ${
                tenant.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
              }`}>
                {tenant.subscription_status}
              </div>
              <Button className="mt-4 w-full bg-blue-600 text-white hover:bg-blue-700">
                View Billing History
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
