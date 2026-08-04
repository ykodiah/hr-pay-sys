"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Eye,
  FileSearch,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

const TYPE_TONE: Record<string, string> = {
  update: "bg-sky-100 text-sky-900",
  transfer: "bg-violet-100 text-violet-900",
  reverse: "bg-amber-100 text-amber-900",
  deactivate: "bg-red-100 text-red-800",
  create: "bg-emerald-100 text-emerald-900",
}

export default function EmployeeAuditPage() {
  const [events, setEvents] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [employeeId, setEmployeeId] = useState("all")
  const [eventType, setEventType] = useState("all")
  const [search, setSearch] = useState("")

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [reverseOpen, setReverseOpen] = useState(false)
  const [reverseReason, setReverseReason] = useState("")
  const [reversing, setReversing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ limit: "80" })
      if (employeeId !== "all") qs.set("employee_id", employeeId)
      if (eventType !== "all") qs.set("event_type", eventType)
      const [aRes, eRes] = await Promise.all([
        fetch(`/api/employees/audit?${qs}`, { credentials: "include", cache: "no-store" }),
        fetch("/api/employees?status=active&limit=500", { credentials: "include", cache: "no-store" }),
      ])
      const aData = await aRes.json().catch(() => ({}))
      const eData = await eRes.json().catch(() => ({}))
      if (!aRes.ok) throw new Error(aData.error || "Failed to load audit")
      setEvents(aData.events || [])
      setEmployees(eData.employees || eData.data || [])
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [employeeId, eventType])

  useEffect(() => {
    void load()
  }, [load])

  async function openDetail(id: string) {
    setDetailOpen(true)
    setDetailLoading(true)
    setDetail(null)
    try {
      const res = await fetch(`/api/employees/audit?id=${id}`, {
        credentials: "include",
        cache: "no-store",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Failed to load event")
      setDetail(data.event)
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
      setDetailOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  async function doReverse() {
    if (!detail?.id || !reverseReason.trim()) return
    setReversing(true)
    try {
      const res = await fetch("/api/employees/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "reverse",
          event_id: detail.id,
          reason: reverseReason,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Reverse failed")
      toast({
        title: "Change reversed",
        description: "A compensating update was written and logged in the audit trail.",
      })
      setReverseOpen(false)
      setReverseReason("")
      setDetailOpen(false)
      await load()
    } catch (e: any) {
      toast({ title: "Reverse failed", description: e.message, variant: "destructive" })
    } finally {
      setReversing(false)
    }
  }

  const filtered = events.filter((e) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return `${e.employee_name || ""} ${e.actor_name || ""} ${e.summary || ""} ${e.reason || ""}`
      .toLowerCase()
      .includes(q)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
            <Link href="/app/employees">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Employees
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <FileSearch className="h-6 w-6 text-teal-700" />
              Employee Audit Trail
            </h1>
            <p className="text-sm text-muted-foreground">
              Every update, transfer, and reversal — who changed what. Zoom in for exact before/after values.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/employees/update">Update data</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/employees/transfer">Transfer</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search actor, employee, reason…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Employee</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger className="w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All employees</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.display_name || e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Event type</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="transfer">Transfer</SelectItem>
                <SelectItem value="reverse">Reverse</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Events</CardTitle>
          <CardDescription>Append-only history from the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading audit trail…
            </div>
          ) : filtered.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>When</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {e.created_at ? new Date(e.created_at).toLocaleString() : "—"}
                        {e.reversed_at ? (
                          <Badge className="ml-1 bg-amber-100 text-amber-900 text-[10px]">Reversed</Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-sm">{e.employee_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{e.employee_code}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`capitalize ${TYPE_TONE[e.event_type] || "bg-slate-100"}`}>
                          {e.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{e.actor_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{e.actor_role || e.source}</p>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-sm">{e.summary || e.reason}</TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => void openDetail(e.id)}>
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Zoom in
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No audit events yet. Updates and transfers will appear here after you run SQL script 105.
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Change detail</DialogTitle>
          </DialogHeader>
          {detailLoading || !detail ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Employee</p>
                  <p className="font-medium">{detail.employee_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Actor</p>
                  <p className="font-medium">{detail.actor_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {detail.actor_email} · {detail.actor_role || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">When</p>
                  <p>{detail.created_at ? new Date(detail.created_at).toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type / source</p>
                  <p className="capitalize">
                    {detail.event_type} · {detail.source}
                  </p>
                </div>
              </div>
              {detail.reason ? (
                <div className="rounded-md bg-slate-50 px-3 py-2 text-sm">
                  <p className="text-xs text-muted-foreground">Reason</p>
                  <p>{detail.reason}</p>
                </div>
              ) : null}

              <div className="rounded-lg border overflow-hidden">
                <div className="grid grid-cols-3 gap-2 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
                  <span>Field</span>
                  <span>Before</span>
                  <span>After</span>
                </div>
                {(detail.diffs || []).length ? (
                  (detail.diffs || []).map((d: any) => (
                    <div key={d.id} className="grid grid-cols-3 gap-2 border-t px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium">{d.field_label || d.field_name}</p>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {d.sensitivity}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground break-all">{d.old_value ?? "—"}</p>
                      <p className="text-teal-800 font-medium break-all">{d.new_value ?? "—"}</p>
                    </div>
                  ))
                ) : (
                  <p className="px-3 py-6 text-center text-sm text-muted-foreground">No field diffs</p>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            {detail && !detail.reversed_at && detail.event_type !== "reverse" ? (
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={() => {
                  setReverseReason("")
                  setReverseOpen(true)
                }}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse change
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reverseOpen} onOpenChange={setReverseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverse this change</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Restores previous field values as a new audited event. Hard/org changes require Admin. History is never
            deleted.
          </p>
          <div>
            <Label>Reason for reversal *</Label>
            <Textarea
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="e.g. Applied to wrong employee — restoring prior values"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverseOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={reversing || !reverseReason.trim()}
              onClick={() => void doReverse()}
            >
              {reversing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Confirm reverse
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
