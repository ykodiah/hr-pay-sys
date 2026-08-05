"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Plus, Clock, CheckCircle, MessageSquare, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function GrievancesPage() {
  const [tab, setTab] = useState("my-grievances")
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const [form, setForm] = useState({
    title: "",
    grievanceType: "Workplace",
    description: "",
    priority: "medium",
    desiredOutcome: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
      const me = await meRes.json().catch(() => ({}))
      const eid = me?.employee?.id || me?.data?.employee?.id || null
      setEmployeeId(eid)

      const res = await fetch("/api/disciplinary", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      const all = Array.isArray(json.grievances) ? json.grievances : []
      setItems(eid ? all.filter((g: any) => g.employee_id === eid) : all)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function submit() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/disciplinary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "grievance",
          employeeId,
          title: form.title,
          grievanceType: form.grievanceType,
          description: form.description,
          priority: form.priority,
          desiredOutcome: form.desiredOutcome,
          status: "submitted",
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Submit failed")
      toast({ title: "Grievance submitted" })
      setOpen(false)
      setForm({ title: "", grievanceType: "Workplace", description: "", priority: "medium", desiredOutcome: "" })
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Submit failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const openCount = items.filter((g) => !["resolved", "closed", "withdrawn"].includes(String(g.status))).length
  const resolvedCount = items.filter((g) => ["resolved", "closed"].includes(String(g.status))).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Grievances</h1>
          <p className="text-sm text-muted-foreground">File and track workplace concerns with HR.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> File grievance
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{items.length}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase text-muted-foreground">Open</p>
          <p className="text-2xl font-bold">{openCount}</p>
        </div>
        <div className="rounded-2xl border p-4">
          <p className="text-xs uppercase text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold">{resolvedCount}</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-grievances">My grievances</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>
        <TabsContent value="my-grievances" className="mt-4 space-y-3">
          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
              No grievances filed yet.
            </div>
          ) : (
            items.map((g) => (
              <div key={g.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{g.title || g.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.grievance_type} · Filed {g.filed_at ? new Date(g.filed_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">{String(g.status).replace(/_/g, " ")}</Badge>
                    <Badge className="capitalize">{g.priority}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
                {(g.hr_response || g.resolution) && (
                  <div className="mt-3 rounded-xl bg-teal-50 p-3 text-sm">
                    <p className="flex items-center gap-1 font-medium text-teal-900">
                      <MessageSquare className="h-3.5 w-3.5" /> HR response
                    </p>
                    <p className="mt-1 text-teal-800">{g.hr_response || g.resolution}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
        <TabsContent value="guidelines" className="mt-4 space-y-3 text-sm text-muted-foreground">
          <div className="rounded-2xl border p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> When to file
            </p>
            <p className="mt-2">Use this channel for workplace conduct, pay disputes, discrimination, or safety concerns.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-teal-700" /> Timeline
            </p>
            <p className="mt-2">HR acknowledges within 3 business days and investigates per company policy and Ghana Labour Act.</p>
          </div>
          <div className="rounded-2xl border p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> Confidentiality
            </p>
            <p className="mt-2">Your filing is visible to HR administrators and stored in the company grievances database.</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>File a grievance</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.grievanceType} onValueChange={(v) => setForm((f) => ({ ...f, grievanceType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Workplace", "Harassment", "Pay", "Discrimination", "Safety", "Other"].map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Desired outcome</Label>
              <Input value={form.desiredOutcome} onChange={(e) => setForm((f) => ({ ...f, desiredOutcome: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving || !form.title || !employeeId} onClick={() => void submit()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
