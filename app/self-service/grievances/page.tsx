"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Plus, Clock, CheckCircle, MessageSquare, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { fetcher, postJson } from "@/lib/self-service/use-portal"
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/self-service/portal-ui"

const CATEGORIES = ["general", "workplace", "harassment", "pay", "discrimination", "safety", "other"]
const PRIORITIES = ["low", "medium", "high", "critical"]

export default function GrievancesPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/self-service/grievances", fetcher)
  const [tab, setTab] = useState("my-grievances")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: "",
    grievance_type: "general",
    description: "",
    priority: "medium",
    desired_outcome: "",
  })

  const items = data?.grievances || []
  const summary = data?.summary || { total: 0, open: 0, resolved: 0 }

  async function submit() {
    if (!form.title.trim() || form.description.trim().length < 20) {
      toast({
        title: "More detail needed",
        description: "Title is required and description must be at least 20 characters.",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      await postJson("/api/self-service/grievances", form)
      toast({ title: "Grievance submitted", description: "HR has been notified." })
      setOpen(false)
      setForm({ title: "", grievance_type: "general", description: "", priority: "medium", desired_outcome: "" })
      await mutate()
    } catch (e: any) {
      toast({ title: "Submit failed", description: e?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading grievances" rows={3} />
  if (error) return <ErrorBlock message={error.message} onRetry={() => mutate()} />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Grievances</h1>
          <p className="text-sm text-slate-500">File and track workplace concerns with HR.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> File grievance
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={summary.total} />
        <StatCard label="Open" value={summary.open} />
        <StatCard label="Resolved" value={summary.resolved} />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="my-grievances">My grievances</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>
        <TabsContent value="my-grievances" className="mt-4 space-y-3">
          {items.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="No grievances filed yet" />
          ) : (
            items.map((g: any) => (
              <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900">{g.title || g.subject}</p>
                    <p className="text-xs text-slate-500">
                      {g.grievance_type} · Filed {g.filed_at ? new Date(g.filed_at).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="capitalize">
                      {String(g.status).replace(/_/g, " ")}
                    </Badge>
                    <Badge className="capitalize">{g.priority}</Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-slate-600">{g.description}</p>
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
        <TabsContent value="guidelines" className="mt-4 space-y-3 text-sm text-slate-600">
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> When to file
            </p>
            <p className="mt-2">Use this channel for workplace conduct, pay disputes, discrimination, or safety concerns.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <Clock className="h-4 w-4 text-teal-700" /> Timeline
            </p>
            <p className="mt-2">HR acknowledges within 3 business days and investigates per company policy and the Labour Act.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="flex items-center gap-2 font-semibold text-slate-900">
              <CheckCircle className="h-4 w-4 text-emerald-600" /> Confidentiality
            </p>
            <p className="mt-2">Your filing is visible only to your employer&apos;s HR administrators.</p>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>File a grievance</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.grievance_type} onValueChange={(v) => setForm((f) => ({ ...f, grievance_type: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((t) => (
                      <SelectItem key={t} value={t} className="capitalize">
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p} className="capitalize">
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="At least 20 characters"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Desired outcome (optional)</Label>
              <Input
                value={form.desired_outcome}
                onChange={(e) => setForm((f) => ({ ...f, desired_outcome: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving} onClick={() => void submit()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  )
}
