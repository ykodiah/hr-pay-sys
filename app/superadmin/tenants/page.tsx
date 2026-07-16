'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Tenant {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  subscription_status: string
  created_at: string
  updated_at: string
}

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', slug: '', description: '', plan: 'basic' })
  const [searchTerm, setSearchTerm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Fetch tenants
  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/superadmin/tenants')
      if (!res.ok) throw new Error('Failed to fetch tenants')
      const data = await res.json()
      setTenants(data.tenants || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create tenant')
      }

      setSuccess('Tenant created successfully!')
      setCreateForm({ name: '', slug: '', description: '', plan: 'basic' })
      setShowCreate(false)
      fetchTenants()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
          <p className="text-gray-600 mt-1">Manage all tenant accounts and subscriptions</p>
        </div>
        <Button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          + Create Tenant
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
          <h2 className="font-bold text-lg">Create New Tenant</h2>
          <form onSubmit={handleCreateTenant} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tenant Name
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Acme Corporation"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug
                </label>
                <Input
                  type="text"
                  placeholder="e.g., acme-corp"
                  value={createForm.slug}
                  onChange={(e) => setCreateForm({ ...createForm, slug: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                placeholder="Optional description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plan
              </label>
              <select
                value={createForm.plan}
                onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
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
                {submitting ? 'Creating...' : 'Create Tenant'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search tenants by name or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tenants...</div>
        ) : filteredTenants.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No tenants found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tenant.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{tenant.slug}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          tenant.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tenant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(tenant.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link href={`/superadmin/tenants/${tenant.id}`}>
                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                          View Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Total Tenants</div>
          <div className="text-3xl font-bold text-gray-900 mt-2">{tenants.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Active</div>
          <div className="text-3xl font-bold text-green-600 mt-2">
            {tenants.filter((t) => t.status === 'active').length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="text-gray-600 text-sm font-medium">Inactive</div>
          <div className="text-3xl font-bold text-gray-600 mt-2">
            {tenants.filter((t) => t.status !== 'active').length}
          </div>
        </div>
      </div>
    </div>
  )
}
