'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  Building2,
  UserPlus,
  Users,
  UserCog,
  Link2,
  Power,
  Save,
  Loader2,
} from 'lucide-react'

type Tab = 'overview' | 'admins' | 'employees' | 'assign' | 'modules'

interface TenantDetail {
  id: string
  name: string
  slug: string
  status: string
  plan: string
  subscription_status: string
  description: string
  company_id: string | null
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

interface EmployeeRow {
  id: string
  employee_id?: string
  first_name: string
  last_name: string
  corporate_email?: string
  personal_email?: string
  email?: string
  position?: string
  department?: string
  status?: string
  company_id?: string
}

interface CompanyRow {
  id: string
  name: string
  email_address?: string
  linked_tenant?: { id: string; name: string } | null
}

const TABS: { id: Tab; label: string; icon: typeof Building2 }[] = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'admins', label: 'Admins', icon: UserCog },
  { id: 'employees', label: 'Employees', icon: Users },
  { id: 'assign', label: 'Assign Tenant', icon: Link2 },
  { id: 'modules', label: 'Modules', icon: Power },
]

export default function TenantDetailPage() {
  const params = useParams()
  const tenantId = params.id as string

  const [tenant, setTenant] = useState<TenantDetail | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [employees, setEmployees] = useState<EmployeeRow[]>([])
  const [modules, setModules] = useState<any[]>([])
  const [companies, setCompanies] = useState<CompanyRow[]>([])
  const [unassigned, setUnassigned] = useState<EmployeeRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', status: '', plan: '', description: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [busy, setBusy] = useState(false)

  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin',
  })

  const [empForm, setEmpForm] = useState({
    first_name: '',
    last_name: '',
    corporate_email: '',
    position: '',
    department: '',
  })

  const [assignCompanyId, setAssignCompanyId] = useState('')
  const [selectedUnassigned, setSelectedUnassigned] = useState<Record<string, boolean>>({})

  const fetchTenantDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Failed to fetch tenant')
      const data = await res.json()
      setTenant(data.tenant)
      setUsers(data.users || [])
      setEmployees(data.employees || [])
      setModules(data.modules || [])
      setEditForm({
        name: data.tenant.name,
        status: data.tenant.status,
        plan: data.tenant.plan,
        description: data.tenant.description || '',
      })
      setAssignCompanyId(data.tenant.company_id || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant details')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    fetchTenantDetails()
  }, [fetchTenantDetails])

  useEffect(() => {
    if (activeTab !== 'assign') return
    ;(async () => {
      const [cRes, uRes] = await Promise.all([
        fetch('/api/superadmin/companies', { credentials: 'include' }),
        fetch(`/api/superadmin/tenants/${tenantId}/employees?unassigned=true`, {
          credentials: 'include',
        }),
      ])
      if (cRes.ok) {
        const d = await cRes.json()
        setCompanies(d.companies || [])
      }
      if (uRes.ok) {
        const d = await uRes.json()
        setUnassigned(d.employees || [])
      }
    })()
  }, [activeTab, tenantId])

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setError(msg)
      setSuccess('')
    } else {
      setSuccess(msg)
      setError('')
    }
  }

  const handleSaveChanges = async () => {
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(editForm),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || 'Failed to update tenant')
      }
      flash('Tenant updated successfully')
      setEditing(false)
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed to update', true)
    } finally {
      setBusy(false)
    }
  }

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this tenant? Users will lose access until reactivated.')) return
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: tenant?.status === 'active' ? 'deactivate' : 'activate' }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      flash(tenant?.status === 'active' ? 'Tenant deactivated' : 'Tenant reactivated')
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adminForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to add admin')
      flash(d.warning || 'Tenant admin created and bound to this company')
      setAdminForm({ email: '', password: '', first_name: '', last_name: '', role: 'admin' })
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const toggleAdminStatus = async (userId: string, status: string) => {
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/users`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          action: status === 'active' ? 'deactivate' : 'activate',
        }),
      })
      if (!res.ok) throw new Error('Failed to update admin')
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(empForm),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to create employee')
      flash('Employee created and assigned to this tenant')
      setEmpForm({ first_name: '', last_name: '', corporate_email: '', position: '', department: '' })
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const handleAssignCompany = async () => {
    if (!assignCompanyId) {
      flash('Select a company to assign', true)
      return
    }
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_id: assignCompanyId }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to assign company')
      flash('Company assigned to tenant')
      fetchTenantDetails()
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  const handleAssignEmployees = async () => {
    const ids = Object.entries(selectedUnassigned)
      .filter(([, v]) => v)
      .map(([k]) => k)
    if (!ids.length) {
      flash('Select at least one employee', true)
      return
    }
    try {
      setBusy(true)
      const res = await fetch(`/api/superadmin/tenants/${tenantId}/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'assign', employee_ids: ids }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Failed to assign employees')
      flash(`Assigned ${ids.length} employee(s) to this tenant`)
      setSelectedUnassigned({})
      fetchTenantDetails()
      setActiveTab('employees')
    } catch (err) {
      flash(err instanceof Error ? err.message : 'Failed', true)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading tenant...
      </div>
    )
  }
  if (!tenant) {
    return <div className="text-center py-8 text-red-600">Tenant not found</div>
  }

  const calculatedCost = modules.reduce(
    (sum, m) => sum + (m.superadmin_modules?.monthly_cost || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/superadmin/tenants"
            className="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Tenants
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-2">{tenant.name}</h1>
          <p className="text-slate-500 text-sm mt-0.5 font-mono">{tenant.slug}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                tenant.status === 'active'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {tenant.status}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-700">
              {tenant.plan}
            </span>
            {tenant.company_id && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-slate-100 text-slate-600">
                company {tenant.company_id.slice(0, 8)}…
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <>
              <Button onClick={() => setEditing(true)} variant="outline" size="sm">
                Edit
              </Button>
              <Button
                onClick={handleDeactivate}
                variant="outline"
                size="sm"
                disabled={busy}
                className={
                  tenant.status === 'active'
                    ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                    : 'text-emerald-700 border-emerald-300'
                }
              >
                {tenant.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {editing && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Edit Tenant</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Plan</label>
                <select
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveChanges} disabled={busy}>
                <Save className="w-3.5 h-3.5 mr-1.5" /> Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`inline-flex items-center gap-1.5 pb-3 px-4 text-sm font-medium whitespace-nowrap ${
              activeTab === id
                ? 'border-b-2 border-emerald-600 text-emerald-700'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Subscription</p>
              <div>
                <p className="text-sm text-slate-500">Plan</p>
                <p className="font-semibold capitalize">{tenant.plan}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <p className="font-semibold capitalize">{tenant.status}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Subscription</p>
                <p className="font-semibold capitalize">{tenant.subscription_status}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">People</p>
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 space-y-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Dates</p>
              <div>
                <p className="text-sm text-slate-500">Created</p>
                <p className="font-semibold">{new Date(tenant.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Updated</p>
                <p className="font-semibold">{new Date(tenant.updated_at).toLocaleDateString()}</p>
              </div>
              {tenant.description && (
                <p className="text-sm text-slate-600 pt-2 border-t">{tenant.description}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'admins' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Add Tenant Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={adminForm.first_name}
                  onChange={(e) => setAdminForm({ ...adminForm, first_name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Last name"
                  value={adminForm.last_name}
                  onChange={(e) => setAdminForm({ ...adminForm, last_name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  required
                />
                <Input
                  type="password"
                  placeholder="Temporary password"
                  value={adminForm.password}
                  onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                  required
                />
                <select
                  value={adminForm.role}
                  onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value })}
                  className="px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>
                <div className="flex items-center">
                  <Button type="submit" size="sm" disabled={busy}>
                    Create Admin
                  </Button>
                </div>
              </form>
              <p className="text-xs text-slate-500 mt-3">
                Creates a portal admin record and a Supabase Auth login bound to this tenant&apos;s
                company (empty account — no demo data).
              </p>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              {users.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">No admins yet</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/60">
                      {['Name', 'Email', 'Role', 'Status', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="px-4 py-3 font-medium">
                          {u.first_name} {u.last_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>
                        <td className="px-4 py-3 capitalize">{u.role}</td>
                        <td className="px-4 py-3 capitalize">{u.status}</td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => toggleAdminStatus(u.id, u.status)}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="w-4 h-4" /> Create Employee for Tenant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateEmployee} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  placeholder="First name"
                  value={empForm.first_name}
                  onChange={(e) => setEmpForm({ ...empForm, first_name: e.target.value })}
                  required
                />
                <Input
                  placeholder="Last name"
                  value={empForm.last_name}
                  onChange={(e) => setEmpForm({ ...empForm, last_name: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Work email"
                  value={empForm.corporate_email}
                  onChange={(e) => setEmpForm({ ...empForm, corporate_email: e.target.value })}
                />
                <Input
                  placeholder="Position"
                  value={empForm.position}
                  onChange={(e) => setEmpForm({ ...empForm, position: e.target.value })}
                />
                <Input
                  placeholder="Department"
                  value={empForm.department}
                  onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                />
                <div className="flex items-center">
                  <Button type="submit" size="sm" disabled={busy}>
                    Create Employee
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              {employees.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No employees assigned. New tenants start empty.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50/60">
                      {['Name', 'Email', 'Position', 'Department', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {employees.map((e) => (
                      <tr key={e.id}>
                        <td className="px-4 py-3 font-medium">
                          {e.first_name} {e.last_name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {e.corporate_email || e.email || e.personal_email || '—'}
                        </td>
                        <td className="px-4 py-3">{e.position || '—'}</td>
                        <td className="px-4 py-3">{e.department || '—'}</td>
                        <td className="px-4 py-3 capitalize">{e.status || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'assign' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assign Company to Tenant</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">
                Link this portal tenant to an HR <code>companies</code> row. New tenants are
                auto-provisioned with an empty company; use this to reassign.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={assignCompanyId}
                  onChange={(e) => setAssignCompanyId(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-background"
                >
                  <option value="">Select company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.linked_tenant && c.linked_tenant.id !== tenantId
                        ? ` (linked: ${c.linked_tenant.name})`
                        : ''}
                    </option>
                  ))}
                </select>
                <Button size="sm" onClick={handleAssignCompany} disabled={busy}>
                  Assign Company
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Assign Unassigned Employees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unassigned.length === 0 ? (
                <p className="text-sm text-slate-500">No unassigned employees available.</p>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto border rounded-md divide-y">
                    {unassigned.map((e) => (
                      <label
                        key={e.id}
                        className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!selectedUnassigned[e.id]}
                          onChange={(ev) =>
                            setSelectedUnassigned((prev) => ({
                              ...prev,
                              [e.id]: ev.target.checked,
                            }))
                          }
                        />
                        <span className="font-medium">
                          {e.first_name} {e.last_name}
                        </span>
                        <span className="text-slate-500">
                          {e.corporate_email || e.email || ''}
                        </span>
                      </label>
                    ))}
                  </div>
                  <Button size="sm" onClick={handleAssignEmployees} disabled={busy}>
                    Assign Selected to Tenant
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'modules' && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enabled Modules</CardTitle>
            <p className="text-sm text-slate-500">Monthly cost: GHS {calculatedCost.toFixed(2)}</p>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <p className="text-sm text-slate-500">No modules enabled</p>
            ) : (
              <div className="divide-y">
                {modules.map((m) => (
                  <div key={m.id} className="py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{m.superadmin_modules?.name || 'Module'}</p>
                      <p className="text-xs text-slate-500">
                        Enabled {m.enabled_at ? new Date(m.enabled_at).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <span className="text-sm font-semibold">
                      GHS {(m.superadmin_modules?.monthly_cost || 0).toFixed(2)}/mo
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
