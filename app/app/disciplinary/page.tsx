"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AlertTriangle,
  Brain,
  Gavel,
  MessageSquare,
  Plus,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Overview = {
  cases: any[]
  grievances: any[]
  insights: any[]
  employees: { id: string; name: string; code: string; department: string }[]
  stats: {
    totalCases: number
    openCases: number
    investigating: number
    critical: number
    resolved: number
    totalGrievances: number
    openGrievances: number
    actionsIssued: number
  }
  charts: {
    byCategory: { category: string; count: number }[]
    bySeverity: { severity: string; count: number }[]
  }
}

const CHART = ["#0d9488", "#14b8a6", "#f59e0b", "#f97316", "#ef4444", "#64748b"]
const CATEGORIES = ["Misconduct", "Performance", "Attendance", "Policy Violation", "Harassment", "Safety"]
const ACTION_TYPES = [
  "verbal_warning",
  "written_warning",
  "final_warning",
  "suspension",
  "termination",
  "counseling",
  "training",
]

function sevBadge(s: string) {
  if (s === "critical") return "bg-rose-100 text-rose-800"
  if (s === "high" || s === "urgent") return "bg-orange-100 text-orange-800"
  if (s === "medium") return "bg-amber-100 text-amber-800"
  return "bg-slate-100 text-slate-700"
}

