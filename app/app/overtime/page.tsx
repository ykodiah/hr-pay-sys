"use client"

import { useState } from "react"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, XCircle, AlertCircle, Clock, Search, Loader2 } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function AdminOvertimePage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [tab, setTab]       = useState("pending")
  const [actioning, setActioning] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  const { data, isLoading } = useSWR("/api/overtime", fetcher)
  const allRequests: any[] = data?.requests ?? []

  const filtered = allRequests.filter(r => {
    const matchesTab = tab === "all" || r.status === tab
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      r.employee_name?.toLowerCase().includes(q) ||
      r.date?.includes(q)
    return matchesTab && matchesSearch
  })

  const counts = {
    pending:  allRequests.filter(r => r.status === "pending").length,
    approved: allRequests.filter(r => r.status === "approved").length,
    rejected: allRequests.filter(r => r.status === "rejected").length,
  }

  const handleApprove = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Approved", description: "Overtime request approved." })
      mutate("/api/overtime")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async () => {
    if (!rejectDialog) return
    if (!rejectReason.trim()) {
      toast({ title: "Reason required", description: "Please provide a rejection reason.", variant: "destructive" })
      return
    }
    setActioning(rejectDialog.id)
    try {
      const res = await fetch(`/api/overtime/${rejectDialog.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejection_reason: rejectReason }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Rejected", description: "Overtime request rejected." })
      setRejectDialog(null)
      setRejectReason("")
      mutate("/api/overtime")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setActioning(null)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overtime Management</h1>
        <p className="text-sm text-muted-foreground">Review and approve employee overtime requests.</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <AlertCircle className="h-7 w-7 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{counts.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{counts.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 flex items-center gap-3">
            <XCircle className="h-7 w-7 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{counts.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>All Requests</CardTitle>
            <CardDescription>Filter and action overtime requests below</CardDescription>
          </div>
          <div className="relative w-56">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search employee or date…" className="pl-9"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="pending">Pending ({counts.pending})</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {["pending","approved","rejected","all"].map(tabVal => (
              <TabsContent key={tabVal} value={tabVal}>
                {isLoading && (
                  <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                  </div>
                )}
                {!isLoading && filtered.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p>No {tabVal === "all" ? "" : tabVal} requests found.</p>
                  </div>
                )}
                <div className="divide-y">
                  {filtered.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between py-4 gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{req.employee_name || "Employee"}</p>
                        <p className="text-xs text-muted-foreground">
                          {req.date} &bull; {req.hours}h &bull; <span className="capitalize">{req.overtime_type}</span>
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{req.reason}</p>
                        {req.rejection_reason && (
                          <p className="text-xs text-red-600 mt-0.5">Reason: {req.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}>
                          {req.status}
                        </Badge>
                        {req.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="text-green-700 border-green-300 hover:bg-green-50"
                              disabled={actioning === req.id}
                              onClick={() => handleApprove(req.id)}>
                              {actioning === req.id
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Approve</>
                              }
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-700 border-red-300 hover:bg-red-50"
                              disabled={actioning === req.id}
                              onClick={() => setRejectDialog({ id: req.id, name: req.employee_name || "Employee" })}>
                              <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={!!rejectDialog} onOpenChange={open => { if (!open) { setRejectDialog(null); setRejectReason("") } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Overtime Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Rejecting request from <strong>{rejectDialog?.name}</strong>. Please provide a reason.
            </p>
            <div className="space-y-1.5">
              <Label>Rejection Reason *</Label>
              <Textarea rows={3} placeholder="Explain why this request is being rejected…"
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
