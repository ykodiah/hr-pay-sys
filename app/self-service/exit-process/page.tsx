"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CheckCircle, Clock, DoorOpen, Package, RefreshCw, Wallet } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function ExitProcessPage() {
  const [tab, setTab] = useState("overview")
  const [open, setOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [employeeId, setEmployeeId] = useState<string | null>(null)
  const [caseRow, setCaseRow] = useState<any | null>(null)
  const [form, setForm] = useState({ lastWorkingDay: "", reason: "resignation", notes: "" })
  const [interview, setInterview] = useState({ feedback: "", wouldRecommend: "true", rehireEligible: "true" })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const meRes = await fetch("/api/self-service/me", { credentials: "include", cache: "no-store" })
      const me = await meRes.json().catch(() => ({}))
      const eid = me?.employee?.id || me?.data?.employee?.id || null
      setEmployeeId(eid)

      const res = await fetch("/api/offboarding", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      const mine = (json.cases || []).find((c: any) => c.employee_id === eid) || null
      setCaseRow(mine)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function initiate() {
    if (!employeeId || !form.lastWorkingDay) return
    setSaving(true)
    try {
      const res = await fetch("/api/offboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "case",
          employeeId,
          lastWorkingDay: form.lastWorkingDay,
          reason: form.reason,
          notes: form.notes,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Exit process initiated" })
      setOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  async function saveInterview() {
    if (!caseRow?.id) return
    setSaving(true)
    try {
      const res = await fetch("/api/offboarding", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview",
          caseId: caseRow.id,
          employeeId,
          status: "completed",
          feedback: interview.feedback,
          wouldRecommend: interview.wouldRecommend === "true",
          rehireEligible: interview.rehireEligible === "true",
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: "Exit interview saved" })
      setInterviewOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const progress = Number(caseRow?.checklist_progress || 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Exit process</h1>
          <p className="text-sm text-muted-foreground">Track your offboarding checklist, interview, and assets.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
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
        <div className="rounded-2xl border border-dashed py-16 text-center text-muted-foreground">
          No active exit process. Initiate when you are ready to resign or have been notified of an exit.
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-gradient-to-br from-teal-50/50 to-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold capitalize">{String(caseRow.status).replace(/_/g, " ")}</p>
                <p className="text-sm text-muted-foreground">
                  Last day {caseRow.last_working_day} · {String(caseRow.reason).replace(/_/g, " ")}
                </p>
              </div>
              <Badge variant="outline">GHS {Number(caseRow.settlement_amount || 0).toLocaleString()} settlement</Badge>
            </div>
            <Progress value={progress} className="mt-4 h-2" />
            <p className="mt-1 text-right text-xs tabular-nums text-teal-800">{progress}% complete</p>
          </div>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="overview">Checklist</TabsTrigger>
              <TabsTrigger value="interview">Exit interview</TabsTrigger>
              <TabsTrigger value="assets">Assets</TabsTrigger>
              <TabsTrigger value="settlement">Settlement</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-2">
              {(caseRow.checklist || []).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
                  <div>
                    <p className={item.is_done ? "text-muted-foreground line-through" : "font-medium"}>{item.label}</p>
                    <p className="text-[10px] uppercase text-muted-foreground">{item.category}</p>
                  </div>
                  {item.is_done ? (
                    <CheckCircle className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-amber-500" />
                  )}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="interview" className="mt-4">
              {caseRow.exit_interview_completed ? (
                <div className="rounded-2xl border p-4 text-sm">
                  <p className="font-semibold text-emerald-800">Interview completed</p>
                  <p className="mt-2 text-muted-foreground">{caseRow.interview?.feedback || "Thank you for your feedback."}</p>
                </div>
              ) : (
                <div className="rounded-2xl border p-4">
                  <p className="text-sm text-muted-foreground mb-3">Share feedback before your last working day.</p>
                  <Button className="bg-teal-700 text-white hover:bg-teal-800" onClick={() => setInterviewOpen(true)}>
                    Complete exit interview
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assets" className="mt-4 space-y-2">
              {(caseRow.assets || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No assets listed yet. HR will add items to return.</p>
              ) : (
                (caseRow.assets || []).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-teal-700" />
                      <div>
                        <p className="font-medium">{a.name}</p>
                        <p className="text-xs text-muted-foreground">{a.asset_type} · {a.serial_number || "no serial"}</p>
                      </div>
                    </div>
                    <Badge variant={a.returned ? "default" : "outline"}>{a.returned ? "Returned" : "Outstanding"}</Badge>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="settlement" className="mt-4">
              <div className="rounded-2xl border p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-teal-700" />
                  <p className="font-semibold">Final settlement</p>
                </div>
                <p className="mt-2 text-2xl font-bold tabular-nums">
                  GHS {Number(caseRow.settlement_amount || 0).toLocaleString()}
                </p>
                <p className="text-sm capitalize text-muted-foreground">Status: {caseRow.settlement_status}</p>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Initiate exit process</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Last working day</Label>
              <Input type="date" value={form.lastWorkingDay} onChange={(e) => setForm((f) => ({ ...f, lastWorkingDay: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["resignation", "retirement", "contract_end", "other"].map((r) => (
                    <SelectItem key={r} value={r} className="capitalize">{r.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Comments</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving || !form.lastWorkingDay} onClick={() => void initiate()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Exit interview</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Would you recommend this employer?</Label>
              <Select value={interview.wouldRecommend} onValueChange={(v) => setInterview((f) => ({ ...f, wouldRecommend: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea rows={4} value={interview.feedback} onChange={(e) => setInterview((f) => ({ ...f, feedback: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>Cancel</Button>
            <Button className="bg-teal-700 text-white hover:bg-teal-800" disabled={saving} onClick={() => void saveInterview()}>
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
