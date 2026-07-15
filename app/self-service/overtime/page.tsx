"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import useSWR, { mutate } from "swr"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Clock, Plus, Calendar, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export default function SelfServiceOvertimePage() {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    date: "",
    hours: "",
    overtime_type: "regular",
    reason: "",
  })

  const { data, error, isLoading } = useSWR("/api/overtime?scope=mine", fetcher)
  const requests: any[] = data?.requests ?? []

  const handleSubmit = async () => {
    if (!form.date || !form.hours || !form.reason) {
      toast({ title: "Missing fields", description: "Please fill in all required fields.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: form.date,
          hours: parseFloat(form.hours),
          overtime_type: form.overtime_type,
          reason: form.reason,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed to submit")
      toast({ title: "Request submitted", description: "Your overtime request has been sent for approval." })
      setOpen(false)
      setForm({ date: "", hours: "", overtime_type: "regular", reason: "" })
      mutate("/api/overtime?scope=mine")
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const pendingCount  = requests.filter(r => r.status === "pending").length
  const approvedCount = requests.filter(r => r.status === "approved").length
  const totalHours    = requests.filter(r => r.status === "approved")
                               .reduce((s: number, r: any) => s + Number(r.hours ?? 0), 0)

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Overtime</h1>
          <p className="text-sm text-muted-foreground">Submit and track your overtime requests.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New Request
        </Button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
            <p className="text-3xl font-bold mt-1">{pendingCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved</p>
            <p className="text-3xl font-bold mt-1 text-green-600">{approvedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Approved Hours</p>
            <p className="text-3xl font-bold mt-1">{totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Request list */}
      <Card>
        <CardHeader>
          <CardTitle>Request History</CardTitle>
          <CardDescription>All your overtime requests this year</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex items-center justify-center py-10 text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          )}
          {!isLoading && requests.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>No overtime requests yet.</p>
            </div>
          )}
          <div className="divide-y">
            {requests.map((req: any) => (
              <div key={req.id} className="flex items-center justify-between py-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {req.date}
                    <span className="text-muted-foreground font-normal">·</span>
                    <span>{req.hours}h</span>
                    <span className="capitalize text-muted-foreground text-xs">{req.overtime_type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{req.reason}</p>
                  {req.rejection_reason && (
                    <p className="text-xs text-red-600">Reason: {req.rejection_reason}</p>
                  )}
                </div>
                <Badge className={STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}>
                  {req.status === "approved"  && <CheckCircle2 className="h-3 w-3 mr-1" />}
                  {req.status === "rejected"  && <XCircle className="h-3 w-3 mr-1" />}
                  {req.status === "pending"   && <AlertCircle className="h-3 w-3 mr-1" />}
                  {req.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* New request dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Overtime Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ot-date">Date *</Label>
                <Input id="ot-date" type="date" value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ot-hours">Hours *</Label>
                <Input id="ot-hours" type="number" min="0.5" max="12" step="0.5"
                  placeholder="e.g. 2" value={form.hours}
                  onChange={e => setForm(f => ({ ...f, hours: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Overtime Type</Label>
              <Select value={form.overtime_type} onValueChange={v => setForm(f => ({ ...f, overtime_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (1.5x)</SelectItem>
                  <SelectItem value="weekend">Weekend (2x)</SelectItem>
                  <SelectItem value="holiday">Public Holiday (2.5x)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ot-reason">Reason / Description *</Label>
              <Textarea id="ot-reason" rows={3} placeholder="Describe the work done during overtime…"
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
