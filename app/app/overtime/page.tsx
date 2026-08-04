"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import useSWR, { mutate } from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Search,
  Loader2,
  Timer,
  FileBarChart2,
  ArrowRight,
  RefreshCw,
  Download,
  Wallet,
} from "lucide-react"

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  pending_payroll: "bg-amber-100 text-amber-900",
  synced: "bg-sky-100 text-sky-800",
  paid: "bg-emerald-100 text-emerald-800",
  excluded: "bg-slate-100 text-slate-600",
}

const fetcher = (url: string) => fetch(url, { credentials: "include", cache: "no-store" }).then((r) => r.json())

function currentPeriod() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function money(n: number) {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS", maximumFractionDigits: 2 }).format(
    Number(n || 0),
  )
}

export default function AdminOvertimePage() {
  const { toast } = useToast()
  const [search, setSearch] = useState("")
  const [tab, setTab] = useState("pending")
  const [mainTab, setMainTab] = useState("requests")
  const [actioning, setActioning] = useState<string | null>(null)
  const [rejectDialog, setRejectDialog] = useState<{ id: string; name: string } | null>(null)
  const [rejectReason, setRejectReason] = useState("")
  const [generating, setGenerating] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [otFrom, setOtFrom] = useState(() => new Date().toISOString().slice(0, 10))
  const [otTo, setOtTo] = useState(() => new Date().toISOString().slice(0, 10))
  const [reportPeriod, setReportPeriod] = useState(currentPeriod)
  const [report, setReport] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const { data, isLoading } = useSWR("/api/overtime", fetcher)
  const allRequests: any[] = data?.requests ?? []

  const filtered = allRequests.filter((r) => {
    const matchesTab = tab === "all" || r.status === tab
    const q = search.toLowerCase()
    const matchesSearch = !q || r.employee_name?.toLowerCase().includes(q) || r.date?.includes(q)
    return matchesTab && matchesSearch
  })

  const counts = {
    pending: allRequests.filter((r) => r.status === "pending").length,
    approved: allRequests.filter((r) => r.status === "approved").length,
    rejected: allRequests.filter((r) => r.status === "rejected").length,
  }

  const loadReport = useCallback(async () => {
    setReportLoading(true)
    try {
      const res = await fetch(`/api/overtime/reports/monthly?period=${encodeURIComponent(reportPeriod)}`, {
        credentials: "include",
        cache: "no-store",
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load report")
      setReport(json)
    } catch (err: any) {
      toast({ title: "Report failed", description: err.message, variant: "destructive" })
    } finally {
      setReportLoading(false)
    }
  }, [reportPeriod, toast])

  useEffect(() => {
    if (mainTab === "report" || mainTab === "process") void loadReport()
  }, [mainTab, loadReport])

  const handleApprove = async (id: string) => {
    setActioning(id)
    try {
      const res = await fetch(`/api/overtime/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ action: "approve" }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || "Failed")
      const earned = json.earnings?.amount
      toast({
        title: "Approved",
        description:
          earned != null
            ? `Queued ${money(earned)} for ${json.earnings?.payPeriod || "month-end"} payroll.`
            : "Overtime approved and queued for month-end payroll.",
      })
      mutate("/api/overtime")
      if (mainTab === "report") void loadReport()
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
        credentials: "include",
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

  const generateFromAttendance = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/attendance/generate-overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ from: otFrom, to: otTo }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to generate")
      toast({
        title: "Overtime generated from attendance",
        description: `Created ${json.created || 0}; skipped ${json.skipped || 0}.`,
      })
      mutate("/api/overtime")
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
    } finally {
      setGenerating(false)
    }
  }

  const syncToPayroll = async () => {
    setSyncing(true)
    try {
      const res = await fetch("/api/overtime/sync-payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ period: reportPeriod, overwrite: true }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Sync failed")
      toast({
        title: "Synced to pay inputs",
        description: `${json.employees_synced || 0} employee(s) · ${money(json.total_amount || 0)} OT.`,
      })
      void loadReport()
      mutate("/api/overtime")
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" })
    } finally {
      setSyncing(false)
    }
  }

  const exportReportCsv = () => {
    if (!report?.employees?.length) return
    const headers = [
      "Employee",
      "Code",
      "Department",
      "Period",
      "Total Hours",
      "Total Amount",
      "Pending Payroll",
      "Synced Amount",
      "Date",
      "Line Hours",
      "Line Amount",
      "Multiplier",
      "Payroll Status",
    ]
    const rows: string[][] = []
    for (const emp of report.employees) {
      if (!emp.lines?.length) {
        rows.push([
          emp.employee_name,
          emp.employee_code || "",
          emp.department || "",
          emp.period,
          emp.total_hours,
          emp.total_amount,
          emp.pending_payroll_amount,
          emp.synced_amount,
          "",
          "",
          "",
          "",
          "",
        ])
        continue
      }
      for (const line of emp.lines) {
        rows.push([
          emp.employee_name,
          emp.employee_code || "",
          emp.department || "",
          emp.period,
          emp.total_hours,
          emp.total_amount,
          emp.pending_payroll_amount,
          emp.synced_amount,
          line.date,
          line.hours,
          line.amount_earned,
          line.multiplier_used,
          line.payroll_status,
        ])
      }
    }
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
    a.download = `overtime-report-${reportPeriod}.csv`
    a.click()
  }

  const processSteps = useMemo(
    () => [
      {
        title: "1. Capture hours",
        body: "Attendance OT hours or a manual request create a pending overtime_requests row (company-scoped).",
      },
      {
        title: "2. Approve",
        body: "HR/manager approves. System calculates amount = hours × hourly rate × multiplier, sets pay_period and payroll_status = pending_payroll.",
      },
      {
        title: "3. Month-end sync",
        body: "Sync approved OT into payroll_pay_inputs.overtime_amount for the period. Review under Payroll → Pay Inputs.",
      },
      {
        title: "4. Process payroll",
        body: "Payroll run includes overtime_pay on the payslip. Employee earns OT with salary at month-end.",
      },
      {
        title: "5. Report & audit",
        body: "Monthly employee OT statement lists every approved line, hours, rates, and sync status for the company only.",
      },
    ],
    [],
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Overtime Management</h1>
          <p className="text-sm text-muted-foreground">
            Approve overtime, queue earnings for month-end payroll, and issue employee OT statements.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="w-36" value={otFrom} onChange={(e) => setOtFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="w-36" value={otTo} onChange={(e) => setOtTo(e.target.value)} />
          </div>
          <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void generateFromAttendance()} disabled={generating}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Timer className="mr-2 h-4 w-4" />}
            From attendance
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <AlertCircle className="h-7 w-7 text-yellow-500" />
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{counts.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <CheckCircle2 className="h-7 w-7 text-green-500" />
            <div>
              <p className="text-xs text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{counts.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-5 pb-4">
            <XCircle className="h-7 w-7 text-red-500" />
            <div>
              <p className="text-xs text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{counts.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="report">
            <FileBarChart2 className="mr-1.5 h-3.5 w-3.5" />
            Monthly report
          </TabsTrigger>
          <TabsTrigger value="process">Process flow</TabsTrigger>
        </TabsList>

        <TabsContent value="requests">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>All Requests</CardTitle>
                <CardDescription>Approve to calculate earnings and queue for month-end pay.</CardDescription>
              </div>
              <div className="relative w-56">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employee or date…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
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

                {["pending", "approved", "rejected", "all"].map((tabVal) => (
                  <TabsContent key={tabVal} value={tabVal}>
                    {isLoading && (
                      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                      </div>
                    )}
                    {!isLoading && filtered.length === 0 && (
                      <div className="py-10 text-center text-muted-foreground">
                        <Clock className="mx-auto mb-2 h-8 w-8 opacity-30" />
                        <p>No {tabVal === "all" ? "" : tabVal} requests found.</p>
                      </div>
                    )}
                    <div className="divide-y">
                      {filtered.map((req: any) => (
                        <div key={req.id} className="flex items-center justify-between gap-4 py-4">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{req.employee_name || "Employee"}</p>
                            <p className="text-xs text-muted-foreground">
                              {req.date} &bull; {req.hours ?? req.hours_requested}h &bull;{" "}
                              <span className="capitalize">{req.overtime_type || req.rate_type || "ot"}</span>
                              {req.amount_earned != null ? ` · ${money(req.amount_earned)}` : ""}
                            </p>
                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{req.reason}</p>
                            {req.payroll_status && req.status === "approved" && (
                              <Badge className={`mt-1 ${STATUS_COLORS[req.payroll_status] || STATUS_COLORS.pending_payroll}`}>
                                {String(req.payroll_status).replace(/_/g, " ")}
                              </Badge>
                            )}
                            {req.rejection_reason && (
                              <p className="mt-0.5 text-xs text-red-600">Reason: {req.rejection_reason}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge className={STATUS_COLORS[req.status] || "bg-gray-100 text-gray-700"}>{req.status}</Badge>
                            {req.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-green-300 text-green-700 hover:bg-green-50"
                                  disabled={actioning === req.id}
                                  onClick={() => handleApprove(req.id)}
                                >
                                  {actioning === req.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-300 text-red-700 hover:bg-red-50"
                                  disabled={actioning === req.id}
                                  onClick={() => setRejectDialog({ id: req.id, name: req.employee_name || "Employee" })}
                                >
                                  <XCircle className="mr-1 h-3.5 w-3.5" />
                                  Reject
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
        </TabsContent>

        <TabsContent value="report" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <CardTitle>Monthly overtime earnings</CardTitle>
                <CardDescription>
                  Per-employee statement of approved OT for the selected month (this company only).
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div>
                  <Label className="text-xs">Period</Label>
                  <Input
                    type="month"
                    className="w-40"
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={() => void loadReport()} disabled={reportLoading}>
                  {reportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                  Refresh
                </Button>
                <Button variant="outline" onClick={exportReportCsv} disabled={!report?.employees?.length}>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => void syncToPayroll()} disabled={syncing}>
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                  Sync to Pay Inputs
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Employees with OT</p>
                  <p className="text-xl font-semibold">{report?.employee_count ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total hours</p>
                  <p className="text-xl font-semibold">{report?.total_hours ?? "—"}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Total earned</p>
                  <p className="text-xl font-semibold">{report ? money(report.total_amount) : "—"}</p>
                </div>
              </div>

              {reportLoading ? (
                <div className="flex items-center gap-2 py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading report…
                </div>
              ) : !report?.employees?.length ? (
                <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                  No approved overtime for {reportPeriod}. Approve requests first, then sync.
                </div>
              ) : (
                <div className="divide-y rounded-xl border">
                  {report.employees.map((emp: any) => (
                    <div key={emp.employee_id} className="p-4">
                      <button
                        type="button"
                        className="flex w-full items-start justify-between gap-3 text-left"
                        onClick={() => setExpanded(expanded === emp.employee_id ? null : emp.employee_id)}
                      >
                        <div>
                          <p className="font-medium">{emp.employee_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.employee_code || "—"} · {emp.department || "No dept"} · {emp.lines.length} line(s)
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold">{money(emp.total_amount)}</p>
                          <p className="text-xs text-muted-foreground">{emp.total_hours}h</p>
                          {emp.pending_payroll_amount > 0 && (
                            <p className="text-xs text-amber-700">{money(emp.pending_payroll_amount)} pending sync</p>
                          )}
                        </div>
                      </button>
                      {expanded === emp.employee_id && (
                        <div className="mt-3 overflow-x-auto rounded-lg border bg-muted/20">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="px-3 py-2">Date</th>
                                <th className="px-3 py-2">Hours</th>
                                <th className="px-3 py-2">Rate</th>
                                <th className="px-3 py-2">×</th>
                                <th className="px-3 py-2">Earned</th>
                                <th className="px-3 py-2">Payroll</th>
                              </tr>
                            </thead>
                            <tbody>
                              {emp.lines.map((line: any) => (
                                <tr key={line.id} className="border-b last:border-0">
                                  <td className="px-3 py-2">{line.date}</td>
                                  <td className="px-3 py-2">{line.hours}</td>
                                  <td className="px-3 py-2">{money(line.hourly_rate_used)}</td>
                                  <td className="px-3 py-2">{line.multiplier_used || "—"}</td>
                                  <td className="px-3 py-2 font-medium">{money(line.amount_earned)}</td>
                                  <td className="px-3 py-2 capitalize">{String(line.payroll_status || "").replace(/_/g, " ")}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/payroll/input">
                    Open Pay Inputs
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link href="/app/payroll">
                    Process payroll
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="process" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overtime → earnings process</CardTitle>
              <CardDescription>
                What happens after approval, and how the employee gets paid at month-end. All data is isolated by{" "}
                <code className="text-xs">company_id</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {processSteps.map((step) => (
                  <div key={step.title} className="rounded-xl border p-4">
                    <p className="font-semibold text-sm">{step.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-2">
                <p className="font-medium">Calculation</p>
                <p className="text-muted-foreground">
                  <strong>Hourly rate</strong> = monthly basic salary ÷ 173.33
                  <br />
                  <strong>Earned amount</strong> = approved hours × hourly rate × multiplier (weekday 1.5× / weekend 2.0×,
                  from <code>overtime_rates</code> or employee financial rates)
                </p>
                <p className="font-medium pt-2">Database routing</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                  <li>
                    <code>overtime_requests</code> — capture, approve, amount_earned, pay_period, payroll_status
                  </li>
                  <li>
                    <code>payroll_pay_inputs.overtime_amount</code> — month-end sync target (unique per company + employee +
                    period)
                  </li>
                  <li>
                    <code>payroll_items</code> / payslips — <code>overtime_pay</code> during payroll process
                  </li>
                  <li>Every API uses <code>resolveTenantContext</code> and filters by <code>company_id</code></li>
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => setMainTab("report")}>
                  Go to monthly report
                </Button>
                <Button variant="outline" onClick={() => void syncToPayroll()} disabled={syncing}>
                  {syncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wallet className="mr-2 h-4 w-4" />}
                  Sync {reportPeriod} to payroll
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!rejectDialog}
        onOpenChange={(open) => {
          if (!open) {
            setRejectDialog(null)
            setRejectReason("")
          }
        }}
      >
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
              <Textarea
                rows={3}
                placeholder="Explain why this request is being rejected…"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialog(null)
                setRejectReason("")
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" disabled={!!actioning} onClick={handleReject}>
              {actioning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
