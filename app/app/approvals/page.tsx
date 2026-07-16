"use client"

import { useEffect, useState } from "react"
import useSWR, { mutate } from "swr"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, Clock, Loader2, Users, Banknote, AlertTriangle, RefreshCw } from "lucide-react"
import { format } from "date-fns"

const STATUS_COLORS: Record<string, string> = {
  draft:      "bg-gray-100 text-gray-700",
  processing: "bg-blue-100 text-blue-700",
  pending:    "bg-yellow-100 text-yellow-800",
  approved:   "bg-green-100 text-green-800",
  rejected:   "bg-red-100 text-red-800",
  completed:  "bg-purple-100 text-purple-800",
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [tab, setTab]     = useState("payroll")
  const [companyId, setCompanyId] = useState("")
  const [actioning, setActioning] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ id: string; type: "payroll" | "leave" | "overtime"; label: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  useEffect(() => {
    const supabase = createClient()
    void supabase.from("companies").select("id").limit(1).maybeSingle().then(({ data }) => {
      if (data?.id) setCompanyId(data.id)
    })
  }, [])

  const payrollKey = companyId
    ? `/api/payroll/runs?company_id=${companyId}&status=pending`
    : "/api/payroll/runs?status=pending"
  const { data: payrollData, isLoading: payrollLoading } = useSWR(payrollKey, fetcher, {
    refreshInterval: 15000,
  })
  const { data: leaveData,   isLoading: leaveLoading   } = useSWR("/api/leave?status=pending", fetcher)
  const { data: overtimeData,isLoading: otLoading      } = useSWR("/api/overtime?status=pending", fetcher)

  const payrollRuns:   any[] = payrollData?.runs     ?? payrollData?.data   ?? []
  const leaveRequests: any[] = leaveData?.requests   ?? leaveData?.data     ?? []
  const otRequests:    any[] = overtimeData?.requests ?? overtimeData?.data ?? []

  const pendingStatuses = ["draft", "processing", "pending", "completed", "partial"]
  const totalPending = payrollRuns.filter(r => pendingStatuses.includes(r.status)).length
                     + leaveRequests.length + otRequests.length

  const handlePayrollApprove = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch("/api/payroll/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payroll_run_id: id, action: "approve" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({
        title: "Payroll approved",
        description: `Payslips issued (${json.payslips_issued ?? 0}). Next: History for payslips, Compliance Reports for GRA/SSNIT/bank files, then Mark as Paid.`,
      })
      mutate(payrollKey)
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setActioning(null) }
  }

  const handleLeaveApprove = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/leave/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Leave approved" })
      mutate("/api/leave?status=pending")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setActioning(null) }
  }

  const handleOvertimeApprove = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Overtime approved" })
      mutate("/api/overtime?status=pending")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setActioning(null) }
  }

  const handleReject = async () => {
    if (!rejectDialog || !rejectReason.trim()) {
      toast({ title: "Reason required", variant: "destructive" })
      return
    }
    setActioning(rejectDialog.id)
    try {
      let res: Response
      if (rejectDialog.type === "payroll") {
        res = await fetch("/api/payroll/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payroll_run_id: rejectDialog.id,
            action: "reject",
            rejection_reason: rejectReason,
            notes: rejectReason,
          }),
        })
      } else if (rejectDialog.type === "leave") {
        res = await fetch(`/api/leave/${rejectDialog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", rejection_reason: rejectReason }),
        })
      } else {
        res = await fetch(`/api/overtime/${rejectDialog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "reject", rejection_reason: rejectReason }),
        })
      }
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Rejected", description: `${rejectDialog.label} has been rejected.` })
      setRejectDialog(null); setRejectReason("")
      mutate(payrollKey)
      mutate("/api/leave?status=pending")
      mutate("/api/overtime?status=pending")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally { setActioning(null) }
  }

  const fmt = (d: string | null | undefined) =>
    d ? format(new Date(d), "dd MMM yyyy") : "—"

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
          <p className="text-sm text-muted-foreground">Review and approve payroll runs, leave, and overtime requests from the database.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate(payrollKey)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Sync
          </Button>
          {totalPending > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 gap-1">
              <AlertTriangle className="h-3.5 w-3.5" /> {totalPending} pending
            </Badge>
          )}
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payroll" className="gap-1">
            <Banknote className="h-3.5 w-3.5" />
            Payroll {payrollRuns.filter(r => pendingStatuses.includes(r.status)).length > 0 &&
              `(${payrollRuns.filter(r => pendingStatuses.includes(r.status)).length})`}
          </TabsTrigger>
          <TabsTrigger value="leave" className="gap-1">
            <Users className="h-3.5 w-3.5" />
            Leave {leaveRequests.length > 0 && `(${leaveRequests.length})`}
          </TabsTrigger>
          <TabsTrigger value="overtime" className="gap-1">
            <Clock className="h-3.5 w-3.5" />
            Overtime {otRequests.length > 0 && `(${otRequests.length})`}
          </TabsTrigger>
        </TabsList>

        {/* Payroll */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Runs Awaiting Approval</CardTitle>
              <CardDescription>Review and approve processed payroll runs before payment disbursement.</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>}
              {!payrollLoading && payrollRuns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Banknote className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No payroll runs pending approval.</p>
                </div>
              )}
              <div className="divide-y">
                {payrollRuns.map((run: any) => (
                  <div key={run.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{run.pay_period_start ? `${fmt(run.pay_period_start)} – ${fmt(run.pay_period_end)}` : run.id.slice(0,8)}</p>
                      <p className="text-xs text-muted-foreground">
                        Net: GH¢ {Number(run.total_net_pay ?? 0).toLocaleString()}
                        &bull; Employees: {run.employee_count ?? "—"}
                        &bull; Pay Date: {fmt(run.pay_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge className={STATUS_COLORS[run.status] || ""}>{run.status}</Badge>
                      {pendingStatuses.includes(run.status) && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                            disabled={actioning === run.id}
                            onClick={() => handlePayrollApprove(run.id)}>
                            {actioning === run.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</>}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-700 border-red-300"
                            disabled={actioning === run.id}
                            onClick={() => setRejectDialog({ id: run.id, type: "payroll", label: "Payroll run" })}>
                            <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave */}
        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Requests Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {leaveLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>}
              {!leaveLoading && leaveRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No leave requests pending.</p>
                </div>
              )}
              <div className="divide-y">
                {leaveRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{req.employee_name || "Employee"}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmt(req.start_date)} – {fmt(req.end_date)}
                        &bull; {req.leave_type_name || req.leave_type_id || "Leave"}
                        &bull; {req.days_requested ?? "?"} day{req.days_requested !== 1 ? "s" : ""}
                      </p>
                      {req.reason && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{req.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                        disabled={actioning === req.id}
                        onClick={() => handleLeaveApprove(req.id)}>
                        {actioning === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</>}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300"
                        disabled={actioning === req.id}
                        onClick={() => setRejectDialog({ id: req.id, type: "leave", label: "Leave request" })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overtime */}
        <TabsContent value="overtime">
          <Card>
            <CardHeader>
              <CardTitle>Overtime Requests Pending Approval</CardTitle>
            </CardHeader>
            <CardContent>
              {otLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin h-5 w-5 text-muted-foreground" /></div>}
              {!otLoading && otRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p>No overtime requests pending.</p>
                </div>
              )}
              <div className="divide-y">
                {otRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{req.employee_name || "Employee"}</p>
                      <p className="text-xs text-muted-foreground">
                        {req.date} &bull; {req.hours}h &bull; <span className="capitalize">{req.overtime_type}</span>
                      </p>
                      {req.reason && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{req.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-green-700 border-green-300"
                        disabled={actioning === req.id}
                        onClick={() => handleOvertimeApprove(req.id)}>
                        {actioning === req.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</>}
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-700 border-red-300"
                        disabled={actioning === req.id}
                        onClick={() => setRejectDialog({ id: req.id, type: "overtime", label: "Overtime request" })}>
                        <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={open => { if (!open) { setRejectDialog(null); setRejectReason("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject {rejectDialog?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Rejection Reason *</Label>
              <Textarea rows={3} placeholder="Provide a clear reason for the rejection…"
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialog(null); setRejectReason("") }}>Cancel</Button>
            <Button variant="destructive" disabled={!!actioning} onClick={handleReject}>
              {actioning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
