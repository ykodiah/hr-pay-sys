"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
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
  Target,
  Star,
  TrendingUp,
  Users,
  Award,
  Plus,
  Sparkles,
  RefreshCw,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Trash2,
  BarChart3,
} from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Overview = {
  goals: any[]
  reviews: any[]
  competencies: any[]
  succession: any[]
  insights: any[]
  stats: {
    activeGoals: number
    completedGoals: number
    avgGoalProgress: number
    avgReviewScore: number
    pendingReviews: number
    highPerformers: number
    successionReady: number
  }
  charts: {
    ratingDistribution: { rating: string; count: number }[]
    departmentAvg: { department: string; avg: number; count: number }[]
    competencyRadar: { subject: string; score: number; fullMark: number }[]
  }
}

type EmpOpt = { id: string; name: string; code: string; department: string }

const CHART = ["#0d9488", "#14b8a6", "#2dd4bf", "#5eead4", "#99f6e4", "#f59e0b", "#f97316"]

function scoreBadge(score: number | null | undefined) {
  if (score == null) return "bg-slate-100 text-slate-600"
  if (score >= 4.5) return "bg-emerald-100 text-emerald-800"
  if (score >= 3.5) return "bg-teal-100 text-teal-800"
  if (score >= 2.5) return "bg-amber-100 text-amber-800"
  return "bg-rose-100 text-rose-800"
}

