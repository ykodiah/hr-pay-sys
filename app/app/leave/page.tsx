"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import {
  Calendar, Clock, CheckCircle, XCircle, AlertCircle,
  Filter, Search, Eye, Download, Users, RefreshCw,
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

export default function AdminLeavePage() {
  const [requests, setRequests]               = useState<LeaveRequest[]>([])
  const [loading, setLoading]                 = useState(true)
  const [search, setSearch]                   = useState("")
  const [statusFilter, setStatusFilter]       = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [selected, setSelected]               = useState<LeaveRequest | null>(null)
  const [detailOpen, setDetailOpen]           = useState(false)
  const [rejectReason, setRejectReason]       = useState("")
  const [actionLoading, setActionLoading]     = useState(false)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/leave?${params}`)
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => { loadRequests() }, [loadRequests])

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
      loadRequests()
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
          <p className="text-muted-foreground">Review and manage employee leave requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={loadRequests} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button variant="outline" onClick={downloadCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Filters */}
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

      {/* Requests Table */}
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

      {/* Detail / Reject Dialog */}
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
    </div>
  )
}
