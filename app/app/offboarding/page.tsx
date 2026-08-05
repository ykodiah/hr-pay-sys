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
  Brain,
  CheckCircle2,
  Clock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Wallet,
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
  PieChart,
  Pie,
} from "recharts"
import { toast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Overview = {
  cases: any[]
  assets: any[]
  interviews: any[]
  insights: any[]
  employees: { id: string; name: string; code: string; department: string; position: string }[]
  stats: {
    activeCases: number
    completedCases: number
    pendingAssets: number
    pendingSettlements: number
    avgProcessDays: number
    totalCases: number
  }
  charts: {
    byReason: { reason: string; count: number }[]
    statusMix: { status: string; count: number }[]
  }
}

const CHART = ["#0d9488", "#14b8a6", "#f59e0b", "#f97316", "#64748b", "#ef4444"]
const REASONS = [
  { value: "resignation", label: "Resignation" },
  { value: "termination", label: "Termination" },
  { value: "retirement", label: "Retirement" },
  { value: "contract_end", label: "Contract end" },
  { value: "other", label: "Other" },
]

function statusTone(s: string) {
  if (s === "completed") return "bg-emerald-100 text-emerald-800"
  if (s === "in_progress") return "bg-sky-100 text-sky-800"
  if (s === "cancelled") return "bg-slate-100 text-slate-600"
  return "bg-amber-100 text-amber-800"
}

export default function OffboardingPage() {
  const [tab, setTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [caseOpen, setCaseOpen] = useState(false)
  const [detail, setDetail] = useState<any | null>(null)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [interviewCaseId, setInterviewCaseId] = useState("")
  const [interviewForm, setInterviewForm] = useState({
    feedback: "",
    interviewer: "",
    wouldRecommend: "true",
    rehireEligible: "true",
  })
  const [form, setForm] = useState({
    employeeId: "",
    lastWorkingDay: "",
    reason: "resignation",
    notes: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/offboarding", { credentials: "include", cache: "no-store" })
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
      const res = await fetch("/api/offboarding", {
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
      const res = await fetch("/api/offboarding", {
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

  const filtered = useMemo(() => {
    return (data?.cases || []).filter((c) => {
      const q = search.toLowerCase()
      const match =
        !q ||
        String(c.employee_name || "").toLowerCase().includes(q) ||
        String(c.employee_code || "").toLowerCase().includes(q) ||
        String(c.case_number || "").toLowerCase().includes(q)
      const st = statusFilter === "all" || c.status === statusFilter
      return match && st
    })
  }, [data?.cases, search, statusFilter])

  const stats = data?.stats
  const activeAssets = (data?.assets || []).filter((a) => {
    const parent = (data?.cases || []).find((c) => c.id === a.case_id)
    return parent && ["initiated", "in_progress"].includes(parent.status)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Lifecycle</p>
          <h1 className="text-2xl font-bold text-slate-900">Offboarding</h1>
          <p className="text-sm text-muted-foreground">
            Exit cases, interviews, assets, and settlements — database-backed with AI attrition signals.
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
            Initiate offboarding
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active cases", value: stats?.activeCases ?? "—", icon: LogOut },
          { label: "Completed", value: stats?.completedCases ?? "—", icon: CheckCircle2 },
          { label: "Pending assets", value: stats?.pendingAssets ?? "—", icon: Package },
          { label: "Avg process days", value: stats?.avgProcessDays ?? "—", icon: Clock },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-teal-100/80 bg-gradient-to-br from-teal-50/50 to-white p-4 shadow-sm">
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
            ["cases", "Cases"],
            ["interviews", "Exit interviews"],
            ["assets", "Assets"],
            ["settlements", "Settlements"],
            ["insights", "AI Insights"],
          ].map(([v, l]) => (
            <TabsTrigger key={v} value={v} className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-800">
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Exit reasons</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.charts.byReason || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="reason" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {(data?.charts.byReason || []).map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-sm font-semibold">Status mix</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(data?.charts.statusMix || []).filter((s) => s.count > 0)}
                      dataKey="count"
                      nameKey="status"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {(data?.charts.statusMix || []).filter((s) => s.count > 0).map((_, i) => (
                        <Cell key={i} fill={CHART[i % CHART.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          {(data?.insights || []).slice(0, 3).length > 0 && (
            <div className="grid gap-3 md:grid-cols-3">
              {(data?.insights || []).slice(0, 3).map((ins: any) => (
                <div key={ins.id} className="rounded-2xl border border-teal-100 bg-gradient-to-br from-white to-teal-50/40 p-4">
                  <Badge variant="outline" className="mb-2 text-[10px] uppercase">{ins.insight_type}</Badge>
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
              <Input className="pl-8" placeholder="Search employees…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["all", "initiated", "in_progress", "completed", "cancelled"].map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Last day</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Settlement</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">No offboarding cases yet.</TableCell>
                  </TableRow>
                ) : (
                  filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="font-medium">{c.employee_name}</div>
                        <div className="text-xs text-muted-foreground">{c.department} · {c.position}</div>
                      </TableCell>
                      <TableCell className="tabular-nums">{c.last_working_day}</TableCell>
                      <TableCell className="capitalize">{String(c.reason).replace(/_/g, " ")}</TableCell>
                      <TableCell className="min-w-[120px]">
                        <div className="mb-1 text-xs tabular-nums">{c.checklist_progress || 0}%</div>
                        <Progress value={Number(c.checklist_progress) || 0} className="h-2" />
                      </TableCell>
                      <TableCell>
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusTone(c.status))}>
                          {String(c.status).replace(/_/g, " ")}
                        </span>
                      </TableCell>
                      <TableCell className="tabular-nums">
                        GHS {Number(c.settlement_amount || 0).toLocaleString()}
                        <div className="text-[10px] uppercase text-muted-foreground">{c.settlement_status}</div>
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" onClick={() => setDetail(c)}>Manage</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Recommend?</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.cases || []).filter((c) => c.interview || ["initiated", "in_progress"].includes(c.status)).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No interviews.</TableCell>
                  </TableRow>
                ) : (
                  (data?.cases || [])
                    .filter((c) => c.interview || ["initiated", "in_progress"].includes(c.status))
                    .map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.employee_name}</TableCell>
                        <TableCell className="text-xs">
                          {c.interview?.scheduled_at ? new Date(c.interview.scheduled_at).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {c.exit_interview_completed ? "completed" : c.interview?.status || "pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {c.interview?.would_recommend == null
                            ? "—"
                            : c.interview.would_recommend
                              ? "Yes"
                              : "No"}
                        </TableCell>
                        <TableCell>
                          {!c.exit_interview_completed && (
                            <Button
                              size="sm"
                              className="rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                              onClick={() => {
                                setInterviewCaseId(c.id)
                                setInterviewOpen(true)
                              }}
                            >
                              Complete
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="assets" className="space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Serial</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Returned</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeAssets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No active assets to recover.</TableCell>
                  </TableRow>
                ) : (
                  activeAssets.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{a.asset_type}</TableCell>
                      <TableCell className="text-xs">{a.serial_number || "—"}</TableCell>
                      <TableCell className="capitalize">{a.condition}</TableCell>
                      <TableCell>{a.returned ? "Yes" : "No"}</TableCell>
                      <TableCell>
                        {!a.returned && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg"
                            disabled={saving}
                            onClick={() => void postAction({ action: "asset", id: a.id, returned: true })}
                          >
                            Mark returned
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-3">
          <div className="overflow-hidden rounded-2xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last day</TableHead>
                  <TableHead className="w-40" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.cases || []).filter((c) => c.status !== "cancelled").length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No settlements.</TableCell>
                  </TableRow>
                ) : (
                  (data?.cases || [])
                    .filter((c) => c.status !== "cancelled")
                    .map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.employee_name}</TableCell>
                        <TableCell className="tabular-nums">GHS {Number(c.settlement_amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{c.settlement_status}</Badge>
                        </TableCell>
                        <TableCell>{c.last_working_day}</TableCell>
                        <TableCell>
                          {c.settlement_status !== "paid" && (
                            <Button
                              size="sm"
                              className="rounded-lg bg-teal-700 text-white hover:bg-teal-800"
                              disabled={saving}
                              onClick={() => void postAction({ action: "settlement", id: c.id })}
                            >
                              <Wallet className="mr-1 h-3.5 w-3.5" />
                              Process payment
                            </Button>
                          )}
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
                <p className="font-semibold">AI / ML offboarding insights</p>
                <p className="text-sm text-muted-foreground">
                  Flags interview due dates, unreturned assets, settlement risk, process lag, and attrition patterns.
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
                  <div className="mb-2 flex items-center justify-between">
                    <Badge variant="outline" className="capitalize">{ins.insight_type?.replace(/_/g, " ")}</Badge>
                    {ins.confidence != null && (
                      <span className="text-xs text-muted-foreground">{Math.round(Number(ins.confidence) * 100)}% conf.</span>
                    )}
                  </div>
                  <p className="font-semibold">{ins.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{ins.body}</p>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Initiate */}
      <Dialog open={caseOpen} onOpenChange={setCaseOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Initiate offboarding</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {(data?.employees || []).map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Last working day</Label>
              <Input type="date" value={form.lastWorkingDay} onChange={(e) => setForm((f) => ({ ...f, lastWorkingDay: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Select value={form.reason} onValueChange={(v) => setForm((f) => ({ ...f, reason: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea rows={3} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCaseOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !form.employeeId || !form.lastWorkingDay}
              onClick={async () => {
                const ok = await postAction({ action: "case", ...form })
                if (ok) {
                  setCaseOpen(false)
                  setForm({ employeeId: "", lastWorkingDay: "", reason: "resignation", notes: "" })
                }
              }}
            >
              Start process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Interview */}
      <Dialog open={interviewOpen} onOpenChange={setInterviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Complete exit interview</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Interviewer</Label>
              <Input value={interviewForm.interviewer} onChange={(e) => setInterviewForm((f) => ({ ...f, interviewer: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Would recommend employer?</Label>
              <Select value={interviewForm.wouldRecommend} onValueChange={(v) => setInterviewForm((f) => ({ ...f, wouldRecommend: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Rehire eligible?</Label>
              <Select value={interviewForm.rehireEligible} onValueChange={(v) => setInterviewForm((f) => ({ ...f, rehireEligible: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Feedback</Label>
              <Textarea rows={4} value={interviewForm.feedback} onChange={(e) => setInterviewForm((f) => ({ ...f, feedback: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInterviewOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !interviewCaseId}
              onClick={async () => {
                const ok = await postAction({
                  action: "interview",
                  caseId: interviewCaseId,
                  status: "completed",
                  interviewer: interviewForm.interviewer,
                  feedback: interviewForm.feedback,
                  wouldRecommend: interviewForm.wouldRecommend === "true",
                  rehireEligible: interviewForm.rehireEligible === "true",
                })
                if (ok) setInterviewOpen(false)
              }}
            >
              Save interview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Case detail / checklist */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detail?.employee_name}</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="flex flex-wrap gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-semibold capitalize", statusTone(detail.status))}>
                  {String(detail.status).replace(/_/g, " ")}
                </span>
                <Badge variant="secondary" className="capitalize">{String(detail.reason).replace(/_/g, " ")}</Badge>
                <Badge variant="outline">Last day {detail.last_working_day}</Badge>
              </div>
              <div>
                <p className="mb-1 font-medium">Checklist ({detail.checklist_progress || 0}%)</p>
                <Progress value={Number(detail.checklist_progress) || 0} className="mb-3 h-2" />
                <ul className="space-y-2">
                  {(detail.checklist || []).map((item: any) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
                      <div>
                        <p className={cn("font-medium", item.is_done && "line-through text-muted-foreground")}>{item.label}</p>
                        <p className="text-[10px] uppercase text-muted-foreground">{item.category}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={item.is_done ? "outline" : "default"}
                        className={cn("rounded-lg", !item.is_done && "bg-teal-700 text-white hover:bg-teal-800")}
                        disabled={saving}
                        onClick={async () => {
                          await postAction({ action: "checklist", id: item.id, isDone: !item.is_done })
                          setDetail(null)
                        }}
                      >
                        {item.is_done ? "Undo" : "Done"}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
              {(detail.assets || []).length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Assets</p>
                  <ul className="space-y-1">
                    {(detail.assets || []).map((a: any) => (
                      <li key={a.id} className="flex justify-between text-xs">
                        <span>{a.name}</span>
                        <span className={a.returned ? "text-emerald-700" : "text-amber-700"}>
                          {a.returned ? "Returned" : "Outstanding"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
