"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { Calendar, Plus, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from "lucide-react"

interface LeaveRequest {
  id: string
  leave_type_name: string | null
  start_date: string
  end_date: string
  days_requested: number | null
  reason: string | null
  status: string
  created_at: string
  rejection_reason: string | null
}

interface LeaveBalance {
  name: string
  total: number
  used: number
  remaining: number
}

const LEAVE_TYPES = [
  { value: "Annual Leave",    label: "Annual Leave",    entitlement: 21 },
  { value: "Sick Leave",      label: "Sick Leave",      entitlement: 10 },
  { value: "Personal Leave",  label: "Personal Leave",  entitlement: 5  },
  { value: "Emergency Leave", label: "Emergency Leave", entitlement: 3  },
  { value: "Maternity Leave", label: "Maternity Leave", entitlement: 90 },
  { value: "Paternity Leave", label: "Paternity Leave", entitlement: 7  },
]

function statusIcon(status: string) {
  if (status === "approved") return <CheckCircle className="w-4 h-4 text-green-600" />
  if (status === "rejected") return <XCircle className="w-4 h-4 text-red-600" />
  if (status === "cancelled") return <XCircle className="w-4 h-4 text-gray-400" />
  return <AlertCircle className="w-4 h-4 text-orange-500" />
}

function statusBadge(status: string) {
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

function calcDays(start: string, end: string) {
  const ms = new Date(end).getTime() - new Date(start).getTime()
  return Math.max(1, Math.round(ms / 86400000) + 1)
}

export default function LeavePage() {
  const [requests, setRequests]             = useState<LeaveRequest[]>([])
  const [balances, setBalances]             = useState<LeaveBalance[]>([])
  const [loading, setLoading]               = useState(true)
  const [dialogOpen, setDialogOpen]         = useState(false)
  const [submitting, setSubmitting]         = useState(false)
  const [cancellingId, setCancellingId]     = useState<string | null>(null)

  const [form, setForm] = useState({
    leave_type_name: "",
    start_date: "",
    end_date: "",
    reason: "",
  })

  const supabase = createClient()

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [reqRes, balanceRes] = await Promise.all([
        fetch(`/api/leave?employee_id=${user.id}`),
        supabase
          .from("leave_requests")
          .select("leave_type_name, days_requested, status")
          .eq("employee_id", user.id)
          .in("status", ["approved", "pending"]),
      ])

      if (reqRes.ok) {
        const data = await reqRes.json()
        setRequests(data.requests ?? [])
      }

      // Build balances from approved requests
      const usedMap: Record<string, number> = {}
      for (const r of balanceRes.data ?? []) {
        const type = r.leave_type_name ?? "Other"
        usedMap[type] = (usedMap[type] ?? 0) + (r.status === "approved" ? (r.days_requested ?? 0) : 0)
      }

      setBalances(
        LEAVE_TYPES.map((lt) => ({
          name:      lt.label,
          total:     lt.entitlement,
          used:      usedMap[lt.value] ?? 0,
          remaining: Math.max(0, lt.entitlement - (usedMap[lt.value] ?? 0)),
        })),
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.leave_type_name || !form.start_date || !form.end_date) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const days = calcDays(form.start_date, form.end_date)

      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id:     user.id,
          leave_type_name: form.leave_type_name,
          start_date:      form.start_date,
          end_date:        form.end_date,
          days_requested:  days,
          reason:          form.reason || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to submit")
      }

      toast({ title: "Leave Requested", description: `Your ${form.leave_type_name} request for ${days} day${days !== 1 ? "s" : ""} has been submitted.` })
      setDialogOpen(false)
      setForm({ leave_type_name: "", start_date: "", end_date: "", reason: "" })
      loadData()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (id: string) => {
    setCancellingId(id)
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Failed to cancel")
      }
      toast({ title: "Cancelled", description: "Leave request cancelled." })
      loadData()
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" })
    } finally {
      setCancellingId(null)
    }
  }

  const shownBalances = balances.slice(0, 3)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Leave Requests</h1>
          <p className="text-muted-foreground">Manage your leave applications and view balances</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Leave Type *</Label>
                  <Select value={form.leave_type_name} onValueChange={(v) => setForm((f) => ({ ...f, leave_type_name: v }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((lt) => (
                        <SelectItem key={lt.value} value={lt.value}>{lt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date *</Label>
                    <Input type="date" value={form.start_date}
                      onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))} />
                  </div>
                  <div>
                    <Label>End Date *</Label>
                    <Input type="date" value={form.end_date} min={form.start_date}
                      onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))} />
                  </div>
                </div>

                {form.start_date && form.end_date && (
                  <p className="text-sm text-muted-foreground">
                    Duration: <strong>{calcDays(form.start_date, form.end_date)} day(s)</strong>
                  </p>
                )}

                <div>
                  <Label>Reason</Label>
                  <Textarea placeholder="Reason for leave..." value={form.reason}
                    onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} rows={3} />
                </div>

                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <p className="text-sm text-blue-800">
                    Leave requests require manager approval. You will be notified once reviewed.
                  </p>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
            ))
          : shownBalances.map((b) => (
              <Card key={b.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{b.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Entitlement</span>
                    <span className="font-medium">{b.total} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium text-red-600">{b.used} days</span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-semibold">Remaining</span>
                    <span className="font-bold text-green-600">{b.remaining} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <CardTitle>Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No leave requests yet</p>
              <p className="text-sm">Click &quot;Request Leave&quot; to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((req) => (
                <div key={req.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/40 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{req.leave_type_name ?? "Leave Request"}</p>
                      <p className="text-xs text-muted-foreground">{req.reason ?? "No reason provided"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Applied {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {new Date(req.start_date).toLocaleDateString()} &ndash;{" "}
                        {new Date(req.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground">{req.days_requested ?? "?"} day(s)</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {statusIcon(req.status)}
                      {statusBadge(req.status)}
                    </div>

                    {req.status === "pending" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={cancellingId === req.id}
                        onClick={() => handleCancel(req.id)}
                      >
                        {cancellingId === req.id ? <Clock className="w-4 h-4 animate-spin" /> : "Cancel"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