function PerformancePageInner() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab") || "overview"
  const [tab, setTab] = useState(tabParam)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState<Overview | null>(null)
  const [employees, setEmployees] = useState<EmpOpt[]>([])

  const [goalOpen, setGoalOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [compOpen, setCompOpen] = useState(false)
  const [succOpen, setSuccOpen] = useState(false)

  const [goalForm, setGoalForm] = useState({
    employeeId: "",
    title: "",
    description: "",
    category: "Individual",
    priority: "medium",
    targetValue: "",
    unit: "%",
    dueDate: "",
  })
  const [reviewForm, setReviewForm] = useState({
    employeeId: "",
    reviewType: "quarterly",
    periodStart: "",
    periodEnd: "",
    overallRating: "4",
    goalsScore: "4",
    competenciesScore: "4",
    strengths: "",
    areasForImprovement: "",
    comments: "",
    status: "completed",
  })
  const [compForm, setCompForm] = useState({
    employeeId: "",
    competencyName: "",
    category: "Core",
    currentLevel: "3",
    targetLevel: "4",
    assessedBy: "",
  })
  const [succForm, setSuccForm] = useState({
    employeeId: "",
    targetPosition: "",
    readinessLevel: "developing",
    readinessPercent: "50",
    potentialRating: "medium",
    developmentPlan: "",
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [perfRes, empRes] = await Promise.all([
        fetch("/api/performance", { credentials: "include", cache: "no-store" }),
        fetch("/api/employees?status=active", { credentials: "include", cache: "no-store" }),
      ])
      const perfJson = await perfRes.json().catch(() => ({}))
      const empJson = await empRes.json().catch(() => ({}))
      if (!perfRes.ok) throw new Error(perfJson.error || "Failed to load performance")
      setData(perfJson as Overview)
      const list = Array.isArray(empJson.data) ? empJson.data : Array.isArray(empJson) ? empJson : []
      setEmployees(
        list.map((e: any) => ({
          id: String(e.id),
          name: String(e.name || `${e.first_name || ""} ${e.last_name || ""}`.trim()),
          code: String(e.employeeId || e.employee_id || ""),
          department: String(e.department || ""),
        })),
      )
    } catch (e: any) {
      toast.error(e?.message || "Failed to load performance")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setTab(tabParam)
  }, [tabParam])

  async function postAction(body: Record<string, unknown>) {
    setSaving(true)
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Save failed")
      toast.success("Saved")
      await load()
      return true
    } catch (e: any) {
      toast.error(e?.message || "Save failed")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function generateInsights() {
    setSaving(true)
    try {
      const res = await fetch("/api/performance", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate_insights" }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "Insight generation failed")
      toast.success(`Generated ${json.generated ?? json.created ?? 0} AI insights`)
      await load()
    } catch (e: any) {
      toast.error(e?.message || "Failed")
    } finally {
      setSaving(false)
    }
  }

  const stats = data?.stats
  const insightIcon = (t: string) => {
    if (t === "risk") return <AlertTriangle className="h-4 w-4 text-rose-600" />
    if (t === "opportunity") return <Lightbulb className="h-4 w-4 text-amber-600" />
    if (t === "recommendation") return <Brain className="h-4 w-4 text-teal-700" />
    return <Sparkles className="h-4 w-4 text-emerald-600" />
  }

  const empName = useMemo(() => {
    const m = new Map(employees.map((e) => [e.id, e.name]))
    return (id: string) => m.get(id) || id.slice(0, 8)
  }, [employees])

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-700">Performance</p>
            <h1 className="text-2xl font-bold text-slate-900">Performance Management</h1>
            <p className="text-sm text-muted-foreground">
              Goals, reviews, competencies, succession — synced to your database with AI insights.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-xl" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button
              className="rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 text-white shadow-sm hover:from-teal-800 hover:to-teal-700"
              onClick={() => void generateInsights()}
              disabled={saving}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI insights
            </Button>
            <Button className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setGoalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New goal
            </Button>
            <Button variant="outline" className="rounded-xl border-teal-200" onClick={() => setReviewOpen(true)}>
              <Star className="mr-2 h-4 w-4" />
              New review
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Active goals", value: stats?.activeGoals ?? "—", icon: Target, tone: "from-teal-50 to-white" },
            { label: "Avg review score", value: stats?.avgReviewScore ?? "—", icon: Star, tone: "from-amber-50 to-white" },
            { label: "High performers", value: stats?.highPerformers ?? "—", icon: Award, tone: "from-emerald-50 to-white" },
            { label: "Succession ready", value: stats?.successionReady ?? "—", icon: Users, tone: "from-sky-50 to-white" },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "rounded-2xl border border-teal-100/80 bg-gradient-to-br p-4 shadow-sm",
                card.tone,
              )}
            >
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
              ["overview", "Overview", BarChart3],
              ["goals", "Goals", Target],
              ["reviews", "Reviews", Star],
              ["competencies", "Competencies", TrendingUp],
              ["succession", "Succession", Users],
              ["insights", "AI Insights", Brain],
            ].map(([value, label, Icon]) => (
              <TabsTrigger
                key={value as string}
                value={value as string}
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-teal-800 data-[state=active]:shadow-sm"
              >
                <Icon className="mr-1.5 h-3.5 w-3.5" />
                {label as string}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Rating distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.charts.ratingDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                        {(data?.charts.ratingDistribution || []).map((_, i) => (
                          <Cell key={i} fill={CHART[i % CHART.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-4 shadow-sm">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Competency radar</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={data?.charts.competencyRadar || []}>
                      <PolarGrid stroke="#cbd5e1" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                      <Radar dataKey="score" stroke="#0d9488" fill="#14b8a6" fillOpacity={0.35} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border bg-white p-4 shadow-sm lg:col-span-2">
                <h3 className="mb-3 text-sm font-semibold text-slate-800">Department average scores</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.charts.departmentAvg || []} layout="vertical" margin={{ left: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="department" width={120} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="avg" fill="#0d9488" radius={[0, 8, 8, 0]} />
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
                      {insightIcon(ins.insight_type)}
                      <Badge variant="outline" className="text-[10px] uppercase">
                        {ins.insight_type}
                      </Badge>
                    </div>
                    <p className="text-sm font-semibold text-slate-900">{ins.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-3">{ins.body}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="goals" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setGoalOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add goal
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.goals || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No goals yet. Create one to start tracking.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.goals || []).map((g: any) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.employee_name || empName(g.employee_id)}</TableCell>
                        <TableCell>
                          <div className="font-medium">{g.title}</div>
                          <div className="text-xs text-muted-foreground">{g.category}</div>
                        </TableCell>
                        <TableCell className="capitalize">{g.priority}</TableCell>
                        <TableCell className="min-w-[140px]">
                          <div className="mb-1 flex justify-between text-xs">
                            <span>{g.progress}%</span>
                            <span className="text-muted-foreground">
                              {g.current_value}/{g.target_value} {g.unit}
                            </span>
                          </div>
                          <Progress value={Number(g.progress) || 0} className="h-2" />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {String(g.status || "").replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{g.due_date || "—"}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => void postAction({ action: "delete", entity: "goal", id: g.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setReviewOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add review
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Strengths</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.reviews || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                        No reviews yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.reviews || []).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.employee_name || empName(r.employee_id)}</TableCell>
                        <TableCell className="capitalize">{r.review_type}</TableCell>
                        <TableCell className="text-xs">
                          {r.period_start || "—"} → {r.period_end || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", scoreBadge(Number(r.overall_rating)))}>
                            {r.overall_rating ?? "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                          {r.strengths || "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => void postAction({ action: "delete", entity: "review", id: r.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="competencies" className="space-y-3">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setCompOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Assess competency
              </Button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {(data?.competencies || []).length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed py-12 text-center text-muted-foreground">
                  No competency assessments yet.
                </div>
              ) : (
                (data?.competencies || []).map((c: any) => (
                  <div key={c.id} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{c.competency_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.employee_name || empName(c.employee_id)} · {c.category}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-rose-600"
                        onClick={() => void postAction({ action: "delete", entity: "competency", id: c.id })}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase text-slate-500">Current</p>
                        <p className="text-2xl font-bold text-teal-800">{c.current_level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase text-slate-500">Target</p>
                        <p className="text-lg font-semibold text-slate-700">{c.target_level}</p>
                      </div>
                    </div>
                    <Progress
                      className="mt-3 h-2"
                      value={Math.min(100, (Number(c.current_level) / Math.max(1, Number(c.target_level) || 5)) * 100)}
                    />
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="succession" className="space-y-3">
            <div className="flex justify-end">
              <Button size="sm" className="rounded-xl bg-teal-700 text-white hover:bg-teal-800" onClick={() => setSuccOpen(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add plan
              </Button>
            </div>
            <div className="overflow-hidden rounded-2xl border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Target role</TableHead>
                    <TableHead>Readiness</TableHead>
                    <TableHead>Potential</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.succession || []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                        No succession plans yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    (data?.succession || []).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{s.employee_name || empName(s.employee_id)}</TableCell>
                        <TableCell>{s.target_position}</TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <div className="mb-1 flex justify-between text-xs capitalize">
                              <span>{s.readiness_level?.replace(/_/g, " ")}</span>
                              <span>{s.readiness_percent}%</span>
                            </div>
                            <Progress value={Number(s.readiness_percent) || 0} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{s.potential_rating}</TableCell>
                        <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground">
                          {s.development_plan || "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-rose-600"
                            onClick={() => void postAction({ action: "delete", entity: "succession", id: s.id })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
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
                <div className="rounded-xl bg-teal-700 p-2 text-white">
                  <Brain className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">AI / ML performance insights</p>
                  <p className="text-sm text-muted-foreground">
                    Heuristic models score goal completion risk, high performers, competency gaps, and succession readiness from live data.
                  </p>
                </div>
              </div>
              <Button
                className="rounded-xl bg-gradient-to-r from-teal-700 to-emerald-600 text-white hover:from-teal-800 hover:to-emerald-700"
                onClick={() => void generateInsights()}
                disabled={saving}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Run analysis
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
                      <div className="flex items-center gap-2">
                        {insightIcon(ins.insight_type)}
                        <Badge variant="outline" className="capitalize">
                          {ins.insight_type}
                        </Badge>
                        {ins.severity && (
                          <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 capitalize">{ins.severity}</Badge>
                        )}
                      </div>
                      {ins.confidence != null && (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {Math.round(Number(ins.confidence) * 100)}% conf.
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900">{ins.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{ins.body}</p>
                    {ins.employee_name && (
                      <p className="mt-2 text-xs font-medium text-teal-800">
                        <CheckCircle2 className="mr-1 inline h-3 w-3" />
                        {ins.employee_name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Goal dialog */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create performance goal</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select value={goalForm.employeeId} onValueChange={(v) => setGoalForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name} ({e.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Title</Label>
              <Input value={goalForm.title} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={goalForm.category} onValueChange={(v) => setGoalForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Individual", "Team", "Company", "Development"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={goalForm.priority} onValueChange={(v) => setGoalForm((f) => ({ ...f, priority: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low", "medium", "high", "critical"].map((c) => (
                    <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target</Label>
              <Input value={goalForm.targetValue} onChange={(e) => setGoalForm((f) => ({ ...f, targetValue: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Unit</Label>
              <Input value={goalForm.unit} onChange={(e) => setGoalForm((f) => ({ ...f, unit: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input type="date" value={goalForm.dueDate} onChange={(e) => setGoalForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Description</Label>
              <Textarea value={goalForm.description} onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !goalForm.employeeId || !goalForm.title}
              onClick={async () => {
                const ok = await postAction({
                  action: "goal",
                  employeeId: goalForm.employeeId,
                  title: goalForm.title,
                  description: goalForm.description,
                  category: goalForm.category,
                  priority: goalForm.priority,
                  targetValue: Number(goalForm.targetValue) || 100,
                  unit: goalForm.unit,
                  dueDate: goalForm.dueDate || null,
                })
                if (ok) setGoalOpen(false)
              }}
            >
              Save goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create performance review</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Employee</Label>
              <Select value={reviewForm.employeeId} onValueChange={(v) => setReviewForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={reviewForm.reviewType} onValueChange={(v) => setReviewForm((f) => ({ ...f, reviewType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["probation", "quarterly", "mid_year", "annual", "project"].map((t) => (
                    <SelectItem key={t} value={t} className="capitalize">{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Overall rating (1–5)</Label>
              <Input type="number" min={1} max={5} step={0.1} value={reviewForm.overallRating} onChange={(e) => setReviewForm((f) => ({ ...f, overallRating: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Period start</Label>
              <Input type="date" value={reviewForm.periodStart} onChange={(e) => setReviewForm((f) => ({ ...f, periodStart: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Period end</Label>
              <Input type="date" value={reviewForm.periodEnd} onChange={(e) => setReviewForm((f) => ({ ...f, periodEnd: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Goals score</Label>
              <Input type="number" min={1} max={5} step={0.1} value={reviewForm.goalsScore} onChange={(e) => setReviewForm((f) => ({ ...f, goalsScore: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Competencies score</Label>
              <Input type="number" min={1} max={5} step={0.1} value={reviewForm.competenciesScore} onChange={(e) => setReviewForm((f) => ({ ...f, competenciesScore: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Strengths</Label>
              <Textarea rows={2} value={reviewForm.strengths} onChange={(e) => setReviewForm((f) => ({ ...f, strengths: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <Label>Areas for improvement</Label>
              <Textarea rows={2} value={reviewForm.areasForImprovement} onChange={(e) => setReviewForm((f) => ({ ...f, areasForImprovement: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !reviewForm.employeeId}
              onClick={async () => {
                const ok = await postAction({
                  action: "review",
                  employeeId: reviewForm.employeeId,
                  reviewType: reviewForm.reviewType,
                  periodStart: reviewForm.periodStart || null,
                  periodEnd: reviewForm.periodEnd || null,
                  overallRating: Number(reviewForm.overallRating),
                  goalsScore: Number(reviewForm.goalsScore),
                  competenciesScore: Number(reviewForm.competenciesScore),
                  strengths: reviewForm.strengths,
                  areasForImprovement: reviewForm.areasForImprovement,
                  comments: reviewForm.comments,
                  status: reviewForm.status,
                })
                if (ok) setReviewOpen(false)
              }}
            >
              Save review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Competency dialog */}
      <Dialog open={compOpen} onOpenChange={setCompOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assess competency</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={compForm.employeeId} onValueChange={(v) => setCompForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Competency</Label>
              <Input value={compForm.competencyName} onChange={(e) => setCompForm((f) => ({ ...f, competencyName: e.target.value }))} placeholder="e.g. Leadership" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Current (1–5)</Label>
                <Input type="number" min={1} max={5} value={compForm.currentLevel} onChange={(e) => setCompForm((f) => ({ ...f, currentLevel: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Target (1–5)</Label>
                <Input type="number" min={1} max={5} value={compForm.targetLevel} onChange={(e) => setCompForm((f) => ({ ...f, targetLevel: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !compForm.employeeId || !compForm.competencyName}
              onClick={async () => {
                const ok = await postAction({
                  action: "competency",
                  employeeId: compForm.employeeId,
                  competencyName: compForm.competencyName,
                  category: compForm.category,
                  currentLevel: Number(compForm.currentLevel),
                  targetLevel: Number(compForm.targetLevel),
                  assessedBy: compForm.assessedBy || null,
                })
                if (ok) setCompOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Succession dialog */}
      <Dialog open={succOpen} onOpenChange={setSuccOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Succession plan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>Employee</Label>
              <Select value={succForm.employeeId} onValueChange={(v) => setSuccForm((f) => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target position</Label>
              <Input value={succForm.targetPosition} onChange={(e) => setSuccForm((f) => ({ ...f, targetPosition: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Readiness</Label>
                <Select value={succForm.readinessLevel} onValueChange={(v) => setSuccForm((f) => ({ ...f, readinessLevel: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["ready_now", "ready_1_2_years", "ready_3_plus", "developing"].map((r) => (
                      <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Percent</Label>
                <Input type="number" min={0} max={100} value={succForm.readinessPercent} onChange={(e) => setSuccForm((f) => ({ ...f, readinessPercent: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Development plan</Label>
              <Textarea rows={3} value={succForm.developmentPlan} onChange={(e) => setSuccForm((f) => ({ ...f, developmentPlan: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuccOpen(false)}>Cancel</Button>
            <Button
              className="bg-teal-700 text-white hover:bg-teal-800"
              disabled={saving || !succForm.employeeId || !succForm.targetPosition}
              onClick={async () => {
                const ok = await postAction({
                  action: "succession",
                  employeeId: succForm.employeeId,
                  targetPosition: succForm.targetPosition,
                  readinessLevel: succForm.readinessLevel,
                  readinessPercent: Number(succForm.readinessPercent),
                  potentialRating: succForm.potentialRating,
                  developmentPlan: succForm.developmentPlan,
                })
                if (ok) setSuccOpen(false)
              }}
            >
              Save plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function PerformancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading performance…</div>}>
      <PerformancePageInner />
    </Suspense>
  )
}
