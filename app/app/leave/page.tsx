"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  Calendar, CheckCircle, XCircle, AlertCircle,
  Filter, Search, Eye, Download, Users, RefreshCw, Plus, Loader2, Settings2, Pencil,
} from "lucide-react"

interface LeaveRequest {
  id: string
  employee_id: string
  employee_name: string | null
  employee_id_no: string | null
  department: string | null
  position: string | null
  leave_type_name: string | null
  start_date: string
  end_date: string
  days_requested: number | null
  reason: string | null
  status: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  created_at: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved:  "bg-green-100 text-green-800",
    rejected:  "bg-red-100 text-red-800",
    pending:   "bg-orange-100 text-orange-800",
    cancelled: "bg-gray-100 text-gray-600",
  }
  return (
    <Badge className={map[status] ?? "bg-gray-100 text-gray-700"}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

function initials(name: string | null) {
  if (!name) return "?"
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

type LeaveType = {
  id: string
  name: string
  code?: string
  description?: string | null
  category?: string
  entitlement_amount?: number
  is_paid?: boolean
  payment_percentage?: number
  requires_approval?: boolean
  allow_carry_over?: boolean
  max_carry_over_days?: number
  min_notice_days?: number
  is_active?: boolean
}

type EmployeeOpt = { id: string; first_name?: string; last_name?: string; employee_id?: string }

const EMPTY_TYPE_FORM = {
  code: "",
  name: "",
  description: "",
  category: "general",
  entitlement_amount: "21",
  is_paid: true,
  payment_percentage: "100",
  requires_approval: true,
  allow_carry_over: false,
  max_carry_over_days: "0",
  min_notice_days: "0",
  is_active: true,
}

export default function AdminLeavePage() {
  const [mainTab, setMainTab] = useState("requests")
  const [requests, setRequests]               = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes]           = useState<LeaveType[]>([])
  const [allLeaveTypes, setAllLeaveTypes]     = useState<LeaveType[]>([])
  const [employees, setEmployees]             = useState<EmployeeOpt[]>([])
  const [loading, setLoading]                 = useState(true)
  const [typesLoading, setTypesLoading]       = useState(false)
  const [search, setSearch]                   = useState("")
  const [statusFilter, setStatusFilter]       = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [selected, setSelected]               = useState<LeaveRequest | null>(null)
  const [detailOpen, setDetailOpen]           = useState(false)
  const [createOpen, setCreateOpen]           = useState(false)
  const [typeOpen, setTypeOpen]               = useState(false)
  const [editingType, setEditingType]         = useState<LeaveType | null>(null)
  const [typeForm, setTypeForm]               = useState(EMPTY_TYPE_FORM)
  const [rejectReason, setRejectReason]       = useState("")
  const [actionLoading, setActionLoading]     = useState(false)
  const [createForm, setCreateForm] = useState({
    employee_id: "",
    leave_type_id: "",
    start_date: "",
    end_date: "",
    reason: "",
    auto_approve: false,
  })

  const loadLeaveTypes = useCallback(async (silent = false) => {
    if (!silent) setTypesLoading(true)
    try {
      const res = await fetch("/api/leave/types?include_inactive=true", {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load leave types")
      const list: LeaveType[] = data.leave_types || []
      setAllLeaveTypes(list)
      setLeaveTypes(list.filter((t) => t.is_active !== false))
    } catch (err) {
      toast({
        title: "Leave types",
        description: (err as Error).message,
        variant: "destructive",
      })
    } finally {
      setTypesLoading(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const [leaveRes, empRes] = await Promise.all([
        fetch(`/api/leave?${params}`, { credentials: "include", cache: "no-store" }),
        fetch("/api/employees?status=active&limit=2000&options=true", {
          credentials: "include",
          cache: "no-store",
        }),
      ])
      if (leaveRes.ok) {
        const data = await leaveRes.json()
        setRequests(data.requests ?? [])
        // Prefer dedicated types endpoint; fall back to leave API types for initiate dialog
        if (Array.isArray(data.leave_types) && data.leave_types.length) {
          setLeaveTypes((prev) => (prev.length ? prev : data.leave_types))
        }
      }
      if (empRes.ok) {
        const empData = await empRes.json()
        const list = Array.isArray(empData) ? empData : empData.employees || empData.data || []
        setEmployees(list)
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { void loadRequests() }, [loadRequests])
  useEffect(() => { void loadLeaveTypes() }, [loadLeaveTypes])

  const handleAction = async (id: string, action: "approve" | "reject", reason?: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, rejection_reason: reason }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Action failed")
      }
      toast({
        title: action === "approve" ? "Leave Approved" : "Leave Rejected",
        description: action === "approve"
          ? "The leave request has been approved."
          : "The leave request has been rejected.",
        variant: action === "approve" ? "default" : "destructive",
      })
      setDetailOpen(false)
      setRejectReason("")
      void loadRequests()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const departments = [...new Set(requests.map((r) => r.department).filter(Boolean))] as string[]

  const filtered = requests.filter((r) => {
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    const matchDept   = departmentFilter === "all" || r.department === departmentFilter
    const q = search.toLowerCase()
    const matchSearch = !q
      || r.employee_name?.toLowerCase().includes(q)
      || r.employee_id_no?.toLowerCase().includes(q)
      || r.leave_type_name?.toLowerCase().includes(q)
    return matchStatus && matchDept && matchSearch
  })

  const stats = {
    pending:  requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
    total:    requests.length,
  }

  const createLeave = async () => {
    if (!createForm.employee_id || !createForm.start_date || !createForm.end_date) {
      toast({ title: "Missing fields", description: "Employee and dates are required.", variant: "destructive" })
      return
    }
    setActionLoading(true)
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...createForm,
          initiated_by: "admin",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to create leave")
      toast({
        title: createForm.auto_approve ? "Leave created & approved" : "Leave request created",
        description: "Saved to the database.",
      })
      setCreateOpen(false)
      setCreateForm({
        employee_id: "",
        leave_type_id: "",
        start_date: "",
        end_date: "",
        reason: "",
        auto_approve: false,
      })
      void loadRequests()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const openCreateType = () => {
    setEditingType(null)
    setTypeForm(EMPTY_TYPE_FORM)
    setTypeOpen(true)
  }

  const openEditType = (t: LeaveType) => {
    setEditingType(t)
    setTypeForm({
      code: t.code || "",
      name: t.name || "",
      description: t.description || "",
      category: t.category || "general",
      entitlement_amount: String(t.entitlement_amount ?? 0),
      is_paid: t.is_paid !== false,
      payment_percentage: String(t.payment_percentage ?? 100),
      requires_approval: t.requires_approval !== false,
      allow_carry_over: Boolean(t.allow_carry_over),
      max_carry_over_days: String(t.max_carry_over_days ?? 0),
      min_notice_days: String(t.min_notice_days ?? 0),
      is_active: t.is_active !== false,
    })
    setTypeOpen(true)
  }

  const saveLeaveType = async () => {
    if (!typeForm.code.trim() || !typeForm.name.trim()) {
      toast({ title: "Code and name required", variant: "destructive" })
      return
    }
    setActionLoading(true)
    try {
      const payload = {
        ...(editingType ? { id: editingType.id } : {}),
        code: typeForm.code,
        name: typeForm.name,
        description: typeForm.description || null,
        category: typeForm.category,
        entitlement_type: "annual",
        entitlement_amount: Number(typeForm.entitlement_amount) || 0,
        is_paid: typeForm.is_paid,
        payment_percentage: typeForm.is_paid ? Number(typeForm.payment_percentage) || 100 : 0,
        requires_approval: typeForm.requires_approval,
        allow_carry_over: typeForm.allow_carry_over,
        max_carry_over_days: Number(typeForm.max_carry_over_days) || 0,
        min_notice_days: Number(typeForm.min_notice_days) || 0,
        is_active: typeForm.is_active,
      }
      const res = await fetch("/api/leave/types", {
        method: editingType ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to save leave type")
      toast({ title: editingType ? "Leave type updated" : "Leave type created" })
      setTypeOpen(false)
      await loadLeaveTypes(true)
      void loadRequests()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTypeActive = async (t: LeaveType) => {
    try {
      const res = await fetch("/api/leave/types", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id: t.id, is_active: !t.is_active }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to update")
      await loadLeaveTypes(true)
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    }
  }

  const downloadCSV = () => {
    const headers = ["Employee", "ID No", "Department", "Leave Type", "Start", "End", "Days", "Status", "Reason"]
    const rows = filtered.map((r) => [
      r.employee_name ?? "", r.employee_id_no ?? "", r.department ?? "",
      r.leave_type_name ?? "", r.start_date, r.end_date,
      r.days_requested ?? "", r.status, r.reason ?? "",
    ])
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `leave-requests-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Review leave requests and configure leave types</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              void loadRequests()
              void loadLeaveTypes(true)
            }}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Initiate leave
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total,    icon: Users,        color: "text-blue-600"   },
          { label: "Pending",  value: stats.pending,  icon: AlertCircle,  color: "text-orange-500" },
          { label: "Approved", value: stats.approved, icon: CheckCircle,  color: "text-green-600"  },
          { label: "Rejected", value: stats.rejected, icon: XCircle,      color: "text-red-600"    },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{loading ? "—" : value}</p>
                </div>
                <Icon className={`w-6 h-6 ${color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="types">
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            Leave Types
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search employee, type..."
                    className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leave Requests ({loading ? "…" : filtered.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No leave requests found</p>
                  <p className="text-sm">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filtered.map((req) => (
                    <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="w-9 h-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials(req.employee_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{req.employee_name ?? "Unknown"}</p>
                          <p className="text-xs text-muted-foreground">{req.department ?? req.employee_id_no}</p>
                        </div>
                      </div>

                      <div className="hidden md:block">
                        <p className="text-sm font-medium">{req.leave_type_name ?? "Leave"}</p>
                        <p className="text-xs text-muted-foreground">{req.days_requested ?? "?"} day(s)</p>
                      </div>

                      <div className="hidden lg:block text-sm text-muted-foreground">
                        {new Date(req.start_date).toLocaleDateString()} &ndash;{" "}
                        {new Date(req.end_date).toLocaleDateString()}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={req.status} />

                        <Button variant="ghost" size="icon" onClick={() => { setSelected(req); setDetailOpen(true) }}>
                          <Eye className="w-4 h-4" />
                        </Button>

                        {req.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline"
                              className="text-green-700 border-green-300 hover:bg-green-50"
                              disabled={actionLoading}
                              onClick={() => handleAction(req.id, "approve")}>
                              <CheckCircle className="w-4 h-4 mr-1" /> Approve
                            </Button>
                            <Button size="sm" variant="outline"
                              className="text-red-700 border-red-300 hover:bg-red-50"
                              disabled={actionLoading}
                              onClick={() => { setSelected(req); setDetailOpen(true) }}>
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-semibold">Leave type settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure entitlement, pay, approval, and carry-over rules. Changes sync immediately to the database.
              </p>
            </div>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateType}>
              <Plus className="w-4 h-4 mr-2" />
              Add leave type
            </Button>
          </div>

          {typesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : allLeaveTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Settings2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="font-medium">No leave types yet</p>
                <p className="text-sm mb-4">Create Annual, Sick, or Maternity leave types for your company.</p>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={openCreateType}>
                  Create first leave type
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {allLeaveTypes.map((t) => (
                <Card key={t.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{t.name}</CardTitle>
                        <CardDescription className="font-mono text-xs">{t.code}</CardDescription>
                      </div>
                      <Badge variant={t.is_active === false ? "secondary" : "outline"}>
                        {t.is_active === false ? "Inactive" : "Active"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {t.description || `${t.category || "general"} · ${t.entitlement_amount ?? 0} days`}
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <Badge variant="secondary">{t.entitlement_amount ?? 0} days</Badge>
                      <Badge variant="secondary">
                        {t.is_paid === false ? "Unpaid" : `Paid ${t.payment_percentage ?? 100}%`}
                      </Badge>
                      <Badge variant="secondary">{t.requires_approval === false ? "Auto" : "Approval"}</Badge>
                      {t.allow_carry_over ? <Badge variant="secondary">Carry-over</Badge> : null}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        <Switch checked={t.is_active !== false} onCheckedChange={() => void toggleTypeActive(t)} />
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEditType(t)}>
                        <Pencil className="w-3.5 h-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={detailOpen} onOpenChange={(o) => { setDetailOpen(o); if (!o) setRejectReason("") }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Leave Request Detail</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Employee</span><p className="font-semibold">{selected.employee_name}</p></div>
                <div><span className="text-muted-foreground">Department</span><p className="font-semibold">{selected.department ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Leave Type</span><p className="font-semibold">{selected.leave_type_name ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Duration</span><p className="font-semibold">{selected.days_requested ?? "?"} day(s)</p></div>
                <div><span className="text-muted-foreground">From</span><p className="font-semibold">{new Date(selected.start_date).toLocaleDateString()}</p></div>
                <div><span className="text-muted-foreground">To</span><p className="font-semibold">{new Date(selected.end_date).toLocaleDateString()}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Reason</span><p className="font-semibold">{selected.reason ?? "No reason provided"}</p></div>
                <div className="col-span-2"><span className="text-muted-foreground">Status</span><div className="mt-1"><StatusBadge status={selected.status} /></div></div>
              </div>

              {selected.status === "pending" && (
                <>
                  <div>
                    <Label>Rejection Reason (required for reject)</Label>
                    <Textarea placeholder="Enter reason for rejection..."
                      value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                    <Button
                      className="bg-red-600 hover:bg-red-700 text-white"
                      disabled={actionLoading || !rejectReason.trim()}
                      onClick={() => handleAction(selected.id, "reject", rejectReason)}>
                      {actionLoading ? "Processing..." : "Reject"}
                    </Button>
                    <Button
                      className="bg-teal-600 hover:bg-teal-700"
                      disabled={actionLoading}
                      onClick={() => handleAction(selected.id, "approve")}>
                      {actionLoading ? "Processing..." : "Approve"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Initiate leave for employee</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Active employee</Label>
              <Select
                value={createForm.employee_id}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, employee_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select active employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.length === 0 ? (
                    <SelectItem value="__none" disabled>
                      No active employees found
                    </SelectItem>
                  ) : (
                    employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {`${e.first_name || ""} ${e.last_name || ""}`.trim()} {e.employee_id ? `(${e.employee_id})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave type</Label>
              <Select
                value={createForm.leave_type_id}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, leave_type_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {leaveTypes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  type="date"
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  type="date"
                  value={createForm.end_date}
                  onChange={(e) => setCreateForm((f) => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Reason</Label>
              <Textarea
                value={createForm.reason}
                onChange={(e) => setCreateForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={createForm.auto_approve}
                onChange={(e) => setCreateForm((f) => ({ ...f, auto_approve: e.target.checked }))}
              />
              Approve immediately (marks attendance as leave & updates balances)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={actionLoading} onClick={() => void createLeave()}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Create leave
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={typeOpen} onOpenChange={setTypeOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingType ? "Edit leave type" : "Create leave type"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={typeForm.code}
                  onChange={(e) => setTypeForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="AL"
                  disabled={Boolean(editingType)}
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select value={typeForm.category} onValueChange={(v) => setTypeForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="family">Family</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Name</Label>
              <Input
                value={typeForm.name}
                onChange={(e) => setTypeForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Annual Leave"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={typeForm.description}
                onChange={(e) => setTypeForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Entitlement (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={typeForm.entitlement_amount}
                  onChange={(e) => setTypeForm((f) => ({ ...f, entitlement_amount: e.target.value }))}
                />
              </div>
              <div>
                <Label>Min notice (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={typeForm.min_notice_days}
                  onChange={(e) => setTypeForm((f) => ({ ...f, min_notice_days: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>Paid leave</Label>
                <Switch checked={typeForm.is_paid} onCheckedChange={(v) => setTypeForm((f) => ({ ...f, is_paid: v }))} />
              </div>
              {typeForm.is_paid && (
                <div>
                  <Label>Payment % of daily rate</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={typeForm.payment_percentage}
                    onChange={(e) => setTypeForm((f) => ({ ...f, payment_percentage: e.target.value }))}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    100% = full pay while on leave. 50% = half pay. Unpaid portion is added to payroll deductions on
                    approve.
                  </p>
                </div>
              )}
              {!typeForm.is_paid && (
                <p className="text-[11px] text-amber-800 bg-amber-50 rounded-md px-2 py-1.5">
                  Unpaid leave: on approve, days × (monthly basic ÷ 27) is written to pay inputs as a deduction.
                </p>
              )}
              <div className="flex items-center justify-between">
                <Label>Requires approval</Label>
                <Switch
                  checked={typeForm.requires_approval}
                  onCheckedChange={(v) => setTypeForm((f) => ({ ...f, requires_approval: v }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow carry-over</Label>
                <Switch
                  checked={typeForm.allow_carry_over}
                  onCheckedChange={(v) => setTypeForm((f) => ({ ...f, allow_carry_over: v }))}
                />
              </div>
              {typeForm.allow_carry_over && (
                <div>
                  <Label>Max carry-over days</Label>
                  <Input
                    type="number"
                    min={0}
                    value={typeForm.max_carry_over_days}
                    onChange={(e) => setTypeForm((f) => ({ ...f, max_carry_over_days: e.target.value }))}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch checked={typeForm.is_active} onCheckedChange={(v) => setTypeForm((f) => ({ ...f, is_active: v }))} />
              </div>
            </div>
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-xs">How paid leave is computed</p>
              <p>
                daily rate = monthly basic ÷ 27 (GRA working days). Paid amount = leave days × daily rate × payment %.
                Saved on the leave request and unpaid remainder syncs to payroll.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setTypeOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" disabled={actionLoading} onClick={() => void saveLeaveType()}>
              {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              {editingType ? "Update type" : "Create type"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