export default function DisciplinaryGrievancePage() {
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")

  const [caseOpen, setCaseOpen] = useState(false)
  const [grievOpen, setGrievOpen] = useState(false)
  const [actionOpen, setActionOpen] = useState(false)
  const [detail, setDetail] = useState<any | null>(null)

  const [caseForm, setCaseForm] = useState({
    employeeId: "",
    category: "Misconduct",
    severity: "medium",
    title: "",
    description: "",
    reportedBy: "",
    assignedTo: "",
    witnesses: "",
    dueDate: "",
  })
  const [grievForm, setGrievForm] = useState({
    employeeId: "",
    grievanceType: "Workplace",
    priority: "medium",
    title: "",
    description: "",
    desiredOutcome: "",
  })
  const [actionForm, setActionForm] = useState({
    caseId: "",
    actionType: "written_warning",
    description: "",
    issuedBy: "",
    followUpRequired: false,
    followUpDate: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/disciplinary", { credentials: "include", cache: "no-store" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed to load")
      setData(json as Overview)
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function postAction(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch("/api/disciplinary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Save failed")
      toast({ title: "Saved" })
      await load()
      return true
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Save failed", variant: "destructive" })
      return false
    } finally {
      setSaving(false)
    }
  }

  async function generateInsights() {
    setSaving(true)
    try {
      const res = await fetch("/api/disciplinary", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_insights" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Failed")
      toast({ title: `Generated ${json.generated ?? 0} AI insights` })
      await load()
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const filteredCases = useMemo(() => {
    return (data?.cases || []).filter((c) => {
      const q = search.toLowerCase()
      const match =
        !q ||
        String(c.title || "").toLowerCase().includes(q) ||
        String(c.employee_name || "").toLowerCase().includes(q) ||
        String(c.case_number || "").toLowerCase().includes(q)
      const st = statusFilter === "all" || c.status === statusFilter
      const sv = severityFilter === "all" || c.severity === severityFilter
      return match && st && sv
    })
  }, [data?.cases, search, statusFilter, severityFilter])

  const stats = data?.stats

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Employee relations</p>
          <h1 className="text-2xl font-bold text-slate-900">Disciplinary & Grievances</h1>
          <p className="text-sm text-muted-foreground">
            Case files, progressive discipline, and grievances — synced to the database with AI risk signals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="rounded-xl" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white hover:from-teal-800 hover:to-emerald-700"
            onClick={() => void generateInsights()}
            disabled={saving}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Generate AI insights
          </Button>
          <Button className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setCaseOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New case
          </Button>
          <Button variant="outline" className="rounded-xl border-teal-200" onClick={() => setGrievOpen(true)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            New grievance
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open cases", value: stats?.openCases ?? "—", icon: Gavel },
          { label: "Investigating", value: stats?.investigating ?? "—", icon: Search },
          { label: "Critical / high", value: stats?.critical ?? "—", icon: AlertTriangle },
          { label: "Open grievances", value: stats?.openGrievances ?? "—", icon: MessageSquare },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-teal-100/80 bg-gradient-to-br from-teal-50/60 to-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{card.label}</p>
              <card.icon className="h-4 w-4 text-teal-700" />
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{card.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 rounded-2xl bg-slate-100/80 p-1">
          {[
            ["overview", "Overview"],
            ["cases", "Disciplinary cases"],
            ["grievances", "Grievances"],
            ["insights", "AI Insights"],
            ["compliance", "Compliance"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-800">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Cases by category</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.byCategory || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {(data?.charts.byCategory || []).map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Severity mix</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.bySeverity || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="severity" tick={{ fontSize: 11 }} className="capitalize" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {(data?.insights || []).slice(0, 3).length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {(data?.insights || []).slice(0, 3).map((ins: any) => (
                <div key={ins.id} className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-teal-700" />
                    <Badge variant="outline" className="text-[10px] uppercase">{ins.insight_type}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{ins.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{ins.body}</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cases" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" placeholder="Search cases…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {["all", "open", "investigating", "hearing_scheduled", "resolved", "closed", "escalated"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                {["all", "low", "medium", "high", "critical"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                      No disciplinary cases yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCases.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.title}</div>
                        <div className="text-xs text-muted-foreground">{c.case_number || c.id.slice(0, 8)}</div>
                      </TableCell>
                      <TableCell>{c.employee_name || "—"}</TableCell>
                      <TableCell>{c.category}</TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", sevBadge(c.severity))}>
                          {c.severity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{String(c.status).replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums">{(c.actions || []).length}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(c)}>View</Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActionForm((f) => ({ ...f, caseId: c.id }))
                              setActionOpen(true)
                            }}
                          >
                            Action
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => void postAction({ action: "delete", entity: "case", id: c.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="grievances" className="space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.grievances || []).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No grievances filed.</TableCell>
                  </TableRow>
                ) : (
                  (data?.grievances || []).map((g: any) => (
                    <TableRow key={g.id}>
                      <TableCell className="font-medium">{g.title || g.subject}</TableCell>
                      <TableCell>{g.employee_name || "—"}</TableCell>
                      <TableCell>{g.grievance_type}</TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", sevBadge(g.priority))}>
                          {g.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{String(g.status).replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Select
                            value={g.status === "filed" ? "submitted" : g.status}
                            onValueChange={(v) =>
                              void postAction({ action: "update_status", entity: "grievance", id: g.id, status: v })
                            }
                          >
                            <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {["submitted", "acknowledged", "investigating", "mediation", "hearing", "resolved", "closed"].map((s) => (
                                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => void postAction({ action: "delete", entity: "grievance", id: g.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-teal-700 p-2 text-white"><Brain className="h-5 w-5" /></div>
              <div>
                <p className="font-semibold">AI / ML employee-relations insights</p>
                <p className="text-sm text-muted-foreground">
                  Detects repeat offenders, stalled cases, urgent grievances, and category patterns from live case data.
                </p>
              </div>
            </div>
            <Button className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => void generateInsights()} disabled={saving}>
              <Sparkles className="mr-2 h-4 w-4" /> Run analysis
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {(data?.insights || []).length === 0 ? (
              <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
                No insights yet — click Run analysis.
              </div>
            ) : (
              (data?.insights || []).map((ins: any) => (
                <div key={ins.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <Badge variant="outline" className="capitalize">{ins.insight_type?.replace(/_/g, " ")}</Badge>
                    {ins.confidence != null && (
                      <span className="text-xs text-muted-foreground">{Math.round(Number(ins.confidence) * 100)}% conf.</span>
                    )}
                  </div>
                  <p className="font-semibold">{ins.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ins.body}</p>
                  {ins.employee_name && <p className="mt-2 text-xs font-medium text-teal-800">{ins.employee_name}</p>}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Fair hearing", act: "Labour Act §61", pct: stats?.openCases ? 85 : 100 },
              { title: "Grounds documented", act: "Labour Act §62", pct: 100 },
              { title: "Progressive discipline", act: "Labour Act §63", pct: stats?.actionsIssued ? 90 : 100 },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Scale className="h-4 w-4 text-teal-700" />
                  <p className="font-semibold">{card.title}</p>
                </div>
                <p className="text-xs text-muted-foreground">{card.act}</p>
                <Progress value={card.pct} className="mt-3 h-2" />
                <p className="mt-1 text-right text-xs tabular-nums text-teal-800">{card.pct}%</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-4 text-sm text-muted-foreground">
            Cases and actions are stored in <code className="text-xs">disciplinary_cases</code> /{" "}
            <code className="text-xs">disciplinary_actions</code> and feed HR formula metrics (disciplinary rate).
            Grievances write to <code className="text-xs">grievances</code> for grievance rate / resolution analytics.
          </div>
        </TabsContent>
      </Tabs>

      {/* New case */}
      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>New disciplinary case</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select value={caseForm.employeeId} onValueChange={(v) => setCaseForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(data?.employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={caseForm.category} onValueChange={(v) => setCaseForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Severity</Label>
              <Select value={caseForm.severity} onValueChange={(v) => setCaseForm((f) => ({ ...f, severity: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((s) => (
                    <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={caseForm.title} onChange={(e) => setCaseForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={caseForm.description} onChange={(e) => setCaseForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reported by</Label>
              <Input value={caseForm.reportedBy} onChange={(e) => setCaseForm((f) => ({ ...f, reportedBy: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Assigned to</Label>
              <Input value={caseForm.assignedTo} onChange={(e) => setCaseForm((f) => ({ ...f, assignedTo: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={caseForm.dueDate} onChange={(e) => setCaseForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Witnesses (comma-separated)</Label>
              <Input value={caseForm.witnesses} onChange={(e) => setCaseForm((f) => ({ ...f, witnesses: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaseOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !caseForm.employeeId || !caseForm.title}
              onClick={async () => {
                const ok = await postAction({ action: "case", ...caseForm })
                if (ok) setCaseOpen(false)
              }}
            >
              Open case
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grievance */}
      <Dialog open={grievOpen} onOpenChange={setGrievOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>File grievance</DialogTitle></DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select value={grievForm.employeeId} onValueChange={(v) => setGrievForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {(data?.employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={grievForm.grievanceType} onValueChange={(v) => setGrievForm((f) => ({ ...f, grievanceType: v }))}>
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
              <Select value={grievForm.priority} onValueChange={(v) => setGrievForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "urgent"].map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={grievForm.title} onChange={(e) => setGrievForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={grievForm.description} onChange={(e) => setGrievForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Desired outcome</Label>
              <Input value={grievForm.desiredOutcome} onChange={(e) => setGrievForm((f) => ({ ...f, desiredOutcome: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrievOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !grievForm.title}
              onClick={async () => {
                const ok = await postAction({ action: "grievance", ...grievForm })
                if (ok) setGrievOpen(false)
              }}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add action */}
      <Dialog open={actionOpen} onOpenChange={setActionOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Issue disciplinary action</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Action type</Label>
              <Select value={actionForm.actionType} onValueChange={(v) => setActionForm((f) => ({ ...f, actionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={actionForm.description} onChange={(e) => setActionForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Issued by</Label>
              <Input value={actionForm.issuedBy} onChange={(e) => setActionForm((f) => ({ ...f, issuedBy: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Follow-up date</Label>
              <Input type="date" value={actionForm.followUpDate} onChange={(e) => setActionForm((f) => ({ ...f, followUpDate: e.target.value, followUpRequired: !!e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !actionForm.caseId}
              onClick={async () => {
                const ok = await postAction({
                  action: "action",
                  caseId: actionForm.caseId,
                  actionType: actionForm.actionType,
                  description: actionForm.description,
                  issuedBy: actionForm.issuedBy,
                  followUpRequired: actionForm.followUpRequired,
                  followUpDate: actionForm.followUpDate || null,
                  labourActRef: "Ghana Labour Act 2003 §62",
                })
                if (ok) setActionOpen(false)
              }}
            >
              Issue action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-3 text-sm">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="capitalize">{String(detail.status).replace(/_/g, " ")}</Badge>
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", sevBadge(detail.severity))}>
                  {detail.severity}
                </span>
                <Badge variant="secondary">{detail.category}</Badge>
              </div>
              <p className="text-muted-foreground">{detail.description}</p>
              <p><span className="font-medium">Employee:</span> {detail.employee_name}</p>
              <p><span className="font-medium">Reported by:</span> {detail.reported_by || "—"}</p>
              <p><span className="font-medium">Assigned:</span> {detail.assigned_to || "—"}</p>
              {detail.witnesses?.length > 0 && (
                <p><span className="font-medium">Witnesses:</span> {detail.witnesses.join(", ")}</p>
              )}
              <div>
                <p className="mb-2 font-medium">Action history</p>
                {(detail.actions || []).length === 0 ? (
                  <p className="text-muted-foreground">No actions yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {(detail.actions || []).map((a: any) => (
                      <li key={a.id} className="rounded-xl border p-2">
                        <p className="font-medium capitalize">{String(a.action_type).replace(/_/g, " ")}</p>
                        <p className="text-xs text-muted-foreground">{a.description || a.notes}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2">
                <Select
                  value={detail.status}
                  onValueChange={async (v) => {
                    await postAction({ action: "update_status", entity: "case", id: detail.id, status: v })
                    setDetail(null)
                  }}
                >
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Update status" /></SelectTrigger>
                  <SelectContent>
                    {["open", "investigating", "hearing_scheduled", "resolved", "closed", "escalated"].map((s) => (
                      <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setActionForm((f) => ({ ...f, caseId: detail.id }))
                    setDetail(null)
                    setActionOpen(true)
                  }}
                >
                  Add action
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
