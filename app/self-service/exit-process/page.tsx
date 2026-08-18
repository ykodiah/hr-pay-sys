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
import { CheckCircle, Clock, DoorOpen, Package, RefreshCw, Wallet } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { fetcher, postJson, patchJson } from "@/lib/self-service/use-portal"
import { EmptyState, ErrorBlock, LoadingBlock } from "@/components/self-service/portal-ui"

export default function ExitProcessPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/self-service/exit", fetcher)
  const [tab, setTab] = useState("overview")
  const [open, setOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ last_working_day: "", exit_type: "resignation", reason: "" })
  const [interview, setInterview] = useState({ feedback: "", would_recommend: "true" })

  const caseRow = data?.case || null
  const checklist = data?.checklist || []
  const assets = data?.assets || []

  async function initiate() {
    if (!form.last_working_day || !form.reason.trim()) {
      toast({ title: "Missing details", description: "Last working day and reason are required.", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      await postJson("/api/self-service/exit", form)
      toast({ title: "Exit process initiated", description: "HR has been notified." })
      setOpen(false)
      await mutate()
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function saveInterview() {
    if (!caseRow?.id) return
    setSaving(true)
    try {
      await patchJson("/api/self-service/exit", {
        case_id: caseRow.id,
        feedback: interview.feedback,
        would_recommend: interview.would_recommend === "true",
      })
      toast({ title: "Exit interview saved" })
      setInterviewOpen(false)
      await mutate()
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingBlock label="Loading exit process" rows={3} />
  if (error) return <ErrorBlock message={error.message} onRetry={() => mutate()} />

  const doneItems = checklist.filter((c: any) => c.is_done || c.status === "completed").length
  const progress = checklist.length ? Math.round((doneItems / checklist.length) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Exit process</h1>
          <p className="text-sm text-slate-500">Track your offboarding checklist, interview, and assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
          {!caseRow && (
            <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setOpen(true)}>
              <DoorOpen className="mr-2 h-4 w-4" /> Initiate exit
            </Button>
          )}
        </div>
      </div>

      {!caseRow ? (
        <EmptyState
          icon={DoorOpen}
          title="No active exit process"
          description="Initiate when you are ready to resign or have been notified of an exit."
        />
      ) : (
        <>
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-teal-50/50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold capitalize text-slate-900">{String(caseRow.status).replace(/_/g, " ")}</p>
                <p className="text-sm text-slate-500">
                  Last day {caseRow.last_working_day ? new Date(caseRow.last_working_day).toLocaleDateString() : "—"} ·{" "}
                  {String(caseRow.reason).replace(/_/g, " ")}
                </p>
              </div>
              <Badge variant="outline">GHS {Number(caseRow.settlement_amount || 0).toLocaleString()} settlement</Badge>
            </div>
            {checklist.length > 0 && (
              <>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-1 text-right text-xs tabular-nums text-teal-800">{progress}% complete</p>
              </>
            )}
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">Checklist</TabsTrigger>
              <TabsTrigger value="interview">Exit interview</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="settlement">Settlement</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-2">
              {checklist.length === 0 ? (
                <p className="text-sm text-slate-500">HR has not published a checklist yet.</p>
              ) : (
                checklist.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div>
                      <p className={item.is_done ? "text-slate-400 line-through" : "font-medium text-slate-900"}>
                        {item.label || item.item}
                      </p>
                      <p className="text-[10px] uppercase text-slate-400">{item.category}</p>
                    </div>
                    {item.is_done ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-500" />
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="interview" className="mt-4">
              {caseRow.exit_interview_completed ? (
                <div className="rounded-2xl border border-slate-200 p-4 text-sm">
                  <p className="font-semibold text-emerald-800">Interview completed</p>
                  <p className="mt-2 text-slate-500">Thank you for your feedback.</p>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="mb-3 text-sm text-slate-500">Share feedback before your last working day.</p>
                  <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setInterviewOpen(true)}>
                    Complete exit interview
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assets" className="mt-4 space-y-2">
              {assets.length === 0 ? (
                <p className="text-sm text-slate-500">No assets listed yet. HR will add items to return.</p>
              ) : (
                assets.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-teal-700" />
                      <div>
                        <p className="font-medium text-slate-900">{a.name}</p>
                        <p className="text-xs text-slate-500">
                          {a.asset_type} · {a.serial_number || "no serial"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={a.returned ? "default" : "outline"}>{a.returned ? "Returned" : "Outstanding"}</Badge>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="settlement" className="mt-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-700" />
                  <p className="font-semibold text-slate-900">Final settlement</p>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                  GHS {Number(caseRow.settlement_amount || 0).toLocaleString()}
                </p>
                <p className="text-sm capitalize text-slate-500">Status: {caseRow.settlement_status || "pending"}</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate exit process</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Last working day</Label>
              <Input
                type="date"
                value={form.last_working_day}
                onChange={(e) => setForm((f) => ({ ...f, last_working_day: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Reason type</Label>
              <Select value={form.exit_type} onValueChange={(v) => setForm((f) => ({ ...f, exit_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["resignation", "retirement", "contract_end", "other"].map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">
                      {r.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Reason / comments</Label>
              <Textarea rows={3} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving} onClick={() => void initiate()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit interview</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Would you recommend this employer?</Label>
              <Select
                value={interview.would_recommend}
                onValueChange={(v) => setInterview((f) => ({ ...f, would_recommend: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea
                rows={4}
                value={interview.feedback}
                onChange={(e) => setInterview((f) => ({ ...f, feedback: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving} onClick={() => void saveInterview()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
