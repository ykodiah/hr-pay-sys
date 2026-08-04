"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Users,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/hooks/use-toast"

export default function ManagerApprovalsPage() {
  const [tab, setTab] = useState("leave")
  const [status, setStatus] = useState("pending")
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [leave, setLeave] = useState<any[]>([])
  const [overtime, setOvertime] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [manager, setManager] = useState<any>(null)
  const [scoped, setScoped] = useState(false)

  const loadTeam = useCallback(async () => {
    try {
      const res = await fetch("/api/manager/team", { credentials: "include", cache: "no-store" })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setTeam(data.team || [])
        setManager(data.manager)
      }
    } catch {
      /* ignore */
    }
  }, [])

  const loadApprovals = useCallback(async () => {
    setLoading(true)
    try {
      const [lRes, oRes] = await Promise.all([
        fetch(`/api/manager/approvals?type=leave&status=${status}`, {
          credentials: "include",
          cache: "no-store",
        }),
        fetch(`/api/manager/approvals?type=overtime&status=${status}`, {
          credentials: "include",
          cache: "no-store",
        }),
      ])
      const lData = await lRes.json().catch(() => ({}))
      const oData = await oRes.json().catch(() => ({}))
      if (!lRes.ok) throw new Error(lData.error || "Failed to load leave")
      if (!oRes.ok) throw new Error(oData.error || "Failed to load overtime")
      setLeave(lData.requests || [])
      setOvertime(oData.requests || [])
      setManager(lData.manager || oData.manager || null)
      setScoped(Boolean(lData.scoped || oData.scoped))
    } catch (e: any) {
      toast({ title: "Load failed", description: e.message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void loadTeam()
  }, [loadTeam])

  useEffect(() => {
    void loadApprovals()
  }, [loadApprovals])

  async function act(type: "leave" | "overtime", id: string, action: "approve" | "reject") {
    setBusyId(id)
    try {
      const res = await fetch("/api/manager/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type, id, action }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Action failed")
      toast({
        title: action === "approve" ? "Approved" : "Rejected",
        description:
          type === "leave"
            ? action === "approve"
              ? "Leave approved — attendance & payroll synced"
              : "Leave rejected"
            : action === "approve"
              ? "OT approved — earnings synced to pay inputs"
              : "OT rejected",
      })
      await loadApprovals()
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 h-8 px-2 text-muted-foreground">
            <Link href="/app/attendance">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Manager approvals</h1>
            <p className="text-sm text-muted-foreground">
              Self-service leave & overtime for your team only
              {manager
                ? ` — ${manager.first_name || ""} ${manager.last_name || ""}`.trim()
                : " — team scoped by supervisor / dept head"}
              {scoped ? "" : " (showing company queue if you have no direct reports linked)"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => void loadApprovals()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          <div className="flex rounded-md border overflow-hidden">
            {["pending", "approved", "rejected", "all"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs capitalize ${
                  status === s ? "bg-teal-600 text-white" : "bg-white hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Team size</p>
              <p className="text-xl font-semibold">{team.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending leave</p>
              <p className="text-xl font-semibold">
                {leave.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending OT</p>
              <p className="text-xl font-semibold">
                {overtime.filter((r) => r.status === "pending").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="leave">Leave ({leave.length})</TabsTrigger>
          <TabsTrigger value="overtime">Overtime ({overtime.length})</TabsTrigger>
          <TabsTrigger value="team">My team ({team.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="leave" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team leave requests</CardTitle>
              <CardDescription>Approve only employees you supervise or head</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : leave.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Days</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leave.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.employee_name || "—"}</TableCell>
                          <TableCell>{r.leave_type_name || "—"}</TableCell>
                          <TableCell className="text-xs whitespace-nowrap">
                            {r.start_date} → {r.end_date}
                          </TableCell>
                          <TableCell>{r.days_requested}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.status === "pending" ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="bg-teal-600 hover:bg-teal-700 h-8"
                                  disabled={busyId === r.id}
                                  onClick={() => void act("leave", r.id, "approve")}
                                >
                                  {busyId === r.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-red-700"
                                  disabled={busyId === r.id}
                                  onClick={() => void act("leave", r.id, "reject")}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No leave requests in this filter.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overtime" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team overtime requests</CardTitle>
              <CardDescription>Approve OT — earnings flow into payroll pay inputs</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-2 py-10 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : overtime.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Employee</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overtime.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell>{r.employee_name || "—"}</TableCell>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.hours ?? r.hours_requested}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {r.status === "pending" ? (
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  className="bg-teal-600 hover:bg-teal-700 h-8"
                                  disabled={busyId === r.id}
                                  onClick={() => void act("overtime", r.id, "approve")}
                                >
                                  {busyId === r.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-red-700"
                                  disabled={busyId === r.id}
                                  onClick={() => void act("overtime", r.id, "reject")}
                                >
                                  <XCircle className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">No overtime requests in this filter.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Team roster</CardTitle>
              <CardDescription>Direct reports + department headship</CardDescription>
            </CardHeader>
            <CardContent>
              {team.length ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            {`${e.first_name || ""} ${e.last_name || ""}`.trim()}
                          </TableCell>
                          <TableCell>{e.employee_id}</TableCell>
                          <TableCell>{e.department || "—"}</TableCell>
                          <TableCell>{e.position || "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{e.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No team linked. Set direct_supervisor or head_of_department on employees / departments.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
